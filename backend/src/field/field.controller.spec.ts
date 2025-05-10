import { Test, TestingModule } from '@nestjs/testing';
import { FieldController } from './field.controller';
import { FieldService } from './field.service';
import { TaskService } from '../task/task.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('FieldController', () => {
  let controller: FieldController;
  let fieldService: FieldService;
  let taskService: TaskService;

  const mockFieldService = {
    getTotalFieldArea: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTaskService = {
    findAllTasksForField: jest.fn(),
    createTaskForField: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['FIELD_READ']),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'FIELD_READ' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldController],
      providers: [
        { provide: FieldService, useValue: mockFieldService },
        { provide: TaskService, useValue: mockTaskService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FieldController>(FieldController);
    fieldService = module.get<FieldService>(FieldService);
    taskService = module.get<TaskService>(TaskService);

    jest.clearAllMocks();
  });

  describe('getTotalFieldArea', () => {
    it('should return total area', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      mockFieldService.getTotalFieldArea.mockResolvedValue(50);

      const result = await controller.getTotalFieldArea(req);
      expect(result).toEqual({ totalArea: 50 });
    });

    it('should throw if farm ID missing', async () => {
      const req = { headers: {} };
      await expect(controller.getTotalFieldArea(req)).rejects.toThrow(
        new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('create', () => {
    it('should call create with valid dto', async () => {
      const req = {
        user: { id: 1 },
        headers: { 'x-selected-farm-id': '10' },
        body: {
          name: 'Field A',
          area: 100,
          perimeter: 40,
          cropId: 2,
          boundary: '[]',
        },
      };

      const expectedDto = {
        name: 'Field A',
        area: 100,
        perimeter: 40,
        cropId: 2,
        ownerId: 1,
        farmId: 10,
        boundary: '[]',
      };

      mockFieldService.create.mockResolvedValue('newField');
      const result = await controller.create(req);

      expect(fieldService.create).toHaveBeenCalledWith(expectedDto);
      expect(result).toBe('newField');
    });
  });

  describe('findAll', () => {
    it('should return fields for a user and farm', async () => {
      const req = { user: { id: 1 }, headers: { 'x-selected-farm-id': '5' } };
      mockFieldService.findAll.mockResolvedValue(['field1']);

      const result = await controller.findAll(req);
      expect(fieldService.findAll).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual(['field1']);
    });
  });

  describe('findOne', () => {
    it('should return the field if found', async () => {
      const req = { headers: { 'x-selected-farm-id': '3' } };
      mockFieldService.findOne.mockResolvedValue({ id: 1 });

      const result = await controller.findOne(req, '1');
      expect(result).toEqual({ id: 1 });
    });

    it('should throw if field not found', async () => {
      const req = { headers: { 'x-selected-farm-id': '3' } };
      mockFieldService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(req, '1')).rejects.toThrow(
        new HttpException(`Field with ID 1 not found in selected farm`, HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('update', () => {
    it('should call update if field exists', async () => {
      const req = { headers: { 'x-selected-farm-id': '4' } };
      const fieldData = { name: 'Updated Field' };
      mockFieldService.findOne.mockResolvedValue({ id: 1 });
      mockFieldService.update.mockResolvedValue('updatedField');

      const result = await controller.update(req, '1', fieldData);
      expect(result).toBe('updatedField');
    });
  });

  describe('delete', () => {
    it('should delete field if it exists', async () => {
      const req = { headers: { 'x-selected-farm-id': '4' } };
      mockFieldService.findOne.mockResolvedValue({ id: 1 });
      mockFieldService.delete.mockResolvedValue('deletedField');

      const result = await controller.delete(req, '1');
      expect(result).toBe('deletedField');
    });
  });

  describe('findAllTasks', () => {
    it('should return all tasks for a field', async () => {
      const req = { headers: { 'x-selected-farm-id': '5' } };
      mockFieldService.findOne.mockResolvedValue({ id: 1 });
      mockTaskService.findAllTasksForField.mockResolvedValue(['task1']);

      const result = await controller.findAllTasks(req, '1');
      expect(result).toEqual(['task1']);
    });
  });

  describe('createTask', () => {
    it('should create a task for a field', async () => {
      const req = { headers: { 'x-selected-farm-id': '6' } };
      const dto = {
        typeId: 1,
        statusId: 1,
        fieldId: 1,
        seasonId: 1,
        dueDate: new Date(),
        description: 'Spraying task',
        equipmentIds: [10, 20],
      };

      mockFieldService.findOne.mockResolvedValue({ id: 1 });
      mockTaskService.createTaskForField.mockResolvedValue('createdTask');

      const result = await controller.createTask(req, '1', dto);
      expect(result).toBe('createdTask');
    });
  });
});
