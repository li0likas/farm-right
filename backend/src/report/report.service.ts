import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaskReport(farmId: number, seasonId?: number) {
    const fields = await this.prisma.field.findMany({
      where: { farmId },
      select: { id: true, name: true },
    });
  
    const tasks = await this.prisma.task.findMany({
      where: {
        field: { farmId },
        ...(seasonId ? { seasonId } : {}),
      },
      include: {
        status: true,
        field: true,
        type: true,
      },
    });
  
    const groupedByField = fields.reduce((acc, field) => {
      const taskCount = tasks.filter((t) => t.fieldId === field.id).length;
      acc[field.name] = taskCount;
      return acc;
    }, {} as Record<string, number>);
  
    const groupedByType = tasks.reduce((acc, task) => {
      const name = task.type.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
    const completedTasks = tasks.filter(
      (t) => t.status.name === "Completed" && t.completionDate && t.createdAt
    );
  
    const totalDurationMs = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime();
      const completed = new Date(task.completionDate).getTime();
      const duration = completed - created;
      return duration > 0 ? sum + duration : sum; // prevent negative durations
    }, 0);
  
    const avgMinutes = completedTasks.length
      ? totalDurationMs / completedTasks.length / (1000 * 60)
      : 0;
  
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: tasks.filter((t) => t.status.name === "Pending").length,
      canceledTasks: tasks.filter((t) => t.status.name === "Canceled").length,
      averageCompletionTimeMinutes: Math.round(avgMinutes),
      groupedByField,
      groupedByType,
    };
  }
  
  

  async getEquipmentUsageReport(farmId: number, seasonId: number) {
    const equipments = await this.prisma.equipment.findMany({
        where: { farmId },
        include: {
          tasks: {
            include: {
              task: {
                include: {
                  type: true,
                  status: true,
                  field: true,
                },
              },
            },
          },
          type: true,
        },
      });      
  
    return equipments.map((equipment) => {
      const filtered = equipment.tasks.filter(
        (te) =>
          te.task.seasonId === seasonId &&
          te.task.status.name === 'Completed'
      );
  
      const taskGroups = filtered.reduce((acc, t) => {
        const type = t.task.type?.name ?? 'Unknown';
        acc[type] = acc[type] || { count: 0, fuel: 0, minutes: 0, area: 0 };
        acc[type].count += 1;
        acc[type].fuel += t.fuelUsed ?? 0;
        acc[type].minutes += t.minutesUsed ?? 0;
        acc[type].area += t.task?.field?.area ?? 0;
        return acc;
      }, {} as Record<string, { count: number; fuel: number; minutes: number; area: number }>);
      
      const totalArea = filtered.reduce((sum, t) => sum + (t.task?.field?.area ?? 0), 0);
      const totalFuel = filtered.reduce((sum, te) => sum + (te.fuelUsed ?? 0), 0);
      const totalMinutes = filtered.reduce((sum, te) => sum + (te.minutesUsed ?? 0), 0);
  
      return {
        id: equipment.id,
        name: equipment.name,
        totalTasks: filtered.length,
        totalFuel,
        totalMinutes,
        totalArea,
        byTaskType: taskGroups,
      };      
    });
  }

  async getFarmMemberActivityReport(farmId: number, seasonId: number) {
    const taskParticipants = await this.prisma.taskParticipant.findMany({
      where: {
        task: {
          seasonId,
          field: {
            farmId,
          },
          status: {
            name: 'Completed',
          },
        },
      },
      include: {
        farmMember: {
          include: {
            user: true,
            role: true,
          },
        },
        task: true,
      },
    });
  
    const memberMap = new Map<number, {
      id: number;
      username: string;
      role: string;
      taskCount: number;
      totalMinutes: number;
      taskTitles: string[];
    }>();
  
    for (const tp of taskParticipants) {
      const member = tp.farmMember;
      if (!memberMap.has(member.id)) {
        memberMap.set(member.id, {
          id: member.id,
          username: member.user.username,
          role: member.role.name,
          taskCount: 0,
          totalMinutes: 0,
          taskTitles: [],
        });
      }
  
      const entry = memberMap.get(member.id)!;
      entry.taskCount += 1;
      entry.totalMinutes += tp.minutesWorked ?? 0;
      entry.taskTitles.push(tp.task.description ?? `Task #${tp.task.id}`);
    }
  
    return Array.from(memberMap.values());
  }
}