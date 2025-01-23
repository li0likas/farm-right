import { Controller, Get, Param, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  // Apskaičiuoja optimalų laiką užduočiai pagal orų prognozę
  @Get('optimal-date')
  async getOptimalTaskDate(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('dueDate') dueDate: string,
    @Query('taskType') taskType: number
  ) {
    console.log("lat: ", lat + " lon: ", lon + " dueDate: ", dueDate + " taskType: ", taskType);
    const weatherData = await this.weatherService.getWeatherForecast(lat, lon);
    const optimalDateTime = this.weatherService.getOptimalDate(weatherData, dueDate, taskType);
    const insights = await this.weatherService.getOptimalDateInsights(weatherData, dueDate, taskType);
    return { lat, lon, dueDate, taskType, optimalDateTime, insights };
  }
}



