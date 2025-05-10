
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../src/auth/mail/mail.service';
import { AuthDto, AuthlogDto, AuthForgDto, AuthpassDto } from '../../src/auth/dto';
import * as argon from 'argon2';

// Mock external dependencies
jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

const mockPrismaAuthService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockMailService = {
  sendForgotPass: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();

    // Setup default mock implementation for config
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.expiresIn') return '1h';
      return undefined;
    });
  });

  describe('signup', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const authDto: AuthDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashed-password';
      const createdUser = { 
        id: 1, 
        username: authDto.name, 
        email: authDto.email,
        hash: hashedPassword,
      };
      const token = 'jwt-token';

      (argon.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaAuthService.user.create.mockResolvedValue(createdUser);
      mockJwtService.signAsync.mockResolvedValue(token);

      // Act
      const result = await authService.signup(authDto);

      // Assert
      expect(argon.hash).toHaveBeenCalledWith(authDto.password);
      expect(mockPrismaAuthService.user.create).toHaveBeenCalledWith({
        data: {
          username: authDto.name,
          email: authDto.email,
          hash: hashedPassword,
        },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: token,
        farms: [],
      });
    });

    it('should throw ForbiddenException if password is too short', async () => {
      // Arrange
      const authDto: AuthDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'pwd', // Too short
      };

      // Act & Assert
      await expect(authService.signup(authDto)).rejects.toThrow(ForbiddenException);
      expect(argon.hash).not.toHaveBeenCalled();
      expect(mockPrismaAuthService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if email format is invalid', async () => {
      // Arrange
      const authDto: AuthDto = {
        name: 'Test User',
        email: 'invalid-email', // Invalid format
        password: 'password123',
      };

      // Act & Assert
      await expect(authService.signup(authDto)).rejects.toThrow(ForbiddenException);
      expect(argon.hash).not.toHaveBeenCalled();
      expect(mockPrismaAuthService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    it('should authenticate a user successfully', async () => {
      // Arrange
      const authlogDto: AuthlogDto = {
        username: 'testuser',
        password: 'password123',
      };
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        hash: 'hashed-password',
        memberships: [
          { 
            farm: { id: 1, name: 'Test Farm' }, 
            role: { name: 'OWNER' } 
          }
        ],
      };
      const token = 'jwt-token';
      const farms = [
        { farmId: 1, farmName: 'Test Farm', role: 'OWNER' }
      ];

      mockPrismaAuthService.user.findUnique.mockResolvedValue(user);
      (argon.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(token);

      // Act
      const result = await authService.signin(authlogDto);

      // Assert
      expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({
        where: { username: authlogDto.username },
        include: { memberships: { include: { role: true, farm: true } } }
      });
      expect(argon.verify).toHaveBeenCalledWith(user.hash, authlogDto.password);
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: token,
        farms,
      });
    });

    it('should throw ForbiddenException if user not found', async () => {
      // Arrange
      const authlogDto: AuthlogDto = {
        username: 'testuser',
        password: 'password123',
      };

      mockPrismaAuthService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.signin(authlogDto)).rejects.toThrow(ForbiddenException);
      expect(argon.verify).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if password is incorrect', async () => {
      // Arrange
      const authlogDto: AuthlogDto = {
        username: 'testuser',
        password: 'wrong-password',
      };
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        hash: 'hashed-password',
        memberships: [],
      };

      mockPrismaAuthService.user.findUnique.mockResolvedValue(user);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.signin(authlogDto)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({
        where: { username: authlogDto.username },
        include: { memberships: { include: { role: true, farm: true } } }
      });
      expect(argon.verify).toHaveBeenCalledWith(user.hash, authlogDto.password);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('sendForgot', () => {
    it('should send forgot password email successfully', async () => {
      // Arrange
      const authForgDto: AuthForgDto = {
        email: 'test@example.com',
      };
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        hash: 'hashed-password',
      };
      const token = 'reset-token';

      mockPrismaAuthService.user.findUnique.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue(token);
      mockPrismaAuthService.user.update.mockResolvedValue({ ...user, resetPassToken: token, isResetValid: true });
      mockMailService.sendForgotPass.mockResolvedValue(undefined);

      // Act
      const result = await authService.sendForgot(authForgDto);

      // Assert
      expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: authForgDto.email } 
      });
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(mockPrismaAuthService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { resetPassToken: token, isResetValid: true },
      });
      expect(mockMailService.sendForgotPass).toHaveBeenCalledWith(user, token);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if email not found', async () => {
      // Arrange
      const authForgDto: AuthForgDto = {
        email: 'nonexistent@example.com',
      };

      mockPrismaAuthService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.sendForgot(authForgDto)).rejects.toThrow(ForbiddenException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      expect(mockPrismaAuthService.user.update).not.toHaveBeenCalled();
      expect(mockMailService.sendForgotPass).not.toHaveBeenCalled();
    });
  });

