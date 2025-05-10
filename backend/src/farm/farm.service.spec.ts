
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { FarmService } from '../../src/farm/farm.service';

const mockPrismaFarmService = {
  farm: {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  farmMember: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  taskParticipant: {
    deleteMany: jest.fn(),
  },
  task: {
    deleteMany: jest.fn(),
  },
  field: {
    deleteMany: jest.fn(),
  },
  equipment: {
    deleteMany: jest.fn(),
  },
  season: {
    deleteMany: jest.fn(),
  },
  farmInvitation: {
    deleteMany: jest.fn(),
  },
  farmRolePermission: {
    deleteMany: jest.fn(),
  }
};

describe('FarmService', () => {
  let farmService: FarmService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmService,
        { provide: PrismaService, useValue: mockPrismaFarmService },
      ],
    }).compile();

    farmService = module.get<FarmService>(FarmService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createFarm', () => {
    it('should create a farm successfully', async () => {
      // Arrange
      const user = { id: 1, email: 'test@example.com' };
      const farmName = 'Test Farm';
      const mockFarm = { id: 1, name: farmName, ownerId: user.id };
      const mockRole = { id: 1, name: 'OWNER' };
      const mockFarmMember = { id: 1, farmId: mockFarm.id, userId: user.id, roleId: mockRole.id };

      mockPrismaFarmService.farm.count.mockResolvedValue(0); // No farms yet
      mockPrismaFarmService.farm.create.mockResolvedValue(mockFarm);
      mockPrismaFarmService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaFarmService.farmMember.create.mockResolvedValue(mockFarmMember);

      // Act
      const result = await farmService.createFarm(user, farmName);

      // Assert
      expect(mockPrismaFarmService.farm.count).toHaveBeenCalledWith({
        where: { ownerId: user.id },
      });
      expect(mockPrismaFarmService.farm.create).toHaveBeenCalledWith({
        data: {
          name: farmName,
          ownerId: user.id,
        },
      });
      expect(mockPrismaFarmService.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'OWNER' },
      });
      expect(mockPrismaFarmService.farmMember.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          farmId: mockFarm.id,
          roleId: mockRole.id,
        },
      });
      expect(result).toEqual(mockFarm);
    });

    it('should throw ForbiddenException if user reached max farm limit', async () => {
      // Arrange
      const user = { id: 1, email: 'test@example.com' };
      const farmName = 'Test Farm';

      mockPrismaFarmService.farm.count.mockResolvedValue(3); // Max farms reached

      // Act & Assert
      await expect(farmService.createFarm(user, farmName)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmService.farm.count).toHaveBeenCalledWith({
        where: { ownerId: user.id },
      });
      expect(mockPrismaFarmService.farm.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if OWNER role not found', async () => {
      // Arrange
      const user = { id: 1, email: 'test@example.com' };
      const farmName = 'Test Farm';
      const mockFarm = { id: 1, name: farmName, ownerId: user.id };

      mockPrismaFarmService.farm.count.mockResolvedValue(0);
      mockPrismaFarmService.farm.create.mockResolvedValue(mockFarm);
      mockPrismaFarmService.role.findUnique.mockResolvedValue(null); // Role not found

      // Act & Assert
      await expect(farmService.createFarm(user, farmName)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmService.farm.count).toHaveBeenCalledWith({
        where: { ownerId: user.id },
      });
      expect(mockPrismaFarmService.farm.create).toHaveBeenCalled();
      expect(mockPrismaFarmService.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'OWNER' },
      });
      expect(mockPrismaFarmService.farmMember.create).not.toHaveBeenCalled();
    });
  });

  describe('getFarmDetails', () => {
    it('should return farm details', async () => {
      // Arrange
      const farmId = 1;
      const mockFarm = {
        id: farmId,
        name: 'Test Farm',
        ownerId: 1,
        members: [{ id: 1 }, { id: 2 }],
        fields: [
          { id: 1, tasks: [{ id: 1 }, { id: 2 }] },
          { id: 2, tasks: [{ id: 3 }] },
        ],
        equipments: [{ id: 1 }, { id: 2 }],
      };

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);

      // Act
      const result = await farmService.getFarmDetails(farmId);

      // Assert
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
        include: {
          members: true,
          fields: {
            include: {
              tasks: true
            }
          },
          equipments: true,
        },
      });
      expect(result).toEqual({
        id: farmId,
        name: 'Test Farm',
        ownerId: 1,
        membersCount: 2,
        fieldsCount: 2,
        equipmentsCount: 2,
        tasksCount: 3,
      });
    });

    it('should throw NotFoundException if farm not found', async () => {
      // Arrange
      const farmId = 999;

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(farmService.getFarmDetails(farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
        include: expect.any(Object),
      });
    });
  });

  describe('renameFarm', () => {
    it('should rename a farm successfully', async () => {
      // Arrange
      const farmId = 1;
      const newName = 'Renamed Farm';
      const userId = 1;
      const mockFarm = { id: farmId, name: 'Old Name', ownerId: userId };
      const mockUpdatedFarm = { ...mockFarm, name: newName };

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);
      mockPrismaFarmService.farm.update.mockResolvedValue(mockUpdatedFarm);

      // Act
      const result = await farmService.renameFarm(farmId, newName, userId);

      // Assert
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.farm.update).toHaveBeenCalledWith({
        where: { id: farmId },
        data: { name: newName },
      });
      expect(result).toEqual(mockUpdatedFarm);
    });

    it('should throw NotFoundException if farm not found', async () => {
      // Arrange
      const farmId = 999;
      const newName = 'Renamed Farm';
      const userId = 1;

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(farmService.renameFarm(farmId, newName, userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.farm.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const farmId = 1;
      const newName = 'Renamed Farm';
      const userId = 2; // Different from owner
      const mockFarm = { id: farmId, name: 'Old Name', ownerId: 1 };

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);

      // Act & Assert
      await expect(farmService.renameFarm(farmId, newName, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.farm.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if new name is too short', async () => {
      // Arrange
      const farmId = 1;
      const newName = 'Re'; // Too short
      const userId = 1;
      const mockFarm = { id: farmId, name: 'Old Name', ownerId: userId };

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);

      // Act & Assert
      await expect(farmService.renameFarm(farmId, newName, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.farm.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFarm', () => {
    it('should delete a farm successfully with all related data', async () => {
      // Arrange
      const farmId = 1;
      const userId = 1;
      const mockFarm = { id: farmId, name: 'Test Farm', ownerId: userId };

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);
      mockPrismaFarmService.taskParticipant.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaFarmService.task.deleteMany.mockResolvedValue({ count: 3 });
      mockPrismaFarmService.field.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaFarmService.farmMember.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaFarmService.equipment.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaFarmService.season.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaFarmService.farmInvitation.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaFarmService.farmRolePermission.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaFarmService.farm.delete.mockResolvedValue(mockFarm);

      // Act
      const result = await farmService.deleteFarm(farmId, userId);

      // Assert
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.taskParticipant.deleteMany).toHaveBeenCalledWith({
        where: { task: { field: { farmId } } },
      });
      expect(mockPrismaFarmService.task.deleteMany).toHaveBeenCalledWith({
        where: { field: { farmId } },
      });
      expect(mockPrismaFarmService.field.deleteMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(mockPrismaFarmService.farmMember.deleteMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(mockPrismaFarmService.equipment.deleteMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(mockPrismaFarmService.season.deleteMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(mockPrismaFarmService.farmInvitation.deleteMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(mockPrismaFarmService.farmRolePermission.deleteMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(mockPrismaFarmService.farm.delete).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(result).toEqual(mockFarm);
    });

    it('should throw NotFoundException if farm not found', async () => {
      // Arrange
      const farmId = 999;
      const userId = 1;

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(farmService.deleteFarm(farmId, userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.taskParticipant.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaFarmService.farm.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const farmId = 1;
      const userId = 2; // Different from owner
      const mockFarm = { id: farmId, name: 'Test Farm', ownerId: 1 };

      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);

      // Act & Assert
      await expect(farmService.deleteFarm(farmId, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.taskParticipant.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaFarmService.farm.delete).not.toHaveBeenCalled();
    });
  });

  describe('leaveFarm', () => {
    it('should let a member leave a farm', async () => {
      // Arrange
      const userId = 2;
      const farmId = 1;
      const mockMembership = { id: 1, userId, farmId };
      const mockFarm = { id: farmId, name: 'Test Farm', ownerId: 1 }; // Different owner

      mockPrismaFarmService.farmMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);
      mockPrismaFarmService.farmMember.delete.mockResolvedValue(mockMembership);

      // Act
      const result = await farmService.leaveFarm(userId, farmId);

      // Assert
      expect(mockPrismaFarmService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId },
      });
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.farmMember.delete).toHaveBeenCalledWith({
        where: { id: mockMembership.id },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if membership not found', async () => {
      // Arrange
      const userId = 999;
      const farmId = 1;

      mockPrismaFarmService.farmMember.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(farmService.leaveFarm(userId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaFarmService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId },
      });
      expect(mockPrismaFarmService.farm.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaFarmService.farmMember.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is the farm owner', async () => {
      // Arrange
      const userId = 1;
      const farmId = 1;
      const mockMembership = { id: 1, userId, farmId };
      const mockFarm = { id: farmId, name: 'Test Farm', ownerId: userId }; // Same owner

      mockPrismaFarmService.farmMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaFarmService.farm.findUnique.mockResolvedValue(mockFarm);

      // Act & Assert
      await expect(farmService.leaveFarm(userId, farmId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId },
      });
      expect(mockPrismaFarmService.farm.findUnique).toHaveBeenCalledWith({ 
        where: { id: farmId } 
      });
      expect(mockPrismaFarmService.farmMember.delete).not.toHaveBeenCalled();
    });
  });
});
