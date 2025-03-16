import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
    constructor(config: ConfigService, private prisma: PrismaService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('JWT_SECRET'),
        });
    }

    async validate(payload: {sub: number, email: string}){

        if (!payload || !payload.sub) {
            throw new UnauthorizedException('Invalid token');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub }
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        delete user.hash;
        return user;
    }
}