describe('passReset', () => {
  beforeEach(() => {
    // Important: Clear all mock function calls between tests
    jest.clearAllMocks();
  });

  it('should reset password successfully', async () => {
    // Arrange
    const authpassDto: AuthpassDto = {
      newPassword: 'new-password123',
    };
    const email = 'test@example.com';
    const user = {
      id: 1,
      username: 'testuser',
      email,
      hash: 'old-hash',
      resetPassToken: 'valid-token',
      isResetValid: true,
    };
    const newHash = 'new-hash';

    mockPrismaAuthService.user.findUnique.mockResolvedValue(user);
    (argon.hash as jest.Mock).mockResolvedValue(newHash);
    mockPrismaAuthService.user.update.mockResolvedValue({
      ...user,
      hash: newHash,
      resetPassToken: '',
      isResetValid: false,
    });

    // Act
    await authService.passReset(authpassDto, email);

    // Assert
    expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
    expect(argon.hash).toHaveBeenCalledWith(authpassDto.newPassword);
    expect(mockPrismaAuthService.user.update).toHaveBeenCalledWith({
      where: { email },
      data: { hash: newHash, resetPassToken: "", isResetValid: false },
    });
  });

  it('should throw ForbiddenException if user not found or reset token invalid', async () => {
    // Arrange
    const authpassDto: AuthpassDto = {
      newPassword: 'new-password123',
    };
    const email = 'test@example.com';
    const user = {
      id: 1,
      username: 'testuser',
      email,
      hash: 'old-hash',
      resetPassToken: 'token',
      isResetValid: false, // Invalid reset token
    };

    // Need to clear previous test's mock calls
    jest.clearAllMocks();
    
    mockPrismaAuthService.user.findUnique.mockResolvedValue(user);

    // Act & Assert
    await expect(authService.passReset(authpassDto, email)).rejects.toThrow(ForbiddenException);
    expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
    expect(argon.hash).not.toHaveBeenCalled();
    expect(mockPrismaAuthService.user.update).not.toHaveBeenCalled();
  });
});


  describe('passChange', () => {
    it('should change password successfully', async () => {
      // Arrange
      const oldPassword = 'old-password';
      const newPassword = 'new-password123';
      const email = 'test@example.com';
      const user = {
        id: 1,
        username: 'testuser',
        email,
        hash: 'old-hash',
      };
      const newHash = 'new-hash';

      mockPrismaAuthService.user.findUnique.mockResolvedValue(user);
      (argon.verify as jest.Mock).mockResolvedValue(true);
      (argon.hash as jest.Mock).mockResolvedValue(newHash);
      mockPrismaAuthService.user.update.mockResolvedValue({
        ...user,
        hash: newHash,
        resetPassToken: '',
        isResetValid: false,
      });

      // Act
      await authService.passChange(oldPassword, newPassword, email);

      // Assert
      expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(argon.verify).toHaveBeenCalledWith(user.hash, oldPassword);
      expect(argon.hash).toHaveBeenCalledWith(newPassword);
      expect(mockPrismaAuthService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { hash: newHash, resetPassToken: '', isResetValid: false },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      const oldPassword = 'old-password';
      const newPassword = 'new-password123';
      const email = 'nonexistent@example.com';

      mockPrismaAuthService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.passChange(oldPassword, newPassword, email)).rejects.toThrow(NotFoundException);
      expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(argon.verify).not.toHaveBeenCalled();
      expect(argon.hash).not.toHaveBeenCalled();
      expect(mockPrismaAuthService.user.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if old password is incorrect', async () => {
      // Arrange
      const oldPassword = 'wrong-password';
      const newPassword = 'new-password123';
      const email = 'test@example.com';
      const user = {
        id: 1,
        username: 'testuser',
        email,
        hash: 'old-hash',
      };

      mockPrismaAuthService.user.findUnique.mockResolvedValue(user);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.passChange(oldPassword, newPassword, email)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaAuthService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(argon.verify).toHaveBeenCalledWith(user.hash, oldPassword);
      expect(argon.hash).not.toHaveBeenCalled();
      expect(mockPrismaAuthService.user.update).not.toHaveBeenCalled();
    });
  });
});