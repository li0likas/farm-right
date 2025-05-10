import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from '../../src/roles/roles.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    role: {
      findMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
    farmRolePermission: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    const farmId = 1;

    it('should return all roles related to the farm', async () => {
      const mockRoles = [
        {
          id: 1,
          name: 'Admin',
          farmPermissions: [
            { id: 1, roleId: 1, permissionId: 1, farmId, permission: { id: 1, name: 'FIELD_READ' } },
            { id: 2, roleId: 1, permissionId: 2, farmId, permission: { id: 2, name: 'FIELD_CREATE' } },
          ],
        },
        {
          id: 2,
          name: 'User',
          farmPermissions: [
            { id: 3, roleId: 2, permissionId: 1, farmId, permission: { id: 1, name: 'FIELD_READ' } },
          ],
        },
      ];

      mockPrismaService.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getAllRoles(farmId);

      expect(mockPrismaService.role.findMany).toHaveBeenCalledWith({
        where: {
          farmPermissions: {
            some: { farmId },
          },
        },
        include: {
          farmPermissions: {
            where: { farmId },
            include: {
              permission: true,
            },
          },
        },
      });

      expect(result).toEqual(mockRoles);
    });

    it('should return empty array when no roles exist for the farm', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([]);

      const result = await service.getAllRoles(farmId);

      expect(result).toEqual([]);
    });
  });

  describe('getAllPermissions', () => {
    const farmId = 1;

    it('should return all permissions', async () => {
      const mockPermissions = [
        { id: 1, name: 'FIELD_READ' },
        { id: 2, name: 'FIELD_CREATE' },
        { id: 3, name: 'FIELD_UPDATE' },
      ];

      mockPrismaService.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getAllPermissions(farmId);

      expect(mockPrismaService.permission.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockPermissions);
    });

    it('should return empty array when no permissions exist', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([]);

      const result = await service.getAllPermissions(farmId);

      expect(result).toEqual([]);
    });
  });

  describe('assignPermission', () => {
    const roleId = 1;
    const permissionId = 2;
    const farmId = 1;

    it('should assign a permission to a role for the farm', async () => {
      const mockFarmRolePermission = {
        id: 1,
        roleId,
        permissionId,
        farmId,
      };

      mockPrismaService.farmRolePermission.create.mockResolvedValue(mockFarmRolePermission);

      const result = await service.assignPermission(roleId, permissionId, farmId);

      expect(mockPrismaService.farmRolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId,
          permissionId,
          farmId,
        },
      });

      expect(result).toEqual(mockFarmRolePermission);
    });

    it('should handle database errors when assigning permissions', async () => {
      const errorMessage = 'Database error';
      mockPrismaService.farmRolePermission.create.mockRejectedValue(new Error(errorMessage));

      await expect(service.assignPermission(roleId, permissionId, farmId)).rejects.toThrow(Error);
    });
  });

  describe('removePermission', () => {
    const roleId = 1;
    const permissionId = 2;
    const farmId = 1;

    it('should remove a permission from a role for the farm', async () => {
      const mockDeleteResult = { count: 1 };
      mockPrismaService.farmRolePermission.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await service.removePermission(roleId, permissionId, farmId);

      expect(mockPrismaService.farmRolePermission.deleteMany).toHaveBeenCalledWith({
        where: {
          roleId,
          permissionId,
          farmId,
        },
      });

      expect(result).toEqual(mockDeleteResult);
    });

    it('should return count 0 when permission was not assigned', async () => {
      const mockDeleteResult = { count: 0 };
      mockPrismaService.farmRolePermission.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await service.removePermission(roleId, permissionId, farmId);

      expect(result).toEqual(mockDeleteResult);
    });

    it('should handle database errors when removing permissions', async () => {
      const errorMessage = 'Database error';
      mockPrismaService.farmRolePermission.deleteMany.mockRejectedValue(new Error(errorMessage));

      await expect(service.removePermission(roleId, permissionId, farmId)).rejects.toThrow(Error);
    });
  });
});