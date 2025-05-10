import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto, AuthlogDto, AuthForgDto, AuthpassDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
    sendForgot: jest.fn(),
    passReset: jest.fn(),
    passChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should return access token and farms', async () => {
      const dto: AuthDto = {
        name: 'Test',
        email: 'test@example.com',
        password: '12345',
      };
      const files = [];
      const expected = { access_token: 'mock-token', farms: [] };

      mockAuthService.signup.mockResolvedValue(expected);

      const result = await controller.signup(dto, files);

      expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('signin', () => {
    it('should return access token and farms', async () => {
      const dto: AuthlogDto = {
        username: 'testuser',
        password: 'password',
      };
      const expected = { access_token: 'mock-token', farms: [] };

      mockAuthService.signin.mockResolvedValue(expected);

      const result = await controller.signin(dto);

      expect(mockAuthService.signin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('forgot', () => {
    it('should return true on success', async () => {
      const dto: AuthForgDto = { email: 'test@example.com' };
      mockAuthService.sendForgot.mockResolvedValue(true);

      const result = await controller.forgot(dto);

      expect(mockAuthService.sendForgot).toHaveBeenCalledWith(dto);
      expect(result).toBe(true);
    });
  });

  describe('passReset', () => {
    it('should call service with correct params', async () => {
      const dto: AuthpassDto = { newPassword: 'newpass' };
      const mockReq = { user: { email: 'user@example.com' } };

      await controller.passReset(dto, mockReq);

      expect(mockAuthService.passReset).toHaveBeenCalledWith(dto, mockReq.user.email);
    });
  });

  describe('passChange', () => {
    it('should call passChange and return success message', async () => {
      const body = { oldPassword: 'old', newPassword: 'new' };
      const req = { user: { email: 'user@example.com' } };

      const result = await controller.passChange(body, req);

      expect(mockAuthService.passChange).toHaveBeenCalledWith('old', 'new', 'user@example.com');
      expect(result).toEqual({ message: 'Password change successful' });
    });
  });
});
