import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportController', () => {
  let controller: ReportController;
  let reportService: ReportService;

  const mockReportService = {
    getTaskReport: jest.fn(),
    getEquipmentUsageReport: jest.fn(),
    getFarmMemberActivityReport: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['TASK_STATS_READ']),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'TASK_STATS_READ' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: ReportService, useValue: mockReportService },
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true }) // bypass guard
      .compile();

    controller = module.get<ReportController>(ReportController);
    reportService = module.get<ReportService>(ReportService);

    jest.clearAllMocks();
  });

  describe('getTaskReport', () => {
    it('should return task report for valid headers', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': '1',
          seasonid: '2',
        },
      };

      mockReportService.getTaskReport.mockResolvedValue('mocked-task-report');

      const result = await controller.getTaskReport(req);
      expect(result).toBe('mocked-task-report');
      expect(reportService.getTaskReport).toHaveBeenCalledWith(1, 2);
    });

    it('should throw ForbiddenException if farm ID is invalid', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': 'invalid',
          seasonid: '2',
        },
      };

      await expect(controller.getTaskReport(req)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if season ID is missing', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': '1',
          seasonid: 'invalid',
        },
      };

      await expect(controller.getTaskReport(req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEquipmentUsageReport', () => {
    it('should return equipment usage report for valid headers', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': '5',
          seasonid: '8',
        },
      };

      mockReportService.getEquipmentUsageReport.mockResolvedValue('usage-report');

      const result = await controller.getEquipmentUsageReport(req);
      expect(result).toBe('usage-report');
      expect(reportService.getEquipmentUsageReport).toHaveBeenCalledWith(5, 8);
    });

    it('should throw BadRequestException if headers are missing', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': '',
          seasonid: '',
        },
      };

      await expect(controller.getEquipmentUsageReport(req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFarmMemberActivity', () => {
    it('should return member activity report', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': '3',
          seasonid: '4',
        },
      };

      mockReportService.getFarmMemberActivityReport.mockResolvedValue('activity-report');

      const result = await controller.getFarmMemberActivity(req);
      expect(result).toBe('activity-report');
      expect(reportService.getFarmMemberActivityReport).toHaveBeenCalledWith(3, 4);
    });

    it('should throw BadRequestException if IDs are invalid', async () => {
      const req = {
        headers: {
          'x-selected-farm-id': 'abc',
          seasonid: 'xyz',
        },
      };

      await expect(controller.getFarmMemberActivity(req)).rejects.toThrow(BadRequestException);
    });
  });
});
