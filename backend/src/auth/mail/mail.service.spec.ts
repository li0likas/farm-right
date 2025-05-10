import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map = {
        'email.from': 'test@farmright.com',
        'app.baseUrl': 'http://test-app.com',
      };
      return map[key] ?? null;
    }),
  };

  const baseUser: User = {
    id: 2,
    email: 'jane@example.com',
    username: 'Jane',
    birthDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    hash: 'hashed-value',
    resetPassToken: 'token123',
    isResetValid: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);

    jest.clearAllMocks();
  });

  describe('sendForgotPass', () => {
    it('should call sendMail with reset password details', async () => {
      const token = 'reset-token-123';

      await service.sendForgotPass(baseUser, token);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: baseUser.email,
        subject: 'Reset your Password!',
        template: './forgot',
        context: {
          name: baseUser.username,
          url: `http://test-app.com/resetPassword/${token}`,
        },
      });
    });
  });

  describe('sendFarmInvitation', () => {
    it('should call sendMail with farm invitation details', async () => {
      const token = 'invite-token-abc';
      const farmName = 'Green Acres';

      await service.sendFarmInvitation(baseUser, token, farmName);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: baseUser.email,
        subject: `You're invited to join ${farmName}`,
        template: './farmInvitation',
        context: {
          name: baseUser.username || baseUser.email.split('@')[0],
          farmName,
          url: `http://test-app.com/invitation/${token}`,
        },
      });
    });
  });
});
