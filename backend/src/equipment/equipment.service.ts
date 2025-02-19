import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async getAllEquipment() {
    return this.prisma.equipment.findMany();
  }

  async getEquipmentById(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with id ${id} not found`);
    }
    return equipment;
  }

  async createEquipment(data: { name: string; typeId: number; ownerId: number; description?: string }) {
    return this.prisma.equipment.create({
      data,
    });
  }

  async updateEquipment(id: number, data: { name?: string; typeId?: number; ownerId?: number; description?: string }) {
    return this.prisma.equipment.update({
      where: { id },
      data,
    });
  }

  async deleteEquipment(id: number) {
    return this.prisma.equipment.delete({
      where: { id },
    });
  }

  async getEquipmentForTask(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        equipments: {
          include: {
            equipment: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }
    return task.equipments.map(te => te.equipment);
  }

  async addEquipmentToTask(taskId: number, equipmentId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const equipment = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with id ${equipmentId} not found`);
    }

    return this.prisma.taskEquipment.create({
      data: {
        taskId,
        equipmentId,
      },
    });
  }

  async removeEquipmentFromTask(taskId: number, equipmentId: number) {
    const taskEquipment = await this.prisma.taskEquipment.findFirst({
      where: { taskId, equipmentId },
    });
    if (!taskEquipment) {
      throw new NotFoundException(`Equipment with id ${equipmentId} not found for task with id ${taskId}`);
    }

    return this.prisma.taskEquipment.delete({
      where: { id: taskEquipment.id },
    });
  }
}