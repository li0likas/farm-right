import { 
  Body, 
  Controller, 
  Post, 
  Req, 
  UseGuards, 
  HttpException, 
  HttpStatus, 
  UseInterceptors, 
  UploadedFiles 
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import { AuthDto, AuthlogDto, AuthForgDto, AuthpassDto } from "./dto";
import { AuthGuard } from "@nestjs/passport";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import path = require('path');
import { diskStorage, Multer } from 'multer';
import { v4 as uuidv4 } from 'uuid';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    @UseInterceptors(AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination = "./uploads/userimages";
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const filename = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
          const extension = path.parse(file.originalname).ext;
          cb(null, `${filename}${extension}`);
        },
      }),
    }))
    async signup(@Body() dto: AuthDto, @UploadedFiles() files: Array<Multer.File>) {
        try {
            let profileFN = null;
            if (files.length > 0) {
                profileFN = process.env.USER_PHOTO_PATH + files[0].filename;
            }

            const { access_token, farms } = await this.authService.signup(dto, profileFN);

            return { access_token, farms }; // Ensure correct token naming
        } catch (error) {
            console.error("Signup Error:", error);
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('signin')
    async signin(@Body() dto: AuthlogDto) {
        try {
            console.log("Login Attempt:", dto);
            const { access_token, farms } = await this.authService.signin(dto);

            return { access_token, farms }; // Ensure token format matches standard
        } catch (error) {
            console.error("Signin Error:", error);
            throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        }
    }

    @Post('forgotPass')
    async forgot(@Body() dto: AuthForgDto) {
        try {
            console.log("Forgot password request:", dto);
            return this.authService.sendForgot(dto);
        } catch (error) {
            console.error("Forgot Password Error:", error);
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('passReset')
    async passReset(@Body() dto: AuthpassDto, @Req() req) {
        try {
            return this.authService.passReset(dto, req.user.email);
        } catch (error) {
            console.error("Password Reset Error:", error);
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('passChange')
    async passChange(@Body() body: { oldPassword: string, newPassword: string }, @Req() req) {
      try {
        const email = req.user.email;
        await this.authService.passChange(body.oldPassword, body.newPassword, email);
  
        return { message: 'Password change successful' };
      } catch (error) {
        console.error("Password Change Error:", error);
        throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
}
