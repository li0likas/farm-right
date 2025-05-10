import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {
    getAllRoles: jest.fn(),
    getAllPermissions: jest.fn(),
    assignPermission: jest.fn(),
    removePermission: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['PERMISSION_READ']),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'PERMISSION_READ' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: mockRolesService },
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true }) // bypass guard
      .compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);

    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles with valid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      mockRolesService.getAllRoles.mockResolvedValue(['Role A']);

      const result = await controller.getAllRoles(req);
      expect(result).toEqual(['Role A']);
      expect(service.getAllRoles).toHaveBeenCalledWith(1);
    });

    it('should throw on invalid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': 'abc' } };
      await expect(controller.getAllRoles(req)).rejects.toThrow(HttpException);
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions with valid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': '2' } };
      mockRolesService.getAllPermissions.mockResolvedValue(['perm1']);

      const result = await controller.getAllPermissions(req);
      expect(result).toEqual(['perm1']);
      expect(service.getAllPermissions).toHaveBeenCalledWith(2);
    });

    it('should throw on invalid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': 'NaN' } };
      await expect(controller.getAllPermissions(req)).rejects.toThrow(HttpException);
    });
  });

  describe('assignPermission', () => {
    it('should assign a permission successfully', async () => {
      const req = { headers: { 'x-selected-farm-id': '3' } };
      const body = { permissionId: '5', farmId: '3' };

      mockRolesService.assignPermission.mockResolvedValue('assigned');

      const result = await controller.assignPermission('4', body, req);
      expect(result).toBe('assigned');
      expect(service.assignPermission).toHaveBeenCalledWith(4, 5, 3);
    });

    it('should throw on invalid roleId or permissionId', async () => {
      const req = { headers: { 'x-selected-farm-id': '3' } };
      const body = { permissionId: 'invalid', farmId: '3' };

      await expect(controller.assignPermission('bad', body, req)).rejects.toThrow(HttpException);
    });
  });

  describe('removePermission', () => {
    it('should remove a permission successfully', async () => {
      const req = { headers: { 'x-selected-farm-id': '5' } };
      mockRolesService.removePermission.mockResolvedValue('removed');

      const result = await controller.removePermission('2', '6', req);
      expect(result).toBe('removed');
      expect(service.removePermission).toHaveBeenCalledWith(2, 6, 5);
    });

    it('should throw on invalid inputs', async () => {
      const req = { headers: { 'x-selected-farm-id': 'xyz' } };

      await expect(controller.removePermission('foo', 'bar', req)).rejects.toThrow(HttpException);
    });
  });
});
