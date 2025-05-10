
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { FarmMembersService } from '../../src/farm-members/farm-members.service';

const mockPrismaFarmMembersService = {
  farm: {
    findUnique: jest.fn(),
  },
  farmMember: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('FarmMembersService', () => {
  let farmMembersService: FarmMembersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmMembersService,
        { provide: PrismaService, useValue: mockPrismaFarmMembersService },
      ],
    }).compile();

    farmMembersService = module.get<FarmMembersService>(FarmMembersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getFarmMembers', () => {
    it('should return all members of a farm', async () => {
      // Arrange
      const farmId = 1;
      const mockFarm = {
        id: farmId,
        name: 'Test Farm',
        members: [
          { 
            user: { id: 1, username: 'user1', email: 'user1@example.com' }, 
            role: { id: 1, name: 'OWNER' }
          },
          { 
            user: { id: 2, username: 'user2', email: 'user2@example.com' }, 
            role: { id: 2, name: 'MEMBER' }
          },
        ],
      };

      mockPrismaFarmMembersService.farm.findUnique.mockResolvedValue(mockFarm);

      // Act
      const result = await farmMembersService.getFarmMembers(farmId);

      // Assert
      expect(mockPrismaFarmMembersService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
        include: { members: { include: { user: true, role: true } } }
      });
      expect(result).toEqual([
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          role: 'OWNER',
          roleId: 1
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          role: 'MEMBER',
          roleId: 2
        }
      ]);
    });

    it('should throw NotFoundException if farm not found', async () => {
      // Arrange
      const farmId = 999;

      mockPrismaFarmMembersService.farm.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(farmMembersService.getFarmMembers(farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaFarmMembersService.farm.findUnique).toHaveBeenCalledWith({
        where: { id: farmId },
        include: { members: { include: { user: true, role: true } } }
      });
    });
  });

  describe('addFarmMember', () => {
    it('should add a member to a farm', async () => {
      // Arrange
      const farmId = 1;
      const userId = 2;
      const roleId = 2;
      const mockMember = { id: 1, farmId, userId, roleId };

      mockPrismaFarmMembersService.farmMember.findFirst.mockResolvedValue(null);
      mockPrismaFarmMembersService.farmMember.create.mockResolvedValue(mockMember);

      // Act
      const result = await farmMembersService.addFarmMember(farmId, userId, roleId);

      // Assert
      expect(mockPrismaFarmMembersService.farmMember.findFirst).toHaveBeenCalledWith({ 
        where: { farmId, userId } 
      });
      expect(mockPrismaFarmMembersService.farmMember.create).toHaveBeenCalledWith({ 
        data: { farmId, userId, roleId } 
      });
      expect(result).toEqual(mockMember);
    });

    it('should throw ForbiddenException if user is already a member', async () => {
      // Arrange
      const farmId = 1;
      const userId = 2;
      const roleId = 2;
      const mockExistingMember = { id: 1, farmId, userId, roleId: 1 };

      mockPrismaFarmMembersService.farmMember.findFirst.mockResolvedValue(mockExistingMember);

      // Act & Assert
      await expect(farmMembersService.addFarmMember(farmId, userId, roleId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmMembersService.farmMember.findFirst).toHaveBeenCalledWith({ 
        where: { farmId, userId } 
      });
      expect(mockPrismaFarmMembersService.farmMember.create).not.toHaveBeenCalled();
    });
  });

  describe('removeFarmMember', () => {
    it('should remove a member from a farm', async () => {
      // Arrange
      const farmId = 1;
      const userId = 2;
      const requesterId = 1; // Different from the member being removed
      const mockDeleteResult = { count: 1 };

      mockPrismaFarmMembersService.farmMember.deleteMany.mockResolvedValue(mockDeleteResult);

      // Act
      const result = await farmMembersService.removeFarmMember(farmId, userId, requesterId);

      // Assert
      expect(mockPrismaFarmMembersService.farmMember.deleteMany).toHaveBeenCalledWith({ 
        where: { farmId, userId } 
      });
      expect(result).toEqual(mockDeleteResult);
    });

    it('should throw ForbiddenException if trying to remove self', async () => {
      // Arrange
      const farmId = 1;
      const userId = 1;
      const requesterId = 1; // Same as userId (trying to remove self)

      // Act & Assert
      await expect(farmMembersService.removeFarmMember(farmId, userId, requesterId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmMembersService.farmMember.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('updateFarmMemberRole', () => {
    it('should update a farm member\'s role', async () => {
      // Arrange
      const farmId = 1;
      const userId = 2;
      const roleId = 3;
      const requesterId = 1; // Different from the member being updated
      const mockUpdateResult = { count: 1 };

      mockPrismaFarmMembersService.farmMember.updateMany.mockResolvedValue(mockUpdateResult);

      // Act
      const result = await farmMembersService.updateFarmMemberRole(farmId, userId, roleId, requesterId);

      // Assert
      expect(mockPrismaFarmMembersService.farmMember.updateMany).toHaveBeenCalledWith({
        where: { farmId, userId },
        data: { roleId }
      });
      expect(result).toEqual(mockUpdateResult);
    });

    it('should throw ForbiddenException if trying to update own role', async () => {
      // Arrange
      const farmId = 1;
      const userId = 1;
      const roleId = 3;
      const requesterId = 1; // Same as userId (trying to update own role)

      // Act & Assert
      await expect(farmMembersService.updateFarmMemberRole(farmId, userId, roleId, requesterId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaFarmMembersService.farmMember.updateMany).not.toHaveBeenCalled();
    });
  });
});