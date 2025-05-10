
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { WeatherService } from '../../src/weather/weather.service';
import { HttpService } from '@nestjs/axios';
import { AiService } from '../../src/ai/ai.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

// Create mocks for external dependencies
const mockHttpService = {
  get: jest.fn(),
};

const mockAiService = {
  getOptimalDateInsights: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('WeatherService', () => {
  let weatherService: WeatherService;
  let httpService: HttpService;
  let aiService: AiService;

  beforeEach(async () => {
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

    jest.clearAllMocks();

    // Setup default mock implementation for config
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'weather.apiKey') return 'test-api-key';
      if (key === 'weather.forecastUrl') return 'https://api.example.com/forecast';
      if (key === 'weather.currentWeatherUrl') return 'https://api.example.com/weather';
      if (key === 'weather.units') return 'metric';
      return undefined;
    });
  });

  describe('getWeatherForecast', () => {
    it('should fetch weather forecast data successfully', async () => {
      // Arrange
      const lat = 55.123;
      const lon = 23.456;
      const mockWeatherData = {
        list: [
          { 
            dt_txt: '2023-05-01 12:00:00',
            main: { temp: 20 },
            wind: { speed: 5 },
            rain: { '3h': 0 },
          }
        ]
      };
      const mockResponse: AxiosResponse = {
        data: mockWeatherData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { 
          headers: undefined,
          data: undefined
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await weatherService.getWeatherForecast(lat, lon);

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.example.com/forecast', {
        params: {
          lat,
          lon,
          appid: 'test-api-key',
          units: 'metric',
        },
      });
      expect(result).toEqual(mockWeatherData);
    });

    it('should throw HttpException if API key is not configured', async () => {
      // Arrange
      const lat = 55.123;
      const lon = 23.456;

      // Override the config mock for this test only
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'weather.apiKey') return null; // Missing API key
        if (key === 'weather.forecastUrl') return 'https://api.example.com/forecast';
        if (key === 'weather.units') return 'metric';
        return undefined;
      });

      // Act & Assert
      await expect(weatherService.getWeatherForecast(lat, lon)).rejects.toThrow(HttpException);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should throw HttpException if weather API request fails', async () => {
      // Arrange
      const lat = 55.123;
      const lon = 23.456;
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid API key' },
        },
      };

      mockHttpService.get.mockReturnValue(throwError(() => errorResponse));

      // Act & Assert
      await expect(weatherService.getWeatherForecast(lat, lon)).rejects.toThrow(HttpException);
      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.example.com/forecast', {
        params: {
          lat,
          lon,
          appid: 'test-api-key',
          units: 'metric',
        },
      });
    });
  });

  describe('getForecast', () => {
    it('should fetch current weather data successfully', async () => {
      // Arrange
      const lat = 55.123;
      const lng = 23.456;
      const mockWeatherData = {
        main: { temp: 20 },
        wind: { speed: 5 },
        weather: [{ description: 'Sunny' }],
      };
      const mockResponse: AxiosResponse = {
        data: mockWeatherData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { 
          headers: undefined,
          data: undefined
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      // Act
      const result = await weatherService.getForecast(lat, lng);

      // Assert
      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.example.com/weather', {
        params: {
          lat,
          lon: lng,
          appid: 'test-api-key',
          units: 'metric',
        },
      });
      expect(result).toEqual(mockWeatherData);
    });

    it('should throw HttpException if API key is not configured', async () => {
      // Arrange
      const lat = 55.123;
      const lng = 23.456;

      // Override the config mock for this test only
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'weather.apiKey') return null; // Missing API key
        if (key === 'weather.currentWeatherUrl') return 'https://api.example.com/weather';
        if (key === 'weather.units') return 'metric';
        return undefined;
      });

      // Act & Assert
      await expect(weatherService.getForecast(lat, lng)).rejects.toThrow(HttpException);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });
  });

  describe('getOptimalDate', () => {
    it('should return optimal date for spraying task', () => {
      // Arrange
      const weatherData = {
        list: [
          { 
            dt_txt: '2023-05-01 12:00:00',
            wind: { speed: 5 },
            rain: { '3h': 2 },
            main: { temp: 20 },
          },
          { 
            dt_txt: '2023-05-02 12:00:00',
            wind: { speed: 2 }, // Lower wind speed (better for spraying)
            rain: { '3h': 0 },
            main: { temp: 22 },
          },
          { 
            dt_txt: '2023-05-03 12:00:00',
            wind: { speed: 7 },
            rain: { '3h': 0 },
            main: { temp: 18 },
          },
        ]
      };
      const dueDate = '2023-05-03 23:59:59';
      const taskType = 4; // Spraying task

      // Act
      const result = weatherService.getOptimalDate(weatherData, dueDate, taskType);

      // Assert
      expect(result).toBe('2023-05-02 12:00:00'); // Date with lowest wind speed
    });

    it('should return optimal date for fertilizing task', () => {
      // Arrange
      const weatherData = {
        list: [
          { 
            dt_txt: '2023-05-01 12:00:00',
            wind: { speed: 5 },
            rain: { '3h': 4 }, // High rain (bad for fertilizing)
            main: { temp: 20 },
          },
          { 
            dt_txt: '2023-05-02 12:00:00',
            wind: { speed: 2 },
            rain: { '3h': 1 }, // Lower wind and rain (good for fertilizing)
            main: { temp: 22 },
          },
          { 
            dt_txt: '2023-05-03 12:00:00',
            wind: { speed: 7 },
            rain: { '3h': 0 },
            main: { temp: 18 },
          },
        ]
      };
      const dueDate = '2023-05-03 23:59:59';
      const taskType = 3; // Fertilizing task

      // Act
      const result = weatherService.getOptimalDate(weatherData, dueDate, taskType);

      // Assert
      expect(result).toBe('2023-05-02 12:00:00'); // Date with best combination of wind and rain
    });

    it('should return optimal date for harvesting task', () => {
      // Arrange
      const weatherData = {
        list: [
          { 
            dt_txt: '2023-05-01 12:00:00',
            wind: { speed: 5 },
            rain: { '3h': 3 }, // Some rain (bad for harvesting)
            main: { temp: 20 },
          },
          { 
            dt_txt: '2023-05-02 12:00:00',
            wind: { speed: 3 },
            rain: { '3h': 0 }, // No rain (good for harvesting)
            main: { temp: 22 },
          },
          { 
            dt_txt: '2023-05-03 12:00:00',
            wind: { speed: 4 },
            rain: { '3h': 1 }, // Some rain
            main: { temp: 18 },
          },
        ]
      };
      const dueDate = '2023-05-03 23:59:59';
      const taskType = 5; // Harvesting task

      // Act
      const result = weatherService.getOptimalDate(weatherData, dueDate, taskType);

      // Assert
      expect(result).toBe('2023-05-02 12:00:00'); // Date with no rain
    });

    it('should return null if no forecasts are available', () => {
      // Arrange
      const weatherData = { list: [] }; // Empty list
      const dueDate = '2023-05-03 23:59:59';
      const taskType = 5;

      // Act
      const result = weatherService.getOptimalDate(weatherData, dueDate, taskType);

      // Assert
      expect(result).toBeNull();
    });
  });
});

//   describe('getOptimalDateInsights', () => {
//     it('should get insights for optimal date from AI service', async () => {
//       // Arrange
//       const weatherData = { list: [] };
//       const dueDate = '2023-05-03 23:59:59';
//       const taskType = 4;
//       const optimalDateTime = '2023-05-02 12:00:00';
//       const mockInsights = 'This