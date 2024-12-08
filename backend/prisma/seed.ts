import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';
import { connect } from 'http2';

const prisma = new PrismaClient();

async function main() {

  // Clear existing data
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.field.deleteMany({});
  await prisma.fieldCropOptions.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.roleRight.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  // Create permissions
  const permissions = await prisma.permission.createMany({
    data: [
      { name: 'FIELD_CREATE' },
      { name: 'FIELD_READ' },
      { name: 'FIELD_UPDATE' },
      { name: 'FIELD_DELETE' },
      { name: 'FIELD_TASK_CREATE' },
      { name: 'FIELD_TASK_READ' },
      { name: 'FIELD_TASK_UPDATE' },
      { name: 'FIELD_TASK_DELETE' },
      { name: 'FIELD_TASK_COMMENT_CREATE' },
      { name: 'FIELD_TASK_COMMENT_READ' },
      { name: 'FIELD_TASK_COMMENT_UPDATE' },
      { name: 'FIELD_TASK_COMMENT_DELETE' },
      { name: 'USER_MANAGE' },
      { name: 'ADMIN_ACCESS' },
    ],
    skipDuplicates: true,
  });

  // Create roles
  const roles = await prisma.role.createMany({
    data: [
      { name: 'ADMIN' },
      { name: 'FARMER' },
      { name: 'WORKER' },
      { name: 'AGRONOMIST' },
    ],
    skipDuplicates: true,
  });

  // Get created roles and permissions
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  const workerRole = await prisma.role.findUnique({ where: { name: 'WORKER' } });
  const agronomistRole = await prisma.role.findUnique({ where: { name: 'AGRONOMIST' } });

  const fieldCreatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_CREATE' } });
  const fieldReadPermission = await prisma.permission.findUnique({ where: { name: 'FIELD_READ' } });
  const fieldUpdatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_UPDATE' } });
  const fieldDeletePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_DELETE' } });
  const fieldTaskCreatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_CREATE' } });
  const fieldTaskReadPermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_READ' } });
  const fieldTaskUpdatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_UPDATE' } });
  const fieldTaskDeletePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_DELETE' } });
  const fieldTaskCommentCreatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_CREATE' } });
  const fieldTaskCommentReadPermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_READ' } });
  const fieldTaskCommentUpdatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_UPDATE' } });
  const fieldTaskCommentDeletePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_DELETE' } });
  const userManagePermission = await prisma.permission.findUnique({ where: { name: 'USER_MANAGE' } });
  const adminAccessPermission = await prisma.permission.findUnique({ where: { name: 'ADMIN_ACCESS' } });

  // Create roleRights
  if (adminRole && farmerRole && workerRole && agronomistRole && fieldCreatePermission && fieldReadPermission && fieldUpdatePermission && fieldDeletePermission && fieldTaskCreatePermission && fieldTaskReadPermission && fieldTaskUpdatePermission && fieldTaskDeletePermission && fieldTaskCommentCreatePermission && fieldTaskCommentReadPermission && fieldTaskCommentUpdatePermission && fieldTaskCommentDeletePermission && userManagePermission && adminAccessPermission) {
    await prisma.roleRight.createMany({
      data: [
        // ADMIN role rights
        { roleId: adminRole.id, permissionId: fieldCreatePermission.id },
        { roleId: adminRole.id, permissionId: fieldReadPermission.id },
        { roleId: adminRole.id, permissionId: fieldUpdatePermission.id },
        { roleId: adminRole.id, permissionId: fieldDeletePermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskCreatePermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskReadPermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskUpdatePermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskDeletePermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskCommentCreatePermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskCommentReadPermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskCommentUpdatePermission.id },
        { roleId: adminRole.id, permissionId: fieldTaskCommentDeletePermission.id },
        { roleId: adminRole.id, permissionId: userManagePermission.id },
        { roleId: adminRole.id, permissionId: adminAccessPermission.id },

        // FARMER role rights
        { roleId: farmerRole.id, permissionId: fieldCreatePermission.id },
        { roleId: farmerRole.id, permissionId: fieldReadPermission.id },
        { roleId: farmerRole.id, permissionId: fieldUpdatePermission.id },
        { roleId: farmerRole.id, permissionId: fieldTaskCreatePermission.id },
        { roleId: farmerRole.id, permissionId: fieldTaskReadPermission.id },
        { roleId: farmerRole.id, permissionId: fieldTaskUpdatePermission.id },
        { roleId: farmerRole.id, permissionId: fieldTaskCommentCreatePermission.id },
        { roleId: farmerRole.id, permissionId: fieldTaskCommentReadPermission.id },
        { roleId: farmerRole.id, permissionId: fieldTaskCommentUpdatePermission.id },

        // WORKER role rights
        { roleId: workerRole.id, permissionId: fieldReadPermission.id },
        { roleId: workerRole.id, permissionId: fieldTaskReadPermission.id },
        { roleId: workerRole.id, permissionId: fieldTaskCommentCreatePermission.id },
        { roleId: workerRole.id, permissionId: fieldTaskCommentReadPermission.id },

        // AGRONOMIST role rights
        { roleId: agronomistRole.id, permissionId: fieldReadPermission.id },
        { roleId: agronomistRole.id, permissionId: fieldTaskReadPermission.id },
        { roleId: agronomistRole.id, permissionId: fieldTaskCommentCreatePermission.id },
        { roleId: agronomistRole.id, permissionId: fieldTaskCommentReadPermission.id },
        { roleId: agronomistRole.id, permissionId: fieldTaskCommentUpdatePermission.id },
      ],
      skipDuplicates: true,
    });
  }

  // Create field crop options
  const fieldCropOptions = await prisma.fieldCropOptions.createMany({
    data: [
      { name: 'Kukurūzai' },
      { name: 'Kviečiai' },
      { name: 'Pupos' },
      { name: 'Žirniai' },
      { name: 'Miežiai' },
      { name: 'Rapsai' },
    ],
    skipDuplicates: true,
  });

  // Create task type options
  const taskTypeOptions = await prisma.taskTypeOptions.createMany({
    data: [
      { name: 'Arimas' },
      { name: 'Sėjimas' },
      { name: 'Tręšimas' },
      { name: 'Purškimas' },
      { name: 'Derliaus nuėmimas' },
      { name: 'Skutimas' },
    ],
    skipDuplicates: true,
  });  

  // Create users

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: "gvidas123", // for me to remember :)
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: adminRole.id }
          }
        }
      }
    }
  });

  const farmerUser = await prisma.user.create({
    data: {
      username: 'farmer',
      email: 'farmer@example.com',
      password: "gvidas123",
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: farmerRole.id }
          }
        }
      }
    }
  });

  const workerUser1 = await prisma.user.create({
    data: {
      username: 'worker1',
      email: 'worker1@example.com',
      password: "gvidas123",
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: workerRole.id }
          }
        }
      }
    }
  });

  const workerUser2 = await prisma.user.create({
    data: {
      username: 'worker2',
      email: 'worker2@example.com',
      password: "gvidas123",
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: workerRole.id }
          }
        }
      }
    }
  });

  const workerUser3 = await prisma.user.create({
    data: {
      username: 'worker3',
      email: 'worker3@example.com',
      password: "gvidas123",
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: workerRole.id }
          }
        }
      }
    }
  });

  const agronomistUser = await prisma.user.create({
    data: {
      username: 'agronomist',
      email: 'agronomist@example.com',
      password: "gvidas123",
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: agronomistRole.id }
          }
        }
      }
    }
  });

  // my user
  const myUser = await prisma.user.create({
    data: {
      username: 'gvidas',
      email: 'gvidas@gmail.com',
      password: "gvidas123",
      hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
      roles: {
        create: {
          role: {
            connect: { id: farmerRole.id }
          }
        }
      },
      // fields: {
      //   create: {
      //     connect: { id: 1 }
      //   }
      // }
    }
  });

  //Create fields
  const field1 = await prisma.field.create({
    data: {
      name: 'Prie tvenkinio',
      area: 50.5,
      perimeter: 200.0,
      cropId: 1,
      ownerId: myUser.id,
    },
  });

  const field2 = await prisma.field.create({
    data: {
      name: 'Už dirbtuvių',
      area: 80.0,
      perimeter: 300.0,
      cropId: 2,
      ownerId: myUser.id,
    },
  });

  const field3 = await prisma.field.create({
    data: {
      name: 'Prie Editos',
      area: 45.0,
      perimeter: 180.0,
      cropId: 3,
      ownerId: farmerUser.id,
    },
  });

  // Create field tasks
  const fieldTask1 = await prisma.task.create({
    data: {
        typeId: 1,
        description: 'Reikia paruošti žemę sėjai ją suariant.',
        status: 'Completed',
        fieldId: field1.id,
        completionDate: new Date('2024-11-15'),
      }
  });

  const fieldTask2 = await prisma.task.create({
    data: {
        typeId: 3,
        description: 'Reikalinga išbarstyti azotines trąšas dėl geresnio derliaus.',
        status: 'Completed',
        fieldId: field1.id,
        completionDate: new Date('2024-10-10'),
      }
    });
    
  const fieldTask3 = await prisma.task.create({
    data: {   
        typeId: 2,
        description: 'Kviečių sėja 200 kg/ha.',
        status: 'Completed',
        fieldId: field2.id,
        completionDate: new Date('2024-11-15'),
      }
    });
    
  const fieldTask4 = await prisma.task.create({
    data: {
      typeId: 4,
      description: 'Reikia nupurkšti piktžoles, kad neužgožtų pagrindinės kultūros.',
      status: 'Pending',
      fieldId: field2.id,
      dueDate: new Date('2025-03-01'),
    }
  })

  const fieldTask5 = await prisma.task.create({
    data: {
      typeId: 5,
      description: 'Derliaus nuėmimas su javų kombainu.',
      status: 'Canceled',
      fieldId: field3.id,
      dueDate: new Date('2025-09-01'),
    }   
  });

// Create comments for field tasks
await prisma.comment.createMany({
  data: [
    {
      content: 'Buvo šlapia, išsivertė dideli luitai.',
      taskId: fieldTask1.id,
      createdAt: new Date(),
    },
    {
      content: 'Taip pat beariant kažkur pamečiau vieną kaltą.',
      taskId: fieldTask1.id,
      createdAt: new Date(),
    },
    {
      content: 'Normą taikiausi 150 kg/ha, bet dėl barstyklės netikslumo išsibarstė 200 kg/ha.',
      taskId: fieldTask2.id,
      createdAt: new Date(),
    },
    {
      content: 'Sėja pavyko puikiai, gylis gavosi apie 3-4 cm, drėgmės sočiai.',
      taskId: fieldTask3.id,
      createdAt: new Date(),
    },
  ],
  skipDuplicates: true,
});
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
