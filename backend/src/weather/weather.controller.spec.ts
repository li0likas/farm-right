import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('WeatherController', () => {
  let controller: WeatherController;
  let weatherService: WeatherService;

  const mockWeatherService = {
    getForecast: jest.fn(),
    getWeatherForecast: jest.fn(),
    getOptimalDate: jest.fn(),
    getOptimalDateInsights: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    weatherService = module.get<WeatherService>(WeatherService);

    jest.clearAllMocks();
  });

  describe('getWeatherForecast', () => {
    it('should return weather forecast for valid coordinates', async () => {
      const headers = {
        'x-coordinates-lat': '55.123',
        'x-coordinates-lng': '23.456',
      };
      const mockForecast = { temp: 20 };
      mockWeatherService.getForecast.mockResolvedValue(mockForecast);

      const result = await controller.getWeatherForecast(headers);

      expect(mockWeatherService.getForecast).toHaveBeenCalledWith(55.123, 23.456);
      expect(result).toBe(mockForecast);
    });

    it('should throw BAD_REQUEST for invalid coordinates', async () => {
      const headers = {
        'x-coordinates-lat': 'invalid',
        'x-coordinates-lng': '23.456',
      };

      await expect(controller.getWeatherForecast(headers)).rejects.toThrow(
        new HttpException('Invalid coordinates provided in headers', HttpStatus.BAD_REQUEST)
      );
    });

    it('should handle internal errors', async () => {
      const headers = {
        'x-coordinates-lat': '55.123',
        'x-coordinates-lng': '23.456',
      };
      mockWeatherService.getForecast.mockImplementation(() => {
        throw new Error('API failure');
      });

      await expect(controller.getWeatherForecast(headers)).rejects.toThrow(
        new HttpException('Error fetching weather data', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('getOptimalTaskDate', () => {
    it('should return optimal task date with insights', async () => {
      const lat = 55.123;
      const lon = 23.456;
      const dueDate = '2025-06-01';
      const taskType = 4;

      const mockWeatherData = { list: [] };
      const mockOptimalDate = '2025-05-30 12:00:00';
      const mockInsights = 'Dry and calm weather is best.';

      mockWeatherService.getWeatherForecast.mockResolvedValue(mockWeatherData);
      mockWeatherService.getOptimalDate.mockReturnValue(mockOptimalDate);
      mockWeatherService.getOptimalDateInsights.mockResolvedValue(mockInsights);

      const result = await controller.getOptimalTaskDate(lat, lon, dueDate, taskType);

      expect(mockWeatherService.getWeatherForecast).toHaveBeenCalledWith(lat, lon);
      expect(mockWeatherService.getOptimalDate).toHaveBeenCalledWith(mockWeatherData, dueDate, taskType);
      expect(mockWeatherService.getOptimalDateInsights).toHaveBeenCalledWith(mockWeatherData, dueDate, taskType);
      expect(result).toEqual({
        lat,
        lon,
        dueDate,
        taskType,
        optimalDateTime: mockOptimalDate,
        insights: mockInsights,
      });
    });
  });
});
