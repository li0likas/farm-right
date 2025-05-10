import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from '../../src/comment/comment.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// Mocking PrismaService
const mockPrismaService = {
  comment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    findFirst: jest.fn(),
  },
};

describe('CommentService', () => {
  let commentService: CommentService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCommentDto = {
      taskId: 1,
      content: 'Test comment',
    };
    const farmId = 1;
    const userId = 10;

    it('should create a comment when task exists within the farm', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.comment.create.mockResolvedValue({
        id: 1,
        content: 'Test comment',
        taskId: 1,
        createdById: userId,
        createdAt: new Date(),
      });

      const result = await commentService.create(createCommentDto, farmId, userId);

      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: createCommentDto.taskId,
          field: {
            farmId,
          },
        },
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
        data: {
          content: createCommentDto.content,
          task: { connect: { id: createCommentDto.taskId } },
          createdBy: { connect: { id: userId } },
        },
      });
      expect(result).toEqual(expect.objectContaining({
        content: 'Test comment',
        taskId: 1,
      }));
    });

    it('should throw NotFoundException when task does not exist in the farm', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(
        commentService.create(createCommentDto, farmId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: createCommentDto.taskId,
          field: {
            farmId,
          },
        },
      });
      expect(mockPrismaService.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const taskId = 1;
    const farmId = 1;

    it('should return all comments for a task', async () => {
      const mockComments = [
        { id: 1, content: 'Comment 1', taskId, createdAt: new Date() },
        { id: 2, content: 'Comment 2', taskId, createdAt: new Date() },
      ];

      mockPrismaService.task.findFirst.mockResolvedValue({ id: taskId });
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await commentService.findAll(taskId, farmId);

      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: taskId,
          field: {
            farmId,
          },
        },
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { taskId },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(mockComments);
    });

    it('should throw NotFoundException when task does not exist in the farm', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(
        commentService.findAll(taskId, farmId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: taskId,
          field: {
            farmId,
          },
        },
      });
      expect(mockPrismaService.comment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const commentId = 1;
    const farmId = 1;

    it('should delete a comment when it exists and belongs to the farm', async () => {
      const mockComment = { id: commentId, content: 'Test comment' };
      mockPrismaService.comment.findFirst.mockResolvedValue(mockComment);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      const result = await commentService.delete(commentId, farmId);

      expect(mockPrismaService.comment.findFirst).toHaveBeenCalledWith({
        where: {
          id: commentId,
          task: {
            field: {
              farmId,
            },
          },
        },
      });
      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException when comment does not exist in the farm', async () => {
      mockPrismaService.comment.findFirst.mockResolvedValue(null);

      await expect(
        commentService.delete(commentId, farmId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.comment.findFirst).toHaveBeenCalledWith({
        where: {
          id: commentId,
          task: {
            field: {
              farmId,
            },
          },
        },
      });
      expect(mockPrismaService.comment.delete).not.toHaveBeenCalled();
    });
  });
});