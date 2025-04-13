import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly fromEmail: string;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService
  ) {
    this.fromEmail = this.configService.get<string>('email.from') || 'noreply@gmail.com';
  }

  async sendForgotPass(user: User, token: string) {
    const baseUrl = this.configService.get<string>('app.baseUrl') || 'http://localhost:3000';
    const url = `${baseUrl}/resetPassword/${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset your Password!',
      template: './forgot',
      context: {
        name: user.username,
        url,
      },
    });
  }

  async sendFarmInvitation(user: User, token: string, farmName: string) {
    const baseUrl = this.configService.get<string>('app.baseUrl') || 'http://localhost:3000';
    const url = `${baseUrl}/invitation/${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: `You're invited to join ${farmName}`,
      template: './farmInvitation',
      context: {
        name: user.username || user.email.split('@')[0],
        farmName,
        url,
      },
    });
  }
}