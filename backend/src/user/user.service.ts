import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from "src/prisma/prisma.service";
import { User } from '.prisma/client';


@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {
    }

    async getUserById(id: number): Promise<User | null> {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: id
                }
            });
            return user;
        } catch (error) {
            throw new Error('Error fetching user by ID: ' + error.message);
        }
    }

    async findAllUsers() {
      return this.prisma.user.findMany();
    }

    async changeUsername(userId: number, newUsername: string): Promise<void> {
        const existingUser = await this.prisma.user.findUnique({
          where: { username: newUsername },
        });
    
        if (existingUser) {
          throw new Error('Username is already taken');
        }
    
        await this.prisma.user.update({
          where: { id: userId },
          data: { username: newUsername },
        });
    }

    async getUserFarms(userId: number) {
      return this.prisma.farm.findMany({
        where: {
          OR: [
            { ownerId: userId }, // User is the farm owner
            { members: { some: { userId } } } // User is a farm member
          ]
        }
      });
    }

    async getUserPermissions(userId: number, farmId: number) {
      const farmMember = await this.prisma.farmMember.findUnique({
          where: { userId_farmId: { userId, farmId } },
          include: {
              role: {
                  include: {
                      farmPermissions: {
                          where: { farmId },
                          include: { permission: true }
                      }
                  }
              }
          }
      });
  
      if (!farmMember) {
          throw new HttpException('User does not belong to the selected farm.', HttpStatus.FORBIDDEN);
      }
  
      return farmMember.role.farmPermissions.map(fp => fp.permission.name);
  }  
}

export { User };
