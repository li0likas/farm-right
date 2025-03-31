import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TaskTypeOptionsService } from '../task/taskTypeOptions/taskTypeOptions.service';
import { PrismaService } from 'src/prisma/prisma.service';
// import * as FormData from 'form-data';
// import * as fs from 'fs';

@Injectable()
export class AiService {
  private readonly openAiApiKey = process.env.OPENAI_API_KEY;
  private readonly chatGptApiUrl = 'https://api.openai.com/v1/chat/completions';
  // private readonly whisperApiUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(
    private httpService: HttpService,
    private taskTypeOptionsService: TaskTypeOptionsService,
    private prisma: PrismaService,
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
  

  async generateCurrentFarmInsight(farmId: number): Promise<string> {
    const now = new Date();
  
    const tasks = await this.prisma.task.findMany({
      where: {
        field: { farmId },
        status: { name: { not: 'Completed' } },
        OR: [
          { dueDate: { lt: now } },
          { dueDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }, // due in 7 days
        ],
      },
      include: {
        type: true,
        status: true,
        field: true,
        comments: { include: { createdBy: true } },
        equipments: {
          include: { equipment: true },
        },
      },
    });
  
    if (!tasks.length) {
      return "Šiuo metu nėra neatliktų ar skubių užduočių, kurioms reikėtų skirti dėmesio.";
    }
  
    const relevantTasks = tasks.map((task) => ({
      //title: task.typeId,
      description: task.description,
      type: task.type.name,
      field: task.field.name,
      dueDate: task.dueDate,
      status: task.status.name,
      comments: task.comments.map((c) => ({
        content: c.content,
        createdBy: c.createdBy?.username,
        createdAt: c.createdAt,
      })),
      equipment: task.equipments.map((e) => e.equipment.name),
    }));
  
    // const prompt = `
    // Pateiksiu tau sąrašą **nepabaigtų** žemės ūkio užduočių, kurias reikia atlikti kuo greičiau. Naudodamasis informacija apie kiekvieną užduotį (įskaitant tipą, lauką, planuojamą datą, įrangą ir komentarus), pateik rekomendacijas, ką reikėtų atlikti pirmiausia, kokios gali būti rizikos, ką galima būtų patobulinti.
    
    // Atsakyk struktūruotai:
    // 1. Trumpai apibendrink bendrą padėtį.
    // 2. Išvardink neatliktas, bet svarbias užduotis (prioritetų tvarka).
    // 3. Pateik komentarų santrauką (jei yra nusiskundimų ar rizikų).
    // 4. Duok konkrečias rekomendacijas, ką daryti pirmiausia, kam skirti dėmesį.
    // 5. Jei reikia – pateik rizikas dėl uždelstų užduočių.
    
    // Užduočių duomenys: ${JSON.stringify(relevantTasks)}
    // `;


    const prompt = `
    Pateiksiu tau sąrašą **nepabaigtų** žemės ūkio užduočių, kurias reikia atlikti kuo greičiau. Naudodamasis informacija apie kiekvieną užduotį (įskaitant tipą, lauką, planuojamą datą, įrangą ir komentarus), pateik rekomendacijas, ką reikėtų atlikti pirmiausia, kokios gali būti rizikos, ką galima būtų patobulinti.
    Sugeneruok glaustą ir konkrečią įžvalgą apie dabartinę ūkio padėtį.

    **Taisyklės:**
    - Rašyk trumpai, sklandžiai ir be jokių skaičių ar skyrelių (pvz., „1.“, „Rekomendacijos:“ ir pan.).
    - Nekartok faktų, jei jie nereikšmingi.
    - Išryškink neatliktas, bet svarbias užduotis, kurioms reikėtų skirti dėmesį.
    - Įtrauk rekomendacijas tik jei jos išties reikalingos ir susijusios su rizika ar trukdžiais.
    - Venk bendrinių frazių kaip „šiuo metu nėra komentarų“ arba „bendra padėtis“.
    - Venk tuščių išvadų - svarbu pateikti konkrečią, aktualią įžvalgą.
    - Nepamiršk paminėti lauko pavadinimo ir kitų svarbių parametrų.
    - Patikrink, ar prie kiekvienos užduoties yra pridėta pakankamai informacijos, kad būtų galima sėkmingai įvykdyti užduotį (pridėta reikiama įranga, priskirti darbuotojai), o jei ne, pateik pastebėjimus, kad tai reikia padaryti.

    Štai užduočių duomenys: ${JSON.stringify(relevantTasks)}
    `;

      
    const response = await firstValueFrom(
      this.httpService.post(
        this.chatGptApiUrl,
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Esi žemės ūkio patarėjas ir agronomas.' },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.openAiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );
  
    return response.data.choices[0].message.content.trim();
  }




  async generateTaskDescription(rawText: string): Promise<string> {
    const prompt = `
Tu esi žemės ūkio specialistas ir agronomas. Štai informacija apie žemės ūkio paskirties lauke rastą susirgusį augalą (lauko pavadinimas ir nustatytos augalo ligos pavadinimas) – "${rawText}" . Sugeneruok aiškų, glaustą ir praktišką ūkininko užduoties aprašymą, kaip reikėtų reaguoti į šią problemą.

Aprašymas turi būti:
- aiškus ir glaustas
- parašytas pirmu asmeniu, lyg ūkininkas pats pasakotų
- be pavadinimų ar įžangų
- lietuvių kalba
    `;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.chatGptApiUrl,
          {
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are an expert Lithuanian farm assistant.' },
              { role: 'user', content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${this.openAiApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI task description error:', error.response?.data || error.message);
      throw new Error('Failed to generate task description with AI.');
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