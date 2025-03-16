import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log("✅ JwtAuthGuard is being executed"); // DEBUGGING
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.error("🚨 JwtAuthGuard error:", err || info);
      throw err || new UnauthorizedException('Invalid or missing token');
    }
    console.log("✅ User authenticated:", user);
    return user;
  }
}
