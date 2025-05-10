import { Test, TestingModule } from '@nestjs/testing';
import { FarmInvitationService } from '../../src/farm-members/farm-invitation.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../src/auth/mail/mail.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

describe('FarmInvitationService', () => {
  let service: FarmInvitationService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let mailService: MailService;

  const mockPrismaService = {
    farm: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    farmMember: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    farmInvitation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailService = {
    sendFarmInvitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmInvitationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<FarmInvitationService>(FarmInvitationService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    mailService = module.get<MailService>(MailService);

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const values = {
        'jwt.secret': 'test-secret',
        'jwt.farmInvitationExpires': '7d',
        'app.baseUrl': 'http://localhost:3000',
      };
      return values[key];
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    const farmId = 1;
    const email = 'test@example.com';
    const roleId = 2;
    const farmName = 'Test Farm';

    it('should create an invitation when all conditions are met', async () => {
      const mockFarm = { id: farmId, name: farmName };
      const mockRole = { id: roleId, name: 'Member' };
      const mockToken = 'test-token';
      const mockInvitation = {
        id: 1,
        email,
        token: mockToken,
        farmId,
        roleId,
        expiresAt: expect.any(Date),
      };

      mockPrismaService.farm.findUnique.mockResolvedValue(mockFarm);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.farmInvitation.create.mockResolvedValue(mockInvitation);
      mockJwtService.signAsync.mockResolvedValue(mockToken);
      mockMailService.sendFarmInvitation.mockResolvedValue(true);

      const result = await service.createInvitation(farmId, email, roleId);

      expect(mockPrismaService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
      });
      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          farmId,
          roleId,
          type: 'farm-invitation',
        }),
        expect.any(Object),
      );
      expect(mockPrismaService.farmInvitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email,
          token: mockToken,
          farmId,
          roleId,
          expiresAt: expect.any(Date),
        }),
      });
      expect(mockMailService.sendFarmInvitation).toHaveBeenCalled();
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException when farm does not exist', async () => {
      mockPrismaService.farm.findUnique.mockResolvedValue(null);

      await expect(service.createInvitation(farmId, email, roleId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
      });
      expect(mockPrismaService.role.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.farmInvitation.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockPrismaService.farm.findUnique.mockResolvedValue({ id: farmId, name: 'Test Farm' });
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.createInvitation(farmId, email, roleId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
      });
      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(mockPrismaService.farmInvitation.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is already a member of the farm', async () => {
      const mockUser = { id: 1, email };
      const mockFarmMember = { id: 1, userId: 1, farmId };
      
      mockPrismaService.farm.findUnique.mockResolvedValue({ id: farmId, name: 'Test Farm' });
      mockPrismaService.role.findUnique.mockResolvedValue({ id: roleId, name: 'Member' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(mockFarmMember);

      await expect(service.createInvitation(farmId, email, roleId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockPrismaService.farmMember.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.farmInvitation.create).not.toHaveBeenCalled();
    });
  });

  describe('acceptInvitation', () => {
    const token = 'valid-token';
    const invitation = {
      id: 1,
      token,
      email: 'test@example.com',
      farmId: 1,
      roleId: 2,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      farm: { name: 'Test Farm' },
    };
    const user: Partial<User> = {
      id: 1,
      email: 'test@example.com',
    };

    it('should accept invitation and create farm membership', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(invitation);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(null);
      mockPrismaService.farmMember.create.mockResolvedValue({
        id: 1,
        userId: user.id,
        farmId: invitation.farmId,
        roleId: invitation.roleId,
      });

      const result = await service.acceptInvitation(token, user as User);

      expect(mockPrismaService.farmInvitation.findFirst).toHaveBeenCalledWith({
        where: { token },
        include: { farm: true },
      });
      expect(mockPrismaService.farmMember.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          farmId: invitation.farmId,
          roleId: invitation.roleId,
        },
      });
      expect(mockPrismaService.farmInvitation.delete).toHaveBeenCalledWith({
        where: { id: invitation.id },
      });
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('successfully joined'),
        farmName: invitation.farm.name,
        justAccepted: true,
      });
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(null);

      await expect(service.acceptInvitation(token, user as User)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.farmMember.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when invitation has expired', async () => {
      const expiredInvitation = {
        ...invitation,
        expiresAt: new Date(Date.now() - 1000),
      };
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(expiredInvitation);

      await expect(service.acceptInvitation(token, user as User)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrismaService.farmMember.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user email does not match invitation email', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(invitation);
      const wrongUser = { ...user, email: 'wrong@example.com' };

      await expect(service.acceptInvitation(token, wrongUser as User)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrismaService.farmMember.create).not.toHaveBeenCalled();
    });

    it('should return already member message if user is already a member', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(invitation);
      mockPrismaService.farmMember.findFirst.mockResolvedValue({
        id: 1,
        userId: user.id,
        farmId: invitation.farmId,
        roleId: invitation.roleId,
      });

      const result = await service.acceptInvitation(token, user as User);

      expect(mockPrismaService.farmInvitation.delete).toHaveBeenCalled();
      expect(mockPrismaService.farmMember.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('already a member'),
        farmName: invitation.farm.name,
        alreadyMember: true,
      });
    });
  });

  describe('verifyInvitation', () => {
    const token = 'valid-token';
    const invitation = {
      id: 1,
      token,
      email: 'test@example.com',
      farmId: 1,
      roleId: 2,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      farm: { name: 'Test Farm' },
    };

    it('should verify a valid invitation', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(invitation);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.verifyInvitation(token);

      expect(mockPrismaService.farmInvitation.findFirst).toHaveBeenCalledWith({
        where: { token },
        include: { farm: true },
      });
      expect(result).toEqual({
        success: true,
        farmName: invitation.farm.name,
        email: invitation.email,
        alreadyProcessed: false,
        requiresRegistration: true,
      });
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(null);

      await expect(service.verifyInvitation(token)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when invitation has expired', async () => {
      const expiredInvitation = {
        ...invitation,
        expiresAt: new Date(Date.now() - 1000),
      };
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(expiredInvitation);

      await expect(service.verifyInvitation(token)).rejects.toThrow(ForbiddenException);
    });

    it('should identify if user exists but is not a member yet', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(invitation);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, email: invitation.email });
      mockPrismaService.farmMember.findFirst.mockResolvedValue(null);

      const result = await service.verifyInvitation(token);

      expect(result).toEqual({
        success: true,
        farmName: invitation.farm.name,
        email: invitation.email,
        alreadyProcessed: false,
        requiresRegistration: false,
      });
    });

    it('should identify if user is already a member', async () => {
      mockPrismaService.farmInvitation.findFirst.mockResolvedValue(invitation);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, email: invitation.email });
      mockPrismaService.farmMember.findFirst.mockResolvedValue({
        id: 1,
        userId: 1,
        farmId: invitation.farmId,
      });

      const result = await service.verifyInvitation(token);

      expect(result).toEqual({
        success: true,
        farmName: invitation.farm.name,
        email: invitation.email,
        alreadyProcessed: true,
        requiresRegistration: false,
      });
    });
  });

  describe('getPendingInvitationsByEmail', () => {
    const email = 'test@example.com';
    
    it('should return pending invitations for the email', async () => {
      const mockInvitations = [
        {
          id: 1,
          token: 'token1',
          farmId: 1,
          farm: { name: 'Farm 1' },
          role: { name: 'Member' },
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: 2,
          token: 'token2',
          farmId: 2,
          farm: { name: 'Farm 2' },
          role: { name: 'Admin' },
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];
      
      mockPrismaService.farmInvitation.findMany.mockResolvedValue(mockInvitations);
      
      const result = await service.getPendingInvitationsByEmail(email);
      
      expect(mockPrismaService.farmInvitation.findMany).toHaveBeenCalledWith({
        where: { 
          email,
          expiresAt: { gt: expect.any(Date) }
        },
        include: {
          farm: true,
          role: true
        }
      });
      
      expect(result).toEqual([
        {
          id: 1,
          token: 'token1',
          farmId: 1,
          farmName: 'Farm 1',
          roleName: 'Member',
          expiresAt: expect.any(Date),
        },
        {
          id: 2,
          token: 'token2',
          farmId: 2,
          farmName: 'Farm 2',
          roleName: 'Admin',
          expiresAt: expect.any(Date),
        },
      ]);
    });
    
    it('should return empty array when no pending invitations exist', async () => {
      mockPrismaService.farmInvitation.findMany.mockResolvedValue([]);
      
      const result = await service.getPendingInvitationsByEmail(email);
      
      expect(result).toEqual([]);
    });
  });
});