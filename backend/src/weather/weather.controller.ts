import { Controller, Get, Headers, HttpException, HttpStatus, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get('forecast')
  @ApiOperation({ summary: 'Get weather forecast for the map area' })
  @ApiResponse({ status: 200, description: 'Weather forecast retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates.' })
  @ApiHeader({ name: 'x-coordinates-lat', description: 'Latitude value' })
  @ApiHeader({ name: 'x-coordinates-lng', description: 'Longitude value' })
  async getWeatherForecast(@Headers() headers) {
    try {
      const lat = parseFloat(headers['x-coordinates-lat']);
      const lng = parseFloat(headers['x-coordinates-lng']);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new HttpException('Invalid coordinates provided in headers', HttpStatus.BAD_REQUEST);
      }
      
      return await this.weatherService.getForecast(lat, lng);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error fetching weather data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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