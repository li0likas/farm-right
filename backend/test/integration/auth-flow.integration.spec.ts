// test/integration/auth-flow.integration.spec.ts
import * as request from 'supertest';
import { setupIntegrationTest } from './setup';
import * as argon from 'argon2';

describe('Authentication Flow (Integration)', () => {
  let testUtils;
  let app;
  let prismaService;

  beforeAll(async () => {
    testUtils = await setupIntegrationTest();
    app = testUtils.app;
    prismaService = testUtils.prismaService;
    
    // Išvalome vartotojus, kad galėtume kurti naujus
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  const testUser = {
    name: 'integrationtest',
    email: 'integration@test.com',
    password: 'testpassword',
  };

  let accessToken;

  describe('Signup Flow', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('farms');
          expect(Array.isArray(res.body.farms)).toBe(true);
        });
    });

    it('should not register a user with the same email', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(400);
    });
  });

  describe('Signin Flow', () => {
    it('should authenticate a user', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          username: testUser.name,
          password: testUser.password,
        })
        .expect(201)
        .then(res => {
          expect(res.body).toHaveProperty('access_token');
          accessToken = res.body.access_token;
        });
    });

    it('should not authenticate with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          username: testUser.name,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('should send forgot password email', () => {
      // Čia galite naudoti mockuotą pašto servisą
      return request(app.getHttpServer())
        .post('/auth/forgotPass')
        .send({
          email: testUser.email,
        })
        .expect(201)
        .then(res => {
          expect(res.body).toBe(true);
        });
    });
    
    it('should change password with auth token', async () => {
      // Tiesiogiai atnaujinkite duomenų bazę, kad būtų galima atkurti ir testuoti
      const user = await prismaService.user.findUnique({
        where: { email: testUser.email },
      });
      
      // Imituokite, kad vartotojas turi galiojantį slaptažodžio atstatymo tokeną
      await prismaService.user.update({
        where: { id: user.id },
        data: { isResetValid: true },
      });
      
      // Testuokite slaptažodžio keitimą
      return request(app.getHttpServer())
        .post('/auth/passReset')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newPassword: 'NewPassword123',
        })
        .expect(201);
    });
    
    it('should authenticate with the new password', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          username: testUser.name,
          password: 'NewPassword123',
        })
        .expect(201);
    });
  });
});