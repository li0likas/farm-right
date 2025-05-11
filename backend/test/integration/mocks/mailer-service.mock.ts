import { Injectable } from '@nestjs/common';
import { ISendMailOptions } from '@nestjs-modules/mailer';

@Injectable()
export class MailerServiceMock {
  async sendMail(options: ISendMailOptions): Promise<any> {
    console.log('Mock MailerService.sendMail called with:', options);
    return Promise.resolve({ messageId: 'mocked-message-id' });
  }

  addTransporter(name: string, config: any): string {
    return 'mocked-transporter-id';
  }
}
