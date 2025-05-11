import * as request from 'supertest';
import { setupIntegrationTest } from './setup';

describe('Equipment API (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let workerToken;
  let equipmentId;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
    workerToken = await testUtils.getToken(testData.worker.id, testData.worker.email);
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('POST /equipment', () => {
    it('should create new equipment when owner is authenticated', () => {
      return request(testUtils.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'Test Tractor',
          typeId: testData.equipmentTypes.id,
          description: 'Integration test tractor'
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Tractor');
          equipmentId = res.body.id;
        });
    });

    it('should not allow worker to create equipment', () => {
      return request(testUtils.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${workerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'Worker Tractor',
          typeId: testData.equipmentTypes.id,
          description: 'Should not be created'
        })
        .expect(403);
    });
  });

  describe('GET /equipment', () => {
    it('should return all equipment', () => {
      return request(testUtils.app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body.some(item => item.id === equipmentId)).toBe(true);
        });
    });
  });

  describe('GET /equipment/:id', () => {
    it('should return a specific equipment item', () => {
      return request(testUtils.app.getHttpServer())
        .get(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(equipmentId);
          expect(res.body.name).toBe('Test Tractor');
        });
    });

    it('should return 404 for non-existent equipment', () => {
      return request(testUtils.app.getHttpServer())
        .get('/equipment/9999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(404);
    });
  });

  describe('PUT /equipment/:id', () => {
    it('should update equipment', () => {
      return request(testUtils.app.getHttpServer())
        .put(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'Updated Tractor',
          description: 'Updated description'
        })
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(equipmentId);
          expect(res.body.name).toBe('Updated Tractor');
          expect(res.body.description).toBe('Updated description');
        });
    });
  });

  describe('DELETE /equipment/:id', () => {
    it('should delete equipment', () => {
      return request(testUtils.app.getHttpServer())
        .delete(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(equipmentId);
        });
    });

    it('should return 404 when trying to get deleted equipment', () => {
      return request(testUtils.app.getHttpServer())
        .get(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(404);
    });
  });
});