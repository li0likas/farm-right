// test/integration/farm.integration.spec.ts
import * as request from 'supertest';
import { setupIntegrationTest } from './setup';

describe('Farm API (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let workerToken;
  let farmId;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
    workerToken = await testUtils.getToken(testData.worker.id, testData.worker.email);
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('POST /farms', () => {
    it('should create a new farm', () => {
      return request(testUtils.app.getHttpServer())
        .post('/farms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Integration Farm'
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Integration Farm');
          expect(res.body.ownerId).toBe(testData.owner.id);
          farmId = res.body.id;
        });
    });
  });

  describe('GET /farms/:id', () => {
    it('should get farm details', () => {
      return request(testUtils.app.getHttpServer())
        .get(`/farms/${farmId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(farmId);
          expect(res.body.name).toBe('Test Integration Farm');
          expect(res.body).toHaveProperty('membersCount');
          expect(res.body).toHaveProperty('fieldsCount');
          expect(res.body).toHaveProperty('equipmentsCount');
          expect(res.body).toHaveProperty('tasksCount');
        });
    });
  });

  describe('PATCH /farms/:id', () => {
    it('should rename a farm', () => {
      return request(testUtils.app.getHttpServer())
        .patch(`/farms/${farmId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Renamed Integration Farm'
        })
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(farmId);
          expect(res.body.name).toBe('Renamed Integration Farm');
        });
    });

    it('should prevent non-owner from renaming', () => {
      return request(testUtils.app.getHttpServer())
        .patch(`/farms/${farmId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          name: 'Worker Renamed Farm'
        })
        .expect(403);
    });
  });

  describe('DELETE /farms/:id', () => {
    it('should prevent non-owner from deleting farm', () => {
      return request(testUtils.app.getHttpServer())
        .delete(`/farms/${farmId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);
    });

    it('should delete a farm', () => {
      return request(testUtils.app.getHttpServer())
        .delete(`/farms/${farmId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(farmId);
        });
    });

    it('should return 404 for deleted farm', () => {
      return request(testUtils.app.getHttpServer())
        .get(`/farms/${farmId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });
  });
});