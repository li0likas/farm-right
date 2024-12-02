import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskCronService {
  constructor(private readonly prisma: PrismaService) {}


  // Schedule the cron job to run every day at midnight
  startCronJob() {
    //cron.schedule('0 0 * * *', async () => {
     cron.schedule('* * * * *', async () => { // Cron expression for every minute
      const today = new Date();
      console.log('Updating task statuses...');
      
      // Get all tasks that need to have their status updated
      const tasks = await this.prisma.task.findMany();

      for (const task of tasks) {
        let status = task.status;

        console.log(task.completionDate + " " + task.dueDate + " " + today);
        // Update status based on completionDate and dueDate
        if (task.completionDate && task.completionDate < today) {
          status = 'Completed';
        } else if (task.dueDate && task.dueDate > today) {
          status = 'Pending';
        }

        if (task.status !== status) {
          await this.prisma.task.update({
            where: { id: task.id },
            data: { status },
          });
        }
      }
    });
  }
}
