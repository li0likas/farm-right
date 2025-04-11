import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiService } from '../ai/ai.service';

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly forecastUrl: string;
  private readonly currentWeatherUrl: string;
  private readonly units: string;

  constructor(
    private httpService: HttpService,
    private aiService: AiService,
    private configService: ConfigService
  ) {
    // Get all weather-related config in constructor
    this.apiKey = this.configService.get<string>('weather.apiKey');
    this.forecastUrl = this.configService.get<string>('weather.forecastUrl');
    this.currentWeatherUrl = this.configService.get<string>('weather.currentWeatherUrl');
    this.units = this.configService.get<string>('weather.units');

    if (!this.apiKey) {
      console.warn('Weather API key not configured in environment variables!');
    }
  }

  async getWeatherForecast(lat: number, lon: number): Promise<any> {
    if (!this.apiKey) {
      throw new HttpException('Weather API key not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.forecastUrl, {
          params: {
            lat,
            lon,
            appid: this.apiKey,
            units: this.units,
          },
        })
      );
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new HttpException('Invalid API key for weather service', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw new HttpException('Failed to fetch weather forecast data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getForecast(lat: number, lng: number): Promise<any> {
    if (!this.apiKey) {
      throw new HttpException('Weather API key not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.currentWeatherUrl, {
          params: {
            lat,
            lon: lng,
            appid: this.apiKey,
            units: this.units,
          },
        })
      );
      
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new HttpException('Invalid API key for weather service', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw new HttpException('Failed to fetch current weather data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getOptimalDate(weatherData: any, dueDate: string, taskType: number): string | null {
    const forecasts = weatherData.list
      .filter((f: any) => f.dt_txt <= dueDate) // Filter by dueDate
      .map((f: any) => ({
        dateTime: f.dt_txt,
        windSpeed: f.wind.speed,
        precipitation: f.rain ? f.rain['3h'] : 0,
        temperature: f.main.temp,
      }));

    if (forecasts.length === 0) return null;

    console.log("dueDate: ", dueDate + " taskType: ", taskType);
    console.log("forecasts: ", forecasts);

    let optimalDateTime = forecasts[0].dateTime;
    let bestValue = Infinity;

    const taskTypeNumber = Number(taskType);

    for (const forecast of forecasts) {
      let score = 0;
      switch (taskTypeNumber) {
        case 4: // Spraying – minimal wind
          score = forecast.windSpeed;
          break;
        case 3: // Fertilizing – not too much wind, not too much rain
          score = forecast.windSpeed * 2 + forecast.precipitation * 3;
          break;
        case 5: // Harvesting – minimal precipitation
          score = forecast.precipitation;
          break;
      }
      if (score < bestValue) {
        bestValue = score;
        optimalDateTime = forecast.dateTime;
      }
    }

    return optimalDateTime;
  }

  async getOptimalDateInsights(weatherData: any, dueDate: string, taskType: number): Promise<string> {
    const optimalDateTime = this.getOptimalDate(weatherData, dueDate, taskType);
    return this.aiService.getOptimalDateInsights(weatherData, dueDate, taskType, optimalDateTime);
  }
}