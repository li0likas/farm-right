import { Test, TestingModule } from '@nestjs/testing';
import { FarmMembersController } from './farm-members.controller';
import { FarmMembersService } from './farm-members.service';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('FarmMembersController', () => {
  let controller: FarmMembersController;
  let service: FarmMembersService;

  const mockFarmMembersService = {
    getFarmMembers: jest.fn(),
    addFarmMember: jest.fn(),
    removeFarmMember: jest.fn(),
    updateFarmMemberRole: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['FARM_MEMBER_READ']),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'FARM_MEMBER_READ' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmMembersController],
      providers: [
        { provide: FarmMembersService, useValue: mockFarmMembersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FarmMembersController>(FarmMembersController);
    service = module.get<FarmMembersService>(FarmMembersService);
  });

  describe('getFarmMembers', () => {
    it('should return farm members when farm ID is provided', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      mockFarmMembersService.getFarmMembers.mockResolvedValue(['member1']);

      const result = await controller.getFarmMembers(req);
      expect(service.getFarmMembers).toHaveBeenCalledWith(1);
      expect(result).toEqual(['member1']);
    });

    it('should throw if farm ID is missing', async () => {
      const req = { headers: {} };
      await expect(controller.getFarmMembers(req)).rejects.toThrow(
        new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('addFarmMember', () => {
    it('should add member when valid data is provided', async () => {
      const req = { headers: { 'x-selected-farm-id': '2' } };
      const body = { userId: '5', roleId: '3' };
      mockFarmMembersService.addFarmMember.mockResolvedValue('added');

      const result = await controller.addFarmMember(req, body);
      expect(service.addFarmMember).toHaveBeenCalledWith(2, 5, 3);
      expect(result).toBe('added');
    });

    it('should throw if farm ID is missing', async () => {
      const req = { headers: {} };
      const body = { userId: '5', roleId: '3' };
      await expect(controller.addFarmMember(req, body)).rejects.toThrow(
        new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('removeFarmMember', () => {
    it('should remove member', async () => {
      const req = { headers: { 'x-selected-farm-id': '3' }, user: { id: 100 } };
      mockFarmMembersService.removeFarmMember.mockResolvedValue('removed');

      const result = await controller.removeFarmMember(req, '42');
      expect(service.removeFarmMember).toHaveBeenCalledWith(3, 42, 100);
      expect(result).toBe('removed');
    });

    it('should throw if farm ID is missing', async () => {
      const req = { headers: {}, user: { id: 100 } };
      await expect(controller.removeFarmMember(req, '42')).rejects.toThrow(
        new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('updateFarmMemberRole', () => {
    it('should update member role', async () => {
      const req = { headers: { 'x-selected-farm-id': '4' }, user: { id: 200 } };
      const body = { roleId: '10' };
      mockFarmMembersService.updateFarmMemberRole.mockResolvedValue('updated');

      const result = await controller.updateFarmMemberRole(req, '50', body);
      expect(service.updateFarmMemberRole).toHaveBeenCalledWith(4, 50, 10, 200);
      expect(result).toBe('updated');
    });

    it('should throw if farm ID is missing', async () => {
      const req = { headers: {}, user: { id: 200 } };
      const body = { roleId: '10' };
      await expect(controller.updateFarmMemberRole(req, '50', body)).rejects.toThrow(
        new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
