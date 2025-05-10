import { Test, TestingModule } from '@nestjs/testing';
import { FieldCropOptionsController } from './fieldCropOptions.controller';
import { FieldCropOptionsService } from './fieldCropOptions.service';
import { Response } from 'express';

describe('FieldCropOptionsController', () => {
  let controller: FieldCropOptionsController;
  let service: FieldCropOptionsService;

  const mockCropOptions = [
    { id: 1, name: 'Corn' },
    { id: 2, name: 'Wheat' },
  ];

  const mockService = {
    getFieldCropOptions: jest.fn(),
  };

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldCropOptionsController],
      providers: [
        {
          provide: FieldCropOptionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FieldCropOptionsController>(FieldCropOptionsController);
    service = module.get<FieldCropOptionsService>(FieldCropOptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFieldCropOptions', () => {
    it('should return crop options with status 200', async () => {
      const res = mockResponse();
      mockService.getFieldCropOptions.mockResolvedValue(mockCropOptions);

      await controller.getFieldCropOptions(res as Response);

      expect(service.getFieldCropOptions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCropOptions);
    });

    it('should return 500 on service failure', async () => {
      const res = mockResponse();
      const error = new Error('Database error');
      mockService.getFieldCropOptions.mockRejectedValue(error);

      await controller.getFieldCropOptions(res as Response);

      expect(service.getFieldCropOptions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching crop options',
        error,
      });
    });
  });
});
