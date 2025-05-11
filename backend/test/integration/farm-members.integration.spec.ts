import * as request from 'supertest';
import { setupIntegrationTest } from './setup';
import * as argon2 from 'argon2';

describe('Farm Members API (Integration)', () => {
  let testUtils;
  let testData;
  let ownerToken;
  let workerToken;
  let prismaService;
  let newUserId;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    testData = await testUtils.createTestData();
    prismaService = testUtils.prismaService;
    
    ownerToken = await testUtils.getToken(testData.owner.id, testData.owner.email);
    workerToken = await testUtils.getToken(testData.worker.id, testData.worker.email);
    
    // Create a new user for testing member addition
    const hashedPassword = await argon2.hash('testpassword');
    
    const newUser = await prismaService.user.create({
    data: {
        username: 'newmember',
        email: 'newmember@test.com',
        hash: hashedPassword,
    }
    });
    
    newUserId = newUser.id;
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('GET /farm-members', () => {
    it('should return all farm members', () => {
      return request(testUtils.app.getHttpServer())
        .get('/farm-members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          // Verify owner is present
          expect(res.body.some(member => member.id === testData.owner.id)).toBe(true);
          // Verify worker is present
          expect(res.body.some(member => member.id === testData.worker.id)).toBe(true);
        });
    });
    
    it('should return 403 for unauthorized users', () => {
      return request(testUtils.app.getHttpServer())
        .get('/farm-members')
        .set('Authorization', `Bearer ${workerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(403);
    });
  });

  describe('POST /farm-members', () => {
    it('should add a new member to the farm', () => {
      return request(testUtils.app.getHttpServer())
        .post('/farm-members')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          userId: newUserId.toString(),
          roleId: testData.workerRole.id.toString()
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.userId).toBe(newUserId);
          expect(res.body.farmId).toBe(testData.farm.id);
          expect(res.body.roleId).toBe(testData.workerRole.id);
        });
    });
  });

  describe('PATCH /farm-members/:userId', () => {
    it('should update member role', () => {
      return request(testUtils.app.getHttpServer())
        .patch(`/farm-members/${newUserId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .send({
          roleId: testData.agronomistRole.id.toString()
        })
        .expect(200)
        .then(res => {
          expect(res.body.count).toBeGreaterThan(0); // Count of updated records
        });
    });
  });

  describe('DELETE /farm-members/:userId', () => {
    it('should remove member from farm', () => {
      return request(testUtils.app.getHttpServer())
        .delete(`/farm-members/${newUserId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(200)
        .then(res => {
          expect(res.body.count).toBeGreaterThan(0); // Count of deleted records
        });
    });
    
    it('should not allow removing self', () => {
      return request(testUtils.app.getHttpServer())
        .delete(`/farm-members/${testData.owner.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-selected-farm-id', testData.farm.id.toString())
        .expect(403);
    });
  });
});