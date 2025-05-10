import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto, AuthlogDto, AuthForgDto, AuthpassDto } from './dto';
import { HttpException, HttpStatus } from '@nestjs/common';

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

    it('should handle exceptions from auth service', async () => {
      const dto: AuthDto = {
        name: 'Test',
        email: 'test@example.com',
        password: '12345',
      };
      const files = [];
      const errorMessage = 'Email is already taken';
      
      mockAuthService.signup.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(controller.signup(dto, files)).rejects.toThrow(HttpException);
      expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
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

    it('should handle exceptions from auth service', async () => {
      const dto: AuthlogDto = {
        username: 'testuser',
        password: 'wrong-password',
      };
      const errorMessage = 'Incorrect credentials';
      
      mockAuthService.signin.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(controller.signin(dto)).rejects.toThrow(HttpException);
      expect(mockAuthService.signin).toHaveBeenCalledWith(dto);
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

    it('should handle exceptions from auth service', async () => {
      const dto: AuthForgDto = { email: 'nonexistent@example.com' };
      const errorMessage = 'Email does not exist';
      
      mockAuthService.sendForgot.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(controller.forgot(dto)).rejects.toThrow(HttpException);
      expect(mockAuthService.sendForgot).toHaveBeenCalledWith(dto);
    });
  });

  describe('passReset', () => {
    it('should call service with correct params', async () => {
      const dto: AuthpassDto = { newPassword: 'newpass' };
      const mockReq = { user: { email: 'user@example.com' } };

      mockAuthService.passReset.mockResolvedValue(undefined);

      const result = await controller.passReset(dto, mockReq);

      expect(mockAuthService.passReset).toHaveBeenCalledWith(dto, mockReq.user.email);
      expect(result).toBeUndefined();
    });

    it('should handle exceptions from auth service', async () => {
      const dto: AuthpassDto = { newPassword: 'newpass' };
      const mockReq = { user: { email: 'user@example.com' } };
      const errorMessage = 'Password could not be updated';
      
      mockAuthService.passReset.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(controller.passReset(dto, mockReq)).rejects.toThrow(HttpException);
      expect(mockAuthService.passReset).toHaveBeenCalledWith(dto, mockReq.user.email);
    });
  });

  describe('passChange', () => {
    it('should call passChange and return success message', async () => {
      const body = { oldPassword: 'old', newPassword: 'new' };
      const req = { user: { email: 'user@example.com' } };

      mockAuthService.passChange.mockResolvedValue(undefined);

      const result = await controller.passChange(body, req);

      expect(mockAuthService.passChange).toHaveBeenCalledWith('old', 'new', 'user@example.com');
      expect(result).toEqual({ message: 'Password change successful' });
    });

    it('should handle exceptions from auth service', async () => {
      const body = { oldPassword: 'wrong', newPassword: 'new' };
      const req = { user: { email: 'user@example.com' } };
      const errorMessage = 'Old password is incorrect';
      
      mockAuthService.passChange.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(controller.passChange(body, req)).rejects.toThrow(HttpException);
      expect(mockAuthService.passChange).toHaveBeenCalledWith('wrong', 'new', 'user@example.com');
    });
  });

  // Test file upload handling in signup
  describe('file upload handling', () => {
    it('should handle file uploads during signup', async () => {
      const dto: AuthDto = {
        name: 'Test',
        email: 'test@example.com',
        password: '12345',
      };
      
      const mockFiles = [
        {
          fieldname: 'file',
          originalname: 'profile.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test image content'),
          size: 12345
        }
      ];
      
      const expected = { access_token: 'mock-token', farms: [] };
      mockAuthService.signup.mockResolvedValue(expected);

      const result = await controller.signup(dto, mockFiles);

      expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });
});