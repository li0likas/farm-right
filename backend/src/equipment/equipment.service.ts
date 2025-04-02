import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async getAllEquipment(farmId: number) {
    return this.prisma.equipment.findMany({
      where: { farmId },
    });
  }  

  async getEquipmentById(id: number, farmId: number) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, farmId },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found in the selected farm`);
    }

    return equipment;
  }

  async createEquipment(data: { name: string; typeId: number; ownerId: number; farmId: number; description?: string }) {
    return this.prisma.equipment.create({
      data,
    });
  }  

  async updateEquipment(
    id: number,
    data: { name?: string; typeId?: number; ownerId?: number; description?: string },
    farmId: number
  ) {
    // Ensure equipment exists in the selected farm
    const existingEquipment = await this.prisma.equipment.findFirst({
      where: { id, farmId },
    });

    if (!existingEquipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found in the selected farm`);
    }

    return this.prisma.equipment.update({
      where: { id },
      data,
    });
  }

  async deleteEquipment(id: number, farmId: number) {
    // Ensure the equipment exists in the farm before deleting
    const existingEquipment = await this.prisma.equipment.findFirst({
      where: { id, farmId },
    });

    if (!existingEquipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found in the selected farm`);
    }

    return this.prisma.equipment.delete({
      where: { id },
    });
  }

  async getEquipmentForTask(taskId: number, farmId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        equipments: {
          include: {
            equipment: {
              include: {
                type: true,
              },
            },
          },
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
  
    // Ensure that all equipment belongs to the selected farm
    const equipmentInFarm = task.equipments
      .filter((te) => te.equipment.farmId === farmId)
      .map((te) => te.equipment);
  
    return equipmentInFarm;
  }  

  async addEquipmentToTask(taskId: number, equipmentId: number, farmId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, farmId },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${equipmentId} not found in the selected farm`);
    }

    const existing = await this.prisma.taskEquipment.findFirst({
      where: { taskId, equipmentId },
    });
    if (existing) {
      throw new ConflictException("This equipment is already assigned to the task.");
    }

    return this.prisma.taskEquipment.create({
      data: {
        taskId,
        equipmentId,
      },
    });
  }

  async removeEquipmentFromTask(taskId: number, equipmentId: number, farmId: number) {
    const taskEquipment = await this.prisma.taskEquipment.findFirst({
      where: { taskId, equipmentId },
      include: { equipment: true },
    });

    if (!taskEquipment || taskEquipment.equipment.farmId !== farmId) {
      throw new NotFoundException(`Equipment with ID ${equipmentId} is not assigned to task ${taskId} in the selected farm`);
    }

    return this.prisma.taskEquipment.delete({
      where: { id: taskEquipment.id },
    });
  }
}