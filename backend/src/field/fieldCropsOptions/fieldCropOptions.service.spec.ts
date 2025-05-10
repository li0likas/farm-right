import { Test, TestingModule } from '@nestjs/testing';
import { FieldCropOptionsService } from './fieldCropOptions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FieldCropOptionsService', () => {
  let service: FieldCropOptionsService;
  let prismaMock: { fieldCropOptions: { findMany: jest.Mock } };

  beforeEach(async () => {
    prismaMock = {
      fieldCropOptions: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldCropOptionsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<FieldCropOptionsService>(FieldCropOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return crop options', async () => {
    const mockCropOptions = [
      { id: 1, name: 'Corn' },
      { id: 2, name: 'Wheat' },
    ];

    prismaMock.fieldCropOptions.findMany.mockResolvedValue(mockCropOptions);

    const result = await service.getFieldCropOptions();
    expect(prismaMock.fieldCropOptions.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockCropOptions);
  });

  it('should throw an error if Prisma fails', async () => {
    prismaMock.fieldCropOptions.findMany.mockRejectedValue(new Error('DB error'));

    await expect(service.getFieldCropOptions()).rejects.toThrow('Error fetching crop options');
  });
});
