import * as request from 'supertest';
import { setupIntegrationTest } from './setup';

describe('Field API (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let workerToken;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
    workerToken = await testUtils.getToken(testData.worker.id, testData.worker.email);
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('GET /fields', () => {
    it('should return 401 when not authenticated', () => {
      return request(testUtils.app.getHttpServer())
        .get('/fields')
        .expect(401);
    });

    it('should return 400 when no farm is selected', () => {
      return request(testUtils.app.getHttpServer())
        .get('/fields')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);
    });

    it('should return fields when authenticated as owner', () => {
      return request(testUtils.app.getHttpServer())
        .get('/fields')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].name).toBe('Test Field');
        });
    });

    it('should return fields when authenticated as worker', () => {
      return request(testUtils.app.getHttpServer())
        .get('/fields')
        .set('Authorization', `Bearer ${workerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200);
    });
  });

  describe('POST /fields', () => {
    it('should allow owner to create field', () => {
      return request(testUtils.app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'New Test Field',
          area: 200,
          perimeter: 1000,
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
          expect(res.body.name).toBe('New Test Field');
        });
    });

    it('should not allow worker to create field', () => {
      return request(testUtils.app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${workerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          name: 'Worker Field',
          area: 150,
          perimeter: 800,
          cropId: testData.wheat.id,
          boundary: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[26.123, 56.567], [26.234, 56.567], [26.234, 56.678], [26.123, 56.678], [26.123, 56.567]]]
            }
          }
        })
        .expect(403);
    });
  });

  describe('GET /fields/:id', () => {
    it('should return single field', () => {
      return request(testUtils.app.getHttpServer())
        .get(`/fields/${testData.field.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body.id).toBe(testData.field.id);
          expect(res.body.name).toBe('Test Field');
        });
    });
  });

  describe('GET /fields/total-area', () => {
    it('should return total field area', () => {
      return request(testUtils.app.getHttpServer())
        .get('/fields/total-area')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body).toHaveProperty('totalArea');
          // Patikrinti ar tai yra numeris ir ar bent apytiksliai atitinka testinius duomenis
          expect(typeof res.body.totalArea).toBe('number');
          expect(res.body.totalArea).toBeGreaterThanOrEqual(100);
        });
    });
  });
});