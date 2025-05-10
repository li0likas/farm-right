// test/integration/business-process.integration.spec.ts
import * as request from 'supertest';
import { setupIntegrationTest } from './setup';

describe('End-to-End Business Process (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let prismaService;
  let app;
  
  let fieldId;
  let taskId;
  let equipmentId;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    prismaService = testUtils.prismaService;
    app = testUtils.app;
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('Full Farming Cycle Process', () => {
    it('Step 1: Create a field', () => {
      return request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'Process Test Field',
          area: 150,
          perimeter: 700,
          cropId: testData.wheat.id,
          boundary: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[25.123, 55.567], [25.234, 55.567], [25.234, 55.678], [25.123, 55.678], [25.123, 55.567]]]
            }
          }
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          fieldId = res.body.id;
        });
    });

    it('Step 2: Create equipment', () => {
      return request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'Test Tractor',
          typeId: 1, // Pridėkite tinkamą įrangos tipo ID
          description: 'Integration test equipment',
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          equipmentId = res.body.id;
        });
    });

    it('Step 3: Create a task for the field', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          typeId: testData.taskTypes[0].id,
          description: 'Planting wheat',
          dueDate: new Date(testData.season.startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          statusId: testData.taskStatuses[1].id, // Pending
          fieldId: fieldId,
          seasonId: testData.season.id,
          equipmentIds: [equipmentId],
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          taskId = res.body.id;
        });
    });

    it('Step 4: Assign participant to task', () => {
      return request(app.getHttpServer())
        .post(`/tasks/${taskId}/participants`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          userId: testData.worker.id,
        })
        .expect(201);
    });

    it('Step 5: Add comment to task', () => {
      return request(app.getHttpServer())
        .post(`/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          content: 'Integration test comment',
          taskId: taskId,
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('Integration test comment');
        });
    });

    it('Step 6: Complete the task', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          minutesWorked: 120,
          equipmentData: {
            [equipmentId]: 30, // 30 litrų kuro
          },
        })
        .expect(200);
    });

    it('Step 7: Check the task is completed', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body.status.name).toBe('Completed');
          expect(res.body.completionDate).not.toBeNull();
        });
    });

    it('Step 8: Get task reports', () => {
      return request(app.getHttpServer())
        .get('/report/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .set('seasonid', testData.season.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body).toHaveProperty('completedTasks');
          expect(res.body).toHaveProperty('groupedByField');
          expect(res.body).toHaveProperty('groupedByType');
          expect(res.body.completedTasks).toBeGreaterThan(0);
        });
    });

    it('Step 9: Get equipment usage report', () => {
      return request(app.getHttpServer())
        .get('/report/equipment-usage')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .set('seasonid', testData.season.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          // Patikrinkite įrangos duomenis
          const equipmentReport = res.body.find(e => e.id === equipmentId);
          expect(equipmentReport).toBeDefined();
          expect(equipmentReport.totalFuel).toBe(30);
          expect(equipmentReport.totalMinutes).toBe(120);
        });
    });

    it('Step 10: Get farm members activity report', () => {
      return request(app.getHttpServer())
        .get('/report/farm-members-activity')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .set('seasonid', testData.season.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          
          // Patikrinkite narių duomenis
          const memberReport = res.body.find(m => m.username === testData.worker.username);
          expect(memberReport).toBeDefined();
          expect(memberReport.minutesWorked).toBe(120);
        });
    });
  });
});