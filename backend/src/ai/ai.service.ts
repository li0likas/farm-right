import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TaskTypeOptionsService } from '../task/taskTypeOptions/taskTypeOptions.service';

@Injectable()
export class AiService {
  private readonly openAiApiKey = process.env.OPENAI_API_KEY;
  private readonly openAiBaseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private httpService: HttpService,
    private taskTypeOptionsService: TaskTypeOptionsService
  ) {}

  async getOptimalDateInsights(weatherData: any, dueDate: string, taskType: number, optimalDateTime: string): Promise<string> {
    const taskTypeName = await this.taskTypeOptionsService.getTaskTypeNameById(taskType);

    //console.log("taskTypeName: " + taskTypeName + " optimalDateTime: " + optimalDateTime);
    //return taskTypeName;

    const prompt = `Trumpai paaiškinkite, kodėl ${optimalDateTime} yra optimaliausia suplanuota data ir laikas žemės ūkio užduočiai/darbui ${taskTypeName}, 
    remiantis gautais ateities orų duomenimis: ${JSON.stringify(weatherData)}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.openAiBaseUrl,
          {
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant / agriculture agronomist.' },
              { role: 'user', content: prompt },
            ],
            //max_tokens: 150,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openAiApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
      console.log('Response:', response.data);
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error fetching insights from OpenAI:', error.response?.data || error.message);
      throw new Error('Error fetching insights from OpenAI: ' + error.message);
    }
  }
}