import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TaskTypeOptionsService } from '../task/taskTypeOptions/taskTypeOptions.service';
// import * as FormData from 'form-data';
// import * as fs from 'fs';

@Injectable()
export class AiService {
  private readonly openAiApiKey = process.env.OPENAI_API_KEY;
  private readonly chatGptApiUrl = 'https://api.openai.com/v1/chat/completions';
  // private readonly whisperApiUrl = 'https://api.openai.com/v1/audio/transcriptions';

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
          this.chatGptApiUrl,
          {
            model: 'gpt-4o',
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


//   async processAudio(file: Express.Multer.File) {
//     const transcription = await this.transcribeAudio(file);
//     return this.generateDescription(transcription);
//   }

// private async transcribeAudio(file: Express.Multer.File): Promise<string> {
//     if (!file || !file.path) {
//         console.error('Error: file or file.path is undefined:', file);
//         throw new Error('Invalid file upload. No file path found.');
//     }

//     const formData = new FormData();
//     formData.append('file', fs.createReadStream(file.path));  // ✅ Safe usage
//     formData.append('model', 'whisper-2');
//     formData.append('language', 'lt');

//     try {
//         const response = await firstValueFrom(
//             this.httpService.post(this.whisperApiUrl, formData, {
//                 headers: { Authorization: `Bearer ${this.openAiApiKey}`, ...formData.getHeaders() },
//             }),
//         );

//         return response.data.text;
//     } catch (error) {
//         console.error('Whisper API Error:', error);
//         throw new Error('Failed to transcribe audio.');
//     }
// }


//   private async generateDescription(transcription: string): Promise<{ generatedText: string }> {
//     console.log('Transcription:', transcription);
//     const prompt = `Parašyk trumpą ir aiškų užduoties aprašymą remiantis šia informacija: "${transcription}"`;

//     try {
//       const response = await firstValueFrom(
//         this.httpService.post(
//           this.chatGptApiUrl,
//           {
//             model: 'gpt-4o',
//             messages: [{ role: 'user', content: prompt }],
//           },
//           {
//             headers: { Authorization: `Bearer ${this.openAiApiKey}`, 'Content-Type': 'application/json' },
//           },
//         ),
//       );

//       return { generatedText: response.data.choices[0].message.content.trim() };
//     } catch (error) {
//       console.error('ChatGPT API Error:', error);
//       throw new Error('Failed to generate AI task description.');
//     }
//   }
// }


  async refineTaskDescription(rawText: string): Promise<string> {
    const prompt = `
    Esi žemės ūkio specialistas ir agronomas. Dabar pateiksiu tau žemės ūkio užduoties aprašymą, kuris buvo įrašytas balsu (kad ūkininkui nereikėtų rašyti ranka ir būtų lengviau),
    ir paverstas į tekstą, kad būtų galima jį perduoti per API. Apdorok šį aprašymą, kad jis būtų aiškesnis, logiškesnis ir labiau struktūrizuotas. Tačiau palik visą esminę ir svarbią
    pasakytą informaciją. Aprašymas turi būti sklandus, be jokių pavadinimų ar įžangų. Rašykite pirmu asmeniu, lyg kalbėtumėte apie save. Tik aiškus ir nuoseklus žemės ūkio užduoties
    paaiškinimas. Galite pridėti ir įžvalgų (tačiau taip pat pirmu asmeniu). Originalus aprašymas (paverstas iš balso į tekstą): ${rawText}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.chatGptApiUrl,
          {
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are an expert in farm task descriptions.' },
              { role: 'user', content: prompt },
            ],
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openAiApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error refining description:', error);
      throw new Error('Failed to process description with AI.');
    }
  }
}