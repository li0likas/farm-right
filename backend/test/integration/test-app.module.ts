import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { AiService } from '../../src/ai/ai.service';
import { WeatherService } from '../../src/weather/weather.service';
import { AiServiceMock } from './mocks/ai-service.mock';
import { WeatherServiceMock } from './mocks/weather-service.mock';
import { MailerServiceMock } from './mocks/mailer-service.mock';
import { MailService } from '../../src/auth/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';

class MailServiceMock {
  async sendForgotPass(user: any, token: string) {
    return true;
  }

  async sendFarmInvitation(user: any, token: string, farmName: string) {
    return true;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    AppModule,
  ],
  providers: [
    {
      provide: AiService,
      useClass: AiServiceMock,
    },
    {
      provide: WeatherService,
      useClass: WeatherServiceMock,
    },
    {
      provide: MailService,
      useClass: MailServiceMock,
    },
    {
      provide: MailerService,
      useValue: MailerServiceMock,
    },
  ],
})
export class TestAppModule {}