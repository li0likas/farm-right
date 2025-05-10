import { Injectable } from '@nestjs/common';

@Injectable()
export class WeatherServiceMock {
  async getWeatherForecast(lat: number, lon: number): Promise<any> {
    return {
      list: [
        {
          dt_txt: '2025-05-10 12:00:00',
          main: { temp: 20 },
          wind: { speed: 5 },
          weather: [{ description: 'clear sky' }]
        }
      ]
    };
  }

  getOptimalDate(weatherData: any, dueDate: string, taskType: number): string | null {
    return '2025-05-10 12:00:00';
  }

  async getOptimalDateInsights(weatherData: any, dueDate: string, taskType: number): Promise<string> {
    return 'Mock weather insights.';
  }

  async getForecast(lat: number, lng: number): Promise<any> {
    return {
      main: { temp: 20 },
      wind: { speed: 5 },
      weather: [{ description: 'clear sky' }]
    };
  }
}