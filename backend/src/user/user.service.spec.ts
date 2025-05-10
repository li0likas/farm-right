import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    farm: {
      findMany: jest.fn(),
    },
    farmMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      // Arrange
      const userId = 1;
      const mockUser = { id: userId, username: 'testuser', email: 'test@example.com' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBeNull();
    });

    it('should handle errors and throw', async () => {
      // Arrange
      const userId = 1;
      const errorMessage = 'Database error';
      mockPrismaService.user.findUnique.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.getUserById(userId)).rejects.toThrow(
        `Error fetching user by ID: ${errorMessage}`
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAllUsers();

      // Assert
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array if no users', async () => {
      // Arrange
      mockPrismaService.user.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAllUsers();

      // Assert
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('changeUsername', () => {
    it('should change username successfully', async () => {
      // Arrange
      const userId = 1;
      const newUsername = 'newusername';
      const mockUser = { id: userId, username: 'oldusername' };

      mockPrismaService.user.findUnique.mockResolvedValue(null); // No user with this username
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, username: newUsername });

      // Act
      await service.changeUsername(userId, newUsername);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: newUsername },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { username: newUsername },
      });
    });

    it('should throw error if username already taken', async () => {
      // Arrange
      const userId = 1;
      const newUsername = 'existingUsername';
      const existingUser = { id: 2, username: newUsername }; // Different user with same username

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.changeUsername(userId, newUsername)).rejects.toThrow(
        'Username is already taken'
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: newUsername },
      });
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserFarms', () => {
    it('should return farms a user belongs to', async () => {
      // Arrange
      const userId = 1;
      const mockFarms = [
        { id: 1, name: 'Farm 1', ownerId: userId },
        { id: 2, name: 'Farm 2', ownerId: 2 }, // User is a member, not owner
      ];

      mockPrismaService.farm.findMany.mockResolvedValue(mockFarms);

      // Act
      const result = await service.getUserFarms(userId);

      // Assert
      expect(mockPrismaService.farm.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      });
      expect(result).toEqual(mockFarms);
    });

    it('should return empty array if user has no farms', async () => {
      // Arrange
      const userId = 1;
      mockPrismaService.farm.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getUserFarms(userId);

      // Assert
      expect(mockPrismaService.farm.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions for a farm', async () => {
      // Arrange
      const userId = 1;
      const farmId = 1;
      const mockFarmMember = {
        userId,
        farmId,
        role: {
          farmPermissions: [
            { permission: { name: 'FIELD_READ' } },
            { permission: { name: 'FIELD_CREATE' } },
            { permission: { name: 'TASK_READ' } },
          ],
        },
      };

      mockPrismaService.farmMember.findUnique.mockResolvedValue(mockFarmMember);

      // Act
      const result = await service.getUserPermissions(userId, farmId);

      // Assert
      expect(mockPrismaService.farmMember.findUnique).toHaveBeenCalledWith({
        where: { userId_farmId: { userId, farmId } },
        include: {
          role: {
            include: {
              farmPermissions: {
                where: { farmId },
                include: { permission: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(['FIELD_READ', 'FIELD_CREATE', 'TASK_READ']);
    });

    it('should throw HttpException if user is not a farm member', async () => {
      // Arrange
      const userId = 1;
      const farmId = 1;

      mockPrismaService.farmMember.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserPermissions(userId, farmId)).rejects.toThrow(HttpException);
      expect(mockPrismaService.farmMember.findUnique).toHaveBeenCalledWith({
        where: { userId_farmId: { userId, farmId } },
        include: expect.any(Object),
      });
    });
  });
});