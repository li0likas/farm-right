import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from '../../src/weather/weather.service';
import { HttpService } from '@nestjs/axios';
import { AiService } from '../../src/ai/ai.service';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('WeatherService', () => {
  let weatherService: WeatherService;
  let httpService: HttpService;
  let aiService: AiService;
  let configService: ConfigService;

  // Shared mocks
  let getMock: jest.Mock;

  beforeEach(async () => {
    getMock = jest.fn();

    const mockHttpService = {
      get: getMock,
    };

    const mockAiService = {
      getOptimalDateInsights: jest.fn().mockResolvedValue('Mocked insights'),
    };

    const mockConfigService = {
      get: jest.fn((key) => {
        const config = {
          'weather.apiKey': 'test-api-key',
          'weather.forecastUrl': 'https://api.example.com/forecast',
          'weather.currentWeatherUrl': 'https://api.example.com/weather',
          'weather.units': 'metric',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: AiService, useValue: mockAiService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    weatherService = module.get<WeatherService>(WeatherService);
    httpService = module.get<HttpService>(HttpService);
    aiService = module.get<AiService>(AiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('getWeatherForecast', () => {
    it('should return forecast data', async () => {
      const mockForecast = {
        list: [{
          dt_txt: '2023-05-01 12:00:00',
          main: { temp: 20 },
          wind: { speed: 5 },
          rain: { '3h': 0 },
        }],
      };
      getMock.mockReturnValueOnce(of({ data: mockForecast }));

      const result = await weatherService.getWeatherForecast(55.123, 23.456);
      expect(result).toEqual(mockForecast);
    });

    it('should throw if API key is missing', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => key === 'weather.apiKey' ? null : 'other-value');
      await expect(weatherService.getWeatherForecast(55.123, 23.456)).rejects.toThrow(HttpException);
    });

    it('should throw if HTTP fails', async () => {
      getMock.mockReturnValueOnce(throwError(() => ({ response: { status: 401, data: { message: 'Unauthorized' } } })));
      await expect(weatherService.getWeatherForecast(55.123, 23.456)).rejects.toThrow(HttpException);
    });
  });

  describe('getForecast', () => {
    it('should return current weather data', async () => {
      const mockCurrent = {
        main: { temp: 25 },
        wind: { speed: 3 },
        weather: [{ description: 'Sunny' }],
      };
      getMock.mockReturnValueOnce(of({ data: mockCurrent }));

      const result = await weatherService.getForecast(55.123, 23.456);
      expect(result).toEqual(mockCurrent);
    });

    it('should throw if API key is missing', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => key === 'weather.apiKey' ? null : 'other-value');
      await expect(weatherService.getForecast(55.123, 23.456)).rejects.toThrow(HttpException);
    });
  });

  describe('getOptimalDate', () => {
    it('should return optimal date for spraying (lowest wind)', () => {
      const weatherData = {
        list: [
          { dt_txt: '2023-05-01 12:00:00', wind: { speed: 5 }, rain: { '3h': 2 }, main: { temp: 20 } },
          { dt_txt: '2023-05-02 12:00:00', wind: { speed: 2 }, rain: { '3h': 0 }, main: { temp: 22 } },
        ],
      };
      const result = weatherService.getOptimalDate(weatherData, '2023-05-03 23:59:59', 4);
      expect(result).toBe('2023-05-02 12:00:00');
    });

    it('should return null if no forecast data', () => {
      const result = weatherService.getOptimalDate({ list: [] }, '2023-05-03 23:59:59', 3);
      expect(result).toBeNull();
    });
  });

  describe('getOptimalDateInsights', () => {
    it('should call AI with correct params and return insights', async () => {
      const weatherData = { list: [] };
      const dueDate = '2023-05-03 23:59:59';
      const taskType = 4;
      const mockDate = '2023-05-02 12:00:00';

      jest.spyOn(weatherService, 'getOptimalDate').mockReturnValue(mockDate);

      const result = await weatherService.getOptimalDateInsights(weatherData, dueDate, taskType);

      expect(aiService.getOptimalDateInsights).toHaveBeenCalledWith(weatherData, dueDate, taskType, mockDate);
      expect(result).toBe('Mocked insights');
    });
  });
});
