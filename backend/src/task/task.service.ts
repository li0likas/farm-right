import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Task } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto, farmId: number): Promise<Task> {
    const { fieldId, typeId, description, dueDate, completionDate, statusId, seasonId, equipmentIds } = data;
  
    // Ensure the field belongs to the selected farm
    const fieldExists = await this.prisma.field.findFirst({
      where: { id: fieldId, farmId },
    });
  
    if (!fieldExists) {
      throw new NotFoundException(`Field with id ${fieldId} not found in the selected farm`);
    }
  
    // Ensure all selected equipment belongs to the farm
    if (equipmentIds && equipmentIds.length > 0) {
      const validEquipment = await this.prisma.equipment.findMany({
        where: {
          id: { in: equipmentIds },
          farmId,
        },
      });
  
      if (validEquipment.length !== equipmentIds.length) {
        throw new BadRequestException("One or more selected equipment items do not belong to this farm.");
      }
    }
  
    return this.prisma.task.create({
      data: {
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
        field: { connect: { id: fieldId } },
        type: { connect: { id: typeId } },
        status: { connect: { id: statusId } },
        season: { connect: { id: seasonId } },
        equipments: equipmentIds && equipmentIds.length > 0
          ? {
              createMany: {
                data: equipmentIds.map(equipmentId => ({
                  equipmentId,
                })),
              },
            }
          : undefined,
      },
    });
  }

  async findAll(farmId: number): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        field: { farmId },
      },
      include: {
        field: true,
        type: true,
        status: true,
        season: true,
        comments: true,
        participants: {
          include: {
            farmMember: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  } 

  async findOne(id: number, farmId: number): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, field: { farmId } },
      include: {
        field: true,
        type: true,
        status: true,
        season: true,
        comments: true,
        participants: {
          include: {
            farmMember: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  
    if (!task) throw new NotFoundException(`Task with id ${id} not found in this farm`);
    return task;
  }   

  async update(id: number, data: Partial<CreateTaskDto>, farmId: number): Promise<Task> {
    const task = await this.prisma.task.findFirst({ where: { id, field: { farmId } } });

    if (!task) throw new NotFoundException(`Task with id ${id} not found in this farm`);

    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, farmId: number): Promise<Task> {
    const task = await this.prisma.task.findFirst({ where: { id, field: { farmId } } });

    if (!task) throw new NotFoundException(`Task with id ${id} not found in this farm`);

    return this.prisma.task.delete({ where: { id } });
  }

  async changeTaskStatus(id: number, newStatusId: number, farmId: number): Promise<Task> {
    // Ensure the task belongs to the selected farm
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        field: {
          farmId, // ✅ Ensure task's field belongs to the selected farm
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found in the selected farm.`);
    }
    
    return this.prisma.task.update({
      where: { id },
      data: { statusId: newStatusId },
    });
  }
  

  async findAllTasksForField(fieldId: number, farmId: number): Promise<Task[]> {
    // Ensure field exists within the selected farm
    const field = await this.prisma.field.findFirst({
      where: { id: fieldId, farmId },
    });
  
    if (!field) {
      throw new NotFoundException(`Field with id ${fieldId} not found in the selected farm.`);
    }
  
    return this.prisma.task.findMany({
      where: { fieldId },
      include: {
        type: true,
        status: true,
        season: true,
      },
    });
  }

  async createTaskForField(fieldId: number, data: CreateTaskDto, farmId: number): Promise<Task> {
    // Ensure the field belongs to the selected farm
    const field = await this.prisma.field.findFirst({
      where: { id: fieldId, farmId },
    });
  
    if (!field) {
      throw new NotFoundException(`Field with id ${fieldId} not found in the selected farm.`);
    }
  
    return this.prisma.task.create({
      data: {
        ...data,
        fieldId,
      },
    });
  }

  async updateTaskForField(fieldId: number, taskId: number, data: Partial<Task>, farmId: number): Promise<Task> {
    // Ensure the field exists in the selected farm
    const field = await this.prisma.field.findFirst({
      where: { id: fieldId, farmId },
    });
  
    if (!field) {
      throw new NotFoundException(`Field with id ${fieldId} not found in the selected farm.`);
    }
  
    return this.prisma.task.update({
      where: { id: taskId, fieldId },
      data,
    });
  }

  async deleteTaskForField(fieldId: number, taskId: number, farmId: number): Promise<Task | null> {
    // Ensure the field exists in the selected farm
    const field = await this.prisma.field.findFirst({
      where: { id: fieldId, farmId },
    });
  
    if (!field) {
      throw new NotFoundException(`Field with id ${fieldId} not found in the selected farm.`);
    }
  
    // Ensure the task belongs to the field and farm before deleting
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, fieldId },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found in the selected farm.`);
    }
  
    await this.prisma.task.delete({ where: { id: taskId, fieldId } });
    return task;
  }

  async getCompletedTasks(farmId: number): Promise<{ completedTasks: number; totalTasks: number }> {
    const tasks = await this.prisma.task.findMany({
        where: { field: { farmId } },
        select: { status: true },
    });

    const completedTasks = tasks.filter(task => task.status.name === 'Completed').length;
    const totalTasks = tasks.length;

    return { completedTasks, totalTasks };
  }

  async getTaskParticipants(taskId: number, farmId: number) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, field: { farmId } },
      include: {
        participants: {
          include: {
            farmMember: {
              include: { user: true }
            }
          }
        }
      }
    });
  
    if (!task) throw new NotFoundException("Task not found in selected farm");
  
    return task.participants.map(p => ({
      id: p.farmMember.user.id,
      username: p.farmMember.user.username
    }));
  }

  async addParticipant(taskId: number, userId: number, farmId: number) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, field: { farmId } },
    });
    if (!task) throw new NotFoundException("Task not found in selected farm");
  
    const farmMember = await this.prisma.farmMember.findFirst({
      where: { userId, farmId }
    });
    if (!farmMember) throw new BadRequestException("User is not a member of the farm");
  
    return this.prisma.taskParticipant.create({
      data: {
        taskId,
        farmMemberId: farmMember.id
      }
    });
  }

  async removeParticipant(taskId: number, userId: number, farmId: number) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, field: { farmId } },
    });
    if (!task) throw new NotFoundException("Task not found in selected farm");
  
    const farmMember = await this.prisma.farmMember.findFirst({
      where: { userId, farmId }
    });
    if (!farmMember) throw new NotFoundException("Farm member not found");
  
    return this.prisma.taskParticipant.delete({
      where: {
        taskId_farmMemberId: { taskId, farmMemberId: farmMember.id }
      }
    });
  }

  async markAsCompleted(
    taskId: number,
    farmId: number,
    minutesWorked: number,
    equipmentData: { [equipmentId: number]: number }
  ) {
    // Fetch the task and related data
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        participants: true,
        equipments: true,
        field: true, // Needed to verify farm ownership
      },
    });

    if (!task || task.field.farmId !== farmId) {
      throw new NotFoundException('Task not found in selected farm');
    }

    // Get the status ID for 'Completed' dynamically
    const completedStatus = await this.prisma.taskStatusOptions.findFirst({
      where: { name: 'Completed' },
    });

    if (!completedStatus) {
      throw new Error('Task status "Completed" not found');
    }

    // Update the task with completed status
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        statusId: completedStatus.id,
        completionDate: new Date(),
      },
    });

    // Update minutes worked for each participant
    for (const participant of task.participants) {
      await this.prisma.taskParticipant.update({
        where: {
          taskId_farmMemberId: {
            taskId,
            farmMemberId: participant.farmMemberId,
          },
        },
        data: {
          minutesWorked,
        },
      });
    }

    // Update equipment usage
    for (const equipment of task.equipments) {
      const fuelUsed = equipmentData[equipment.equipmentId] ?? null;
      await this.prisma.taskEquipment.update({
        where: {
          taskId_equipmentId: {
            taskId,
            equipmentId: equipment.equipmentId,
          },
        },
        data: {
          minutesUsed: minutesWorked,
          fuelUsed,
        },
      });
    }

    return { message: 'Task marked as completed' };
  }
}
