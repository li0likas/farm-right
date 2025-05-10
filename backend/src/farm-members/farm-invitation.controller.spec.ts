import { Test, TestingModule } from '@nestjs/testing';
import { FarmInvitationController } from './farm-invitation.controller';
import { FarmInvitationService } from './farm-invitation.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

describe('FarmInvitationController', () => {
  let controller: FarmInvitationController;
  let service: FarmInvitationService;

  const mockService = {
    createInvitation: jest.fn(),
    getPendingInvitationsByEmail: jest.fn(),
    verifyInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['FARM_MEMBER_INVITE']),
  };

  const mockPrisma = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'FARM_MEMBER_INVITE' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmInvitationController],
      providers: [
        { provide: FarmInvitationService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Reflector, useValue: mockReflector },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true }) // optional: bypass guard for simplicity
      .compile();

    controller = module.get<FarmInvitationController>(FarmInvitationController);
    service = module.get<FarmInvitationService>(FarmInvitationService);

    jest.clearAllMocks();
  });

  describe('inviteUser', () => {
    it('should call service with farmId, email, and roleId', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      const body = { email: 'user@example.com', roleId: 2 };

      mockService.createInvitation.mockResolvedValue('invited');

      const result = await controller.inviteUser(req, body);
      expect(service.createInvitation).toHaveBeenCalledWith(1, 'user@example.com', 2);
      expect(result).toBe('invited');
    });

    it('should throw if farm ID is missing', async () => {
      const req = { headers: {} };
      const body = { email: 'user@example.com', roleId: 2 };

      await expect(controller.inviteUser(req, body)).rejects.toThrow(
        new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('checkPendingInvitations', () => {
    it('should call service with user email', async () => {
      const req = { user: { email: 'test@example.com' } };
      mockService.getPendingInvitationsByEmail.mockResolvedValue(['inv1']);

      const result = await controller.checkPendingInvitations(req);
      expect(service.getPendingInvitationsByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(['inv1']);
    });
  });

  describe('verifyInvitation', () => {
    it('should call service with token', async () => {
      mockService.verifyInvitation.mockResolvedValue('verified');

      const result = await controller.verifyInvitation('abc123');
      expect(service.verifyInvitation).toHaveBeenCalledWith('abc123');
      expect(result).toBe('verified');
    });
  });

  describe('acceptInvitation', () => {
    it('should call service with token and user', async () => {
      const req = { user: { id: 10, email: 'user@example.com' } };
      mockService.acceptInvitation.mockResolvedValue('accepted');

      const result = await controller.acceptInvitation('token123', req);
      expect(service.acceptInvitation).toHaveBeenCalledWith('token123', req.user);
      expect(result).toBe('accepted');
    });
  });
});
