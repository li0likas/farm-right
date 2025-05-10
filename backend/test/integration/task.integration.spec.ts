// test/integration/task.integration.spec.ts
import * as request from 'supertest';
import { setupIntegrationTest } from './setup';

describe('Task API (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let workerToken;
  let taskId;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
    workerToken = await testUtils.getToken(testData.worker.id, testData.worker.email);
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('POST /tasks', () => {
    it('should create a new task', () => {
      return request(testUtils.app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          typeId: testData.taskTypes[0].id,
          description: 'Test planting task',
          dueDate: new Date(testData.season.startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          statusId: testData.taskStatuses[1].id, // Pending
          fieldId: testData.field.id,
          seasonId: testData.season.id,
          equipmentIds: [],
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.description).toBe('Test planting task');
          taskId = res.body.id;
        });
    });
  });

  describe('GET /tasks', () => {
    it('should return list of tasks', () => {
      return request(testUtils.app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('description');
        });
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a single task', () => {
      return request(testUtils.app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(taskId);
          expect(res.body.description).toBe('Test planting task');
        });
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should change task status', () => {
      return request(testUtils.app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          statusId: testData.taskStatuses[0].id, // Completed
        })
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(taskId);
          expect(res.body.statusId).toBe(testData.taskStatuses[0].id);
        });
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', () => {
      return request(testUtils.app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200);
    });
  });
});