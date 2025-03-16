import { ForbiddenException, NotFoundException, Injectable } from "@nestjs/common"; 
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto, AuthlogDto, AuthForgDto, AuthpassDto } from "./dto";
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { MailService } from './mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService, private mailService: MailService) {}

  async signin(dto: AuthlogDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        memberships: { include: { role: true, farm: true } } // Fetch farms and roles
      }
    });
  
    if (!user) {
      throw new ForbiddenException('Incorrect credentials');
    }
  
    const pwMatches = await argon.verify(user.hash, dto.password);
    if (!pwMatches) {
      throw new ForbiddenException('Incorrect credentials');
    }
  
    // Extract farm details
    const farms = user.memberships.map(membership => ({
      farmId: membership.farm.id,
      farmName: membership.farm.name,
      role: membership.role.name
    }));
  
    const accessToken = await this.signToken(user.id, user.email, farms);
  
    return {
      access_token: accessToken, // Ensure correct token format
      farms // Return farms list for frontend selection
    };
  }  

  async signup(dto: AuthDto, profileURL: string) {
    if (dto.password.length < 5) {
      throw new ForbiddenException('Password must be at least 5 characters long');
    }

    if (!dto.email.match(/^\S+@\S+\.\S+$/)) {
      throw new ForbiddenException("Invalid email provided");
    }

    const hash = await argon.hash(dto.password);
    
    try {
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: 'FARMER' } // Assign default FARMER role to new users
      });

      if (!defaultRole) {
        throw new ForbiddenException('Default role not found');
      }

      const user = await this.prisma.user.create({
        data: {
          username: dto.name,
          email: dto.email,
          hash,
          profile_picture: profileURL,
        },
      });

      // Create the user's farm and assign them as the FARMER
      const farm = await this.prisma.farm.create({
        data: {
          name: `${dto.name}'s Farm`,
          ownerId: user.id,
        }
      });

      // Assign the FARMER role to the user for their farm
      await this.prisma.farmMember.create({
        data: {
          userId: user.id,
          farmId: farm.id,
          roleId: defaultRole.id
        }
      });

      const accessToken = await this.signToken(user.id, user.email, [{ farmId: farm.id, farmName: farm.name, role: defaultRole.name }]);

      return {
        access_token: accessToken,
        farms: [{ farmId: farm.id, farmName: farm.name, role: defaultRole.name }]
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        if (error.message.includes('email')) {
          throw new ForbiddenException('Email is already taken');
        } else if (error.message.includes('username')) {
          throw new ForbiddenException('Username is already taken');
        }
      }
      throw error;
    }
  }

  async signToken(userId: number, email: string, farms: any[]): Promise<string> {
    const payload = {
      sub: userId,
      email,
      farms // Include farms in the JWT payload
    };
  
    const secret = this.config.get('JWT_SECRET');
    return this.jwt.signAsync(payload, { expiresIn: '60m', secret });
  }

  async sendForgot(dto: AuthForgDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

      if (user) {
        const token = await this.resetToken(user.id, user.email);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { resetPassToken: token, isResetValid: true }
        });

        await this.mailService.sendForgotPass(user, token);
        return true;
      } else {
        throw new ForbiddenException('Email does not exist');
      }
    } catch (e) {
      throw e;
    }
  }

  async passReset(dto: AuthpassDto, email: string) {
    const hash = await argon.hash(dto.newPassword);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isResetValid) {
      throw new ForbiddenException('Password could not be updated');
    }

    await this.prisma.user.update({
      where: { email },
      data: { hash, resetPassToken: "", isResetValid: false },
    });
  }

  async passChange(oldPassword: string, newPassword: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await argon.verify(user.hash, oldPassword);
    if (!isOldPasswordValid) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const newHash = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { hash: newHash, resetPassToken: '', isResetValid: false },
    });
  }

  async resetToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');
    return this.jwt.signAsync(payload, { expiresIn: '30m', secret });
  }
}
