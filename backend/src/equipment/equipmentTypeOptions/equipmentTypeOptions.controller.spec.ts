import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentTypeOptionsController } from './equipmentTypeOptions.controller';
import { EquipmentTypeOptionsService } from './equipmentTypeOptions.service';
import { AuthGuard } from '@nestjs/passport';

describe('EquipmentTypeOptionsController', () => {
  let controller: EquipmentTypeOptionsController;
  let service: EquipmentTypeOptionsService;

  const mockService = {
    getAllEquipmentTypeOptions: jest.fn().mockResolvedValue([{ id: 1, name: 'Tractor' }]),
    getEquipmentTypeOptionById: jest.fn().mockImplementation((id: number) =>
      id === 1 ? Promise.resolve({ id, name: 'Tractor' }) : Promise.resolve(null)
    ),
    createEquipmentTypeOption: jest.fn().mockImplementation((name: string) =>
      Promise.resolve({ id: 2, name })
    ),
    updateEquipmentTypeOption: jest.fn().mockImplementation((id: number, name: string) =>
      Promise.resolve({ id, name })
    ),
    deleteEquipmentTypeOption: jest.fn().mockResolvedValue({ message: 'Deleted successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentTypeOptionsController],
      providers: [
        {
          provide: EquipmentTypeOptionsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true }) // Mock the guard to always allow
      .compile();

    controller = module.get<EquipmentTypeOptionsController>(EquipmentTypeOptionsController);
    service = module.get<EquipmentTypeOptionsService>(EquipmentTypeOptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /equipment-type-options', () => {
    it('should return all equipment type options', async () => {
      const result = await controller.getAllEquipmentTypeOptions();
      expect(service.getAllEquipmentTypeOptions).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, name: 'Tractor' }]);
    });
  });

  describe('GET /equipment-type-options/:id', () => {
    it('should return a specific equipment type option', async () => {
      const result = await controller.getEquipmentTypeOptionById(1);
      expect(service.getEquipmentTypeOptionById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: 'Tractor' });
    });

    it('should return null for non-existing ID', async () => {
      const result = await controller.getEquipmentTypeOptionById(999);
      expect(result).toBeNull();
    });
  });

  describe('POST /equipment-type-options', () => {
    it('should create a new equipment type option', async () => {
      const result = await controller.createEquipmentTypeOption('Seeder');
      expect(service.createEquipmentTypeOption).toHaveBeenCalledWith('Seeder');
      expect(result).toEqual({ id: 2, name: 'Seeder' });
    });
  });

  describe('PUT /equipment-type-options/:id', () => {
    it('should update an equipment type option', async () => {
      const result = await controller.updateEquipmentTypeOption(1, 'Harvester');
      expect(service.updateEquipmentTypeOption).toHaveBeenCalledWith(1, 'Harvester');
      expect(result).toEqual({ id: 1, name: 'Harvester' });
    });
  });

  describe('DELETE /equipment-type-options/:id', () => {
    it('should delete an equipment type option', async () => {
      const result = await controller.deleteEquipmentTypeOption(1);
      expect(service.deleteEquipmentTypeOption).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Deleted successfully' });
    });
  });
});
