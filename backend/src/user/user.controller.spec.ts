import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    findAllUsers: jest.fn(),
    getUserFarms: jest.fn(),
    getUserPermissions: jest.fn(),
    changeUsername: jest.fn(),
    getUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return the user from request', () => {
      const req = { user: { id: 1, email: 'test@example.com' } };
      expect(controller.getMe(req)).toEqual(req.user);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [{ id: 1 }, { id: 2 }];
      mockUserService.findAllUsers.mockResolvedValue(users);
      expect(await controller.getAllUsers()).toBe(users);
    });
  });

  describe('getUserFarms', () => {
    it('should return farms for a user', async () => {
      const req = { user: { id: 1 } };
      const farms = [{ name: 'Farm 1' }];
      mockUserService.getUserFarms.mockResolvedValue(farms);
      expect(await controller.getUserFarms(req)).toBe(farms);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions for a valid farm ID', async () => {
      const req = {
        user: { id: 1 },
        headers: { 'x-selected-farm-id': '10' },
      };
      mockUserService.getUserPermissions.mockResolvedValue(['PERMISSION_1']);
      expect(await controller.getUserPermissions(req)).toEqual(['PERMISSION_1']);
    });

    it('should throw HttpException for invalid farm ID', async () => {
      const req = {
        user: { id: 1 },
        headers: { 'x-selected-farm-id': 'invalid' },
      };
      await expect(controller.getUserPermissions(req)).rejects.toThrow(HttpException);
    });
  });

  describe('changeUsername', () => {
    it('should change the username successfully', async () => {
      const req = { user: { id: 1 } };
      const data = { username: 'newuser' };
      mockUserService.changeUsername.mockResolvedValue(undefined);

      const response = await controller.changeUsername(data, req);
      expect(mockUserService.changeUsername).toHaveBeenCalledWith(1, 'newuser');
      expect(response).toEqual({ success: true, message: 'Username changed successfully' });
    });

    it('should throw BAD_REQUEST if username is taken', async () => {
      const req = { user: { id: 1 } };
      const data = { username: 'existing' };
      mockUserService.changeUsername.mockImplementation(() => {
        throw new Error('Username is already taken');
      });

      await expect(controller.changeUsername(data, req)).rejects.toThrow(HttpException);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const user = { id: 1 };
      mockUserService.getUserById.mockResolvedValue(user);
      const result = await controller.getUserById('1');
      expect(result).toBe(user);
    });

    it('should throw error if user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      await expect(controller.getUserById('999')).rejects.toThrow('User not found');
    });
  });
});
