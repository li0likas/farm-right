import * as request from 'supertest';
import { setupIntegrationTest } from './setup';

describe('Report API (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let workerToken;
  let prismaService;
  let taskId;
  let equipmentId;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    prismaService = testUtils.prismaService;
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
    workerToken = await testUtils.getToken(testData.worker.id, testData.worker.email);
    
    const equipment = await prismaService.equipment.create({
      data: {
        name: 'Report Test Tractor',
        typeId: testData.equipmentTypes.id,
        ownerId: testData.owner.id,
        farmId: testData.farm.id,
      }
    });
    equipmentId = equipment.id;
    
    const task = await prismaService.task.create({
      data: {
        description: 'Task for report testing',
        typeId: testData.taskTypes[0].id,
        statusId: testData.taskStatuses[0].id,
        fieldId: testData.field.id,
        seasonId: testData.season.id,
        completionDate: new Date(),
        createdAt: new Date(Date.now() - 3600000), 
      }
    });
    taskId = task.id;
    
    const farmMember = await prismaService.farmMember.findFirst({
      where: { 
        userId: testData.worker.id,
        farmId: testData.farm.id 
      }
    });
    
    await prismaService.taskParticipant.create({
      data: {
        taskId,
        farmMemberId: farmMember.id,
        minutesWorked: 120
      }
    });
    
    await prismaService.taskEquipment.create({
      data: {
        taskId,
        equipmentId,
        minutesUsed: 120,
        fuelUsed: 25
      }
    });
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('GET /report/tasks', () => {
    it('should return task report', () => {
      return request(testUtils.app.getHttpServer())
        .get('/report/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .set('seasonid', testData.season.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body).toHaveProperty('completedTasks');
          expect(res.body).toHaveProperty('pendingTasks');
          expect(res.body).toHaveProperty('canceledTasks');
          expect(res.body).toHaveProperty('totalTasks');
          expect(res.body).toHaveProperty('averageCompletionTimeMinutes');
          expect(res.body).toHaveProperty('groupedByField');
          expect(res.body).toHaveProperty('groupedByType');
          
          expect(res.body.completedTasks).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /report/equipment-usage', () => {
    it('should return equipment usage report', () => {
      return request(testUtils.app.getHttpServer())
        .get('/report/equipment-usage')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .set('seasonid', testData.season.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          const equipmentReport = res.body.find(e => e.id === equipmentId);
          expect(equipmentReport).toBeDefined();
          expect(equipmentReport.totalTasks).toBe(1);
          expect(equipmentReport.totalFuel).toBe(25);
          expect(equipmentReport.totalMinutes).toBe(120);
        });
    });
  });

  describe('GET /report/farm-members-activity', () => {
    it('should return farm members activity report', () => {
      return request(testUtils.app.getHttpServer())
        .get('/report/farm-members-activity')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .set('seasonid', testData.season.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          const workerReport = res.body.find(m => m.username === testData.worker.username);
          expect(workerReport).toBeDefined();
          expect(workerReport.taskCount).toBeGreaterThan(0);
          expect(workerReport.totalMinutes).toBe(120);
        });
    });
  });
});