// test/integration/setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestAppModule } from './test-app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { cleanDatabase } from './helpers';

export async function setupIntegrationTest() {
  // Įkeliame testavimo aplinkos kintamuosius
  process.env.NODE_ENV = 'test';
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();

  const prismaService = app.get<PrismaService>(PrismaService);
  const jwtService = app.get<JwtService>(JwtService);

  // Išvalome duomenų bazę prieš testus
  await cleanDatabase();

  // Funkcija testiniams duomenims sukurti
  async function createTestData() {
    // Sukuriame roles
    const ownerRole = await prismaService.role.create({
      data: { name: 'OWNER' },
    });
    
    const workerRole = await prismaService.role.create({
      data: { name: 'WORKER' },
    });

    // Sukuriame leidimus
    const permissions = await prismaService.$transaction([
      prismaService.permission.create({ data: { name: 'FIELD_CREATE' } }),
      prismaService.permission.create({ data: { name: 'FIELD_READ' } }),
      prismaService.permission.create({ data: { name: 'FIELD_UPDATE' } }),
      prismaService.permission.create({ data: { name: 'FIELD_DELETE' } }),
      prismaService.permission.create({ data: { name: 'TASK_CREATE' } }),
      prismaService.permission.create({ data: { name: 'TASK_READ' } }),
      // ... kiti leidimai
    ]);

    // Pasirūpinkite standartiniais duomenimis
    const hash = await argon.hash('testpassword');
    
    const owner = await prismaService.user.create({
      data: {
        username: 'testowner',
        email: 'owner@test.com',
        hash,
      },
    });
    
    const worker = await prismaService.user.create({
      data: {
        username: 'testworker',
        email: 'worker@test.com',
        hash,
      },
    });

    const farm = await prismaService.farm.create({
      data: {
        name: 'Test Farm',
        ownerId: owner.id,
      },
    });

    // Priskiriame nariui ūkį su darbininko role
    await prismaService.farmMember.create({
      data: {
        userId: owner.id,
        farmId: farm.id,
        roleId: ownerRole.id,
      },
    });

    await prismaService.farmMember.create({
      data: {
        userId: worker.id,
        farmId: farm.id,
        roleId: workerRole.id,
      },
    });

    // Priskiriame savininkui visus leidimus
    for (const perm of permissions) {
      await prismaService.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: ownerRole.id,
          permissionId: perm.id,
        },
      });
    }

    // Priskiriame darbuotojui tik skaitymo leidimus
    const readPerms = permissions.filter(p => p.name.includes('READ'));
    for (const perm of readPerms) {
      await prismaService.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: workerRole.id,
          permissionId: perm.id,
        },
      });
    }

    // Sukuriame pasėlius
    const wheat = await prismaService.fieldCropOptions.create({
      data: { name: 'Wheat' },
    });

    // Sukuriame lauko objektus
    const field = await prismaService.field.create({
      data: {
        name: 'Test Field',
        area: 100.5,
        perimeter: 500.5,
        cropId: wheat.id,
        farmId: farm.id,
        ownerId: owner.id,
        boundary: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[24.123, 54.567], [24.234, 54.567], [24.234, 54.678], [24.123, 54.678], [24.123, 54.567]]]
          }
        }
      },
    });

    // Sukuriame sezoną
    const season = await prismaService.season.create({
      data: {
        name: 'Test Season 2025',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-10-31'),
        farmId: farm.id,
      },
    });

    // Sukuriame užduoties tipus
    const taskTypes = await prismaService.$transaction([
      prismaService.taskTypeOptions.create({ data: { name: 'Planting' } }),
      prismaService.taskTypeOptions.create({ data: { name: 'Fertilizing' } }),
      prismaService.taskTypeOptions.create({ data: { name: 'Spraying' } }),
      prismaService.taskTypeOptions.create({ data: { name: 'Harvesting' } }),
    ]);

    // Sukuriame užduoties būsenas
    const taskStatuses = await prismaService.$transaction([
      prismaService.taskStatusOptions.create({ data: { name: 'Completed' } }),
      prismaService.taskStatusOptions.create({ data: { name: 'Pending' } }),
      prismaService.taskStatusOptions.create({ data: { name: 'Canceled' } }),
    ]);
    
    // Sukuriame įrangos tipus
    const equipmentTypes = await prismaService.equipmentTypeOptions.create({
      data: { name: 'Tractor' },
    });

    return {
      owner,
      worker,
      farm,
      field,
      wheat,
      ownerRole,
      workerRole,
      permissions,
      season,
      taskTypes,
      taskStatuses,
      equipmentTypes,
    };
  }

  // JWT generavimas
  function getToken(userId, email) {
    return jwtService.signAsync(
      { sub: userId, email },
      { secret: process.env.JWT_SECRET || 'test-jwt-secret' }
    );
  }

  return {
    app,
    prismaService,
    jwtService,
    createTestData,
    getToken,
    cleanup: async () => {
      await cleanDatabase();
      await prismaService.$disconnect();
      await app.close();
    }
  };
}