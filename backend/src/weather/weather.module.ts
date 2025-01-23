import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [HttpModule, AiModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}