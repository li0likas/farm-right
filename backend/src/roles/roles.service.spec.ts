import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: PrismaService;

  const mockPrisma = {
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
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles for the given farm', async () => {
      const mockRoles = [{ id: 1, name: 'Manager' }];
      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getAllRoles(42);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: {
          farmPermissions: {
            some: { farmId: 42 },
          },
        },
        include: {
          farmPermissions: {
            where: { farmId: 42 },
            include: { permission: true },
          },
        },
      });
      expect(result).toBe(mockRoles);
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [{ id: 1, name: 'READ' }];
      mockPrisma.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getAllPermissions(42);
      expect(prisma.permission.findMany).toHaveBeenCalled();
      expect(result).toBe(mockPermissions);
    });
  });

  describe('assignPermission', () => {
    it('should assign permission to role for a farm', async () => {
      const mockAssignment = { id: 1, roleId: 2, permissionId: 3, farmId: 4 };
      mockPrisma.farmRolePermission.create.mockResolvedValue(mockAssignment);

      const result = await service.assignPermission(2, 3, 4);
      expect(prisma.farmRolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId: 2,
          permissionId: 3,
          farmId: 4,
        },
      });
      expect(result).toBe(mockAssignment);
    });
  });

  describe('removePermission', () => {
    it('should remove the permission for the role from the farm', async () => {
      const mockResult = { count: 1 };
      mockPrisma.farmRolePermission.deleteMany.mockResolvedValue(mockResult);

      const result = await service.removePermission(2, 3, 4);
      expect(prisma.farmRolePermission.deleteMany).toHaveBeenCalledWith({
        where: {
          roleId: 2,
          permissionId: 3,
          farmId: 4,
        },
      });
      expect(result).toBe(mockResult);
    });
  });
});
