import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AiService } from '../ai/ai.service';

@Injectable()
export class WeatherService {
  private readonly apiKey = process.env.OPENWEATHER_API_KEY;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/forecast';


/// !!!
// https://api.openweathermap.org/data/2.5/forecast?lat=56.3450718&lon=23.7284381&appid=1dfdc6c0848d4dd795cd1326ec7d86f7&units=metric
// {"cod":401, "message": "Invalid API key. Please see https://openweathermap.org/faq#error401 for more info."}

constructor(private httpService: HttpService, private aiService: AiService) {}

  async getWeatherForecast(lat: number, lon: number): Promise<any> {
    const apiUrl = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    try {
      const response = await firstValueFrom(this.httpService.get(apiUrl));
      return response.data;
    } catch (error) {
      throw new Error('Error fetching weather data');
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