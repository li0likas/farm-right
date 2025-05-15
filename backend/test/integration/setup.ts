import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestAppModule } from './test-app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { cleanDatabase } from './helpers';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

let isInitialized = false;

export async function setupIntegrationTest() {
  if (!isInitialized) {
    console.log('Initializing test database...');
    
    try {
      const setupTestDatabase = (await import('./setup-test-db')).default;
      await setupTestDatabase();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw new Error('Test database initialization failed');
    }
  }
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();

  const prismaService = app.get<PrismaService>(PrismaService);
  const jwtService = app.get<JwtService>(JwtService);


  async function createTestData() {
    await cleanDatabase(prismaService);

    const ownerRole = await prismaService.role.create({
      data: { name: 'OWNER' },
    });
    
    const workerRole = await prismaService.role.create({
      data: { name: 'WORKER' },
    });
    
    const agronomistRole = await prismaService.role.create({
      data: { name: 'AGRONOMIST' },
    });

    // Create permissions
  const permissions = await prismaService.$transaction([
    // Field permissions
    prismaService.permission.create({ data: { name: 'FIELD_CREATE' } }),
    prismaService.permission.create({ data: { name: 'FIELD_READ' } }),
    prismaService.permission.create({ data: { name: 'FIELD_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'FIELD_DELETE' } }),

    // Field task permissions
    prismaService.permission.create({ data: { name: 'FIELD_TASK_CREATE' } }),
    prismaService.permission.create({ data: { name: 'FIELD_TASK_READ' } }),
    prismaService.permission.create({ data: { name: 'FIELD_TASK_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'FIELD_TASK_DELETE' } }),
    prismaService.permission.create({ data: { name: 'FIELD_TOTAL_AREA_READ' } }),

    // Field task comment permissions
    prismaService.permission.create({ data: { name: 'FIELD_TASK_COMMENT_CREATE' } }),
    prismaService.permission.create({ data: { name: 'FIELD_TASK_COMMENT_READ' } }),
    prismaService.permission.create({ data: { name: 'FIELD_TASK_COMMENT_DELETE' } }),

    // Season
    prismaService.permission.create({ data: { name: 'SEASON_CREATE' } }),
    prismaService.permission.create({ data: { name: 'SEASON_READ' } }),
    prismaService.permission.create({ data: { name: 'SEASON_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'SEASON_DELETE' } }),

    // User management
    prismaService.permission.create({ data: { name: 'USER_MANAGE' } }),

    // Admin access
    prismaService.permission.create({ data: { name: 'ADMIN_ACCESS' } }),

    // Equipment permissions
    prismaService.permission.create({ data: { name: 'EQUIPMENT_CREATE' } }),
    prismaService.permission.create({ data: { name: 'EQUIPMENT_READ' } }),
    prismaService.permission.create({ data: { name: 'EQUIPMENT_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'EQUIPMENT_DELETE' } }),

    // Task equipment
    prismaService.permission.create({ data: { name: 'TASK_EQUIPMENT_READ' } }),
    prismaService.permission.create({ data: { name: 'TASK_EQUIPMENT_ASSIGN' } }),
    prismaService.permission.create({ data: { name: 'TASK_EQUIPMENT_REMOVE' } }),

    // Farm permissions
    prismaService.permission.create({ data: { name: 'FARM_CREATE' } }),
    prismaService.permission.create({ data: { name: 'FARM_READ' } }),
    prismaService.permission.create({ data: { name: 'FARM_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'FARM_DELETE' } }),

    // Crop permissions
    prismaService.permission.create({ data: { name: 'CROP_CREATE' } }),
    prismaService.permission.create({ data: { name: 'CROP_READ' } }),
    prismaService.permission.create({ data: { name: 'CROP_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'CROP_DELETE' } }),

    // Task permissions
    prismaService.permission.create({ data: { name: 'TASK_CREATE' } }),
    prismaService.permission.create({ data: { name: 'TASK_READ' } }),
    prismaService.permission.create({ data: { name: 'TASK_UPDATE' } }),
    prismaService.permission.create({ data: { name: 'TASK_DELETE' } }),
    prismaService.permission.create({ data: { name: 'TASK_STATS_READ' } }),
    prismaService.permission.create({ data: { name: 'TASK_CHANGE_STATUS' } }),

    prismaService.permission.create({ data: { name: 'TASK_READ_PARTICIPANTS' } }),
    prismaService.permission.create({ data: { name: 'TASK_ASSIGN_PARTICIPANTS' } }),
    prismaService.permission.create({ data: { name: 'TASK_REMOVE_PARTICIPANTS' } }),

    // AI
    prismaService.permission.create({ data: { name: 'DASHBOARD_AI_SUMMARY' } }),

    // Permission permissions
    prismaService.permission.create({ data: { name: 'PERMISSION_READ' } }),
    prismaService.permission.create({ data: { name: 'PERMISSION_ASSIGN' } }),
    prismaService.permission.create({ data: { name: 'PERMISSION_REMOVE' } }),

    // Farm member
    prismaService.permission.create({ data: { name: 'FARM_MEMBER_INVITE' } }),
    prismaService.permission.create({ data: { name: 'FARM_MEMBER_READ' } }),
    prismaService.permission.create({ data: { name: 'FARM_MEMBER_UPDATE_ROLE' } }),
    prismaService.permission.create({ data: { name: 'FARM_MEMBER_REMOVE' } }),
  ]);

    // Create users
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

    // Create farm
    const farm = await prismaService.farm.create({
      data: {
        name: 'Test Farm',
        ownerId: owner.id,
      },
    });

    // Assign roles to members
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

    // Assign permissions to roles
    for (const permission of permissions) {
      await prismaService.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Assign read permissions to worker role, but exclude sensitive ones
    const readPermissions = permissions.filter(
      (p) =>
        p.name.includes('READ') &&
        !['FARM_MEMBER_READ', 'PERMISSION_READ', 'USER_MANAGE'].includes(p.name)
    );
    for (const permission of readPermissions) {
      await prismaService.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: workerRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Create crops
    const wheat = await prismaService.fieldCropOptions.create({
      data: { name: 'Wheat' },
    });

    // Create field
    const field = await prismaService.field.create({
      data: {
        name: 'Test Field',
        area: 100.5,
        perimeter: 500.5,
        cropId: wheat.id,
        farmId: farm.id,
        ownerId: owner.id,
        boundary: {
          type: 'Polygon',
          coordinates: [[[24.123, 54.567], [24.234, 54.567], [24.234, 54.678], [24.123, 54.678], [24.123, 54.567]]]
        }
      },
    });

    // Create season
    const season = await prismaService.season.create({
      data: {
        name: 'Test Season 2025',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-10-31'),
        farmId: farm.id,
      },
    });

    // Create task types
    const taskTypes = await prismaService.$transaction([
      prismaService.taskTypeOptions.create({ data: { name: 'Planting' } }),
      prismaService.taskTypeOptions.create({ data: { name: 'Fertilizing' } }),
      prismaService.taskTypeOptions.create({ data: { name: 'Spraying' } }),
      prismaService.taskTypeOptions.create({ data: { name: 'Harvesting' } }),
    ]);

    // Create task statuses
    const taskStatuses = await prismaService.$transaction([
      prismaService.taskStatusOptions.create({ data: { name: 'Completed' } }),
      prismaService.taskStatusOptions.create({ data: { name: 'Pending' } }),
      prismaService.taskStatusOptions.create({ data: { name: 'Canceled' } }),
    ]);
    
    // Create equipment type
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
      agronomistRole,
      permissions,
      season,
      taskTypes,
      taskStatuses,
      equipmentTypes,
    };
  }

  // Generate JWT token
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
      await cleanDatabase(prismaService);
      await prismaService.$disconnect();
      await app.close();
    }
  };
}