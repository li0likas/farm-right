import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';
import { connect } from 'http2';

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Clearing existing data...");

    // Clear existing data
    await prisma.taskEquipment.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.equipmentTypeOptions.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.field.deleteMany({});
    await prisma.fieldCropOptions.deleteMany({});
    await prisma.farmMember.deleteMany({});
    await prisma.farmRolePermission.deleteMany({});
    await prisma.farm.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});

  console.log("✅ Existing data cleared.");

  // Create permissions
  const permissions = await prisma.permission.createMany({
    data: [
      // Field permissions
      { name: 'FIELD_CREATE' },
      { name: 'FIELD_READ' },
      { name: 'FIELD_UPDATE' },
      { name: 'FIELD_DELETE' },
      
      // Field task permissions
      { name: 'FIELD_TASK_CREATE' },
      { name: 'FIELD_TASK_READ' },
      { name: 'FIELD_TASK_UPDATE' },
      { name: 'FIELD_TASK_DELETE' },
      
      // Field task comment permissions
      { name: 'FIELD_TASK_COMMENT_CREATE' },
      { name: 'FIELD_TASK_COMMENT_READ' },
      { name: 'FIELD_TASK_COMMENT_UPDATE' },
      { name: 'FIELD_TASK_COMMENT_DELETE' },
      
      // User management permissions
      { name: 'USER_MANAGE' },
      
      // Admin access permissions
      { name: 'ADMIN_ACCESS' },
      
      // Equipment permissions
      { name: 'EQUIPMENT_CREATE' },
      { name: 'EQUIPMENT_READ' },
      { name: 'EQUIPMENT_UPDATE' },
      { name: 'EQUIPMENT_DELETE' },
      
      // Farm permissions
      { name: 'FARM_CREATE' },
      { name: 'FARM_READ' },
      { name: 'FARM_UPDATE' },
      { name: 'FARM_DELETE' },
      
      // Crop permissions
      { name: 'CROP_CREATE' },
      { name: 'CROP_READ' },
      { name: 'CROP_UPDATE' },
      { name: 'CROP_DELETE' },
      
      // Task permissions
      { name: 'TASK_CREATE' },
      { name: 'TASK_READ' },
      { name: 'TASK_UPDATE' },
      { name: 'TASK_DELETE' },
      
      // Comment permissions
      { name: 'COMMENT_CREATE' },
      { name: 'COMMENT_READ' },
      { name: 'COMMENT_UPDATE' },
      { name: 'COMMENT_DELETE' },

      // Permission permissions
      { name: 'PERMISSION_READ' },
      { name: 'PERMISSION_ASSIGN' },
      { name: 'PERMISSION_REMOVE' },

      // Farm member permissions
      { name: 'FARM_MEMBER_CREATE' },
      { name: 'FARM_MEMBER_READ' },
      { name: 'FARM_MEMBER_UPDATE' },
      { name: 'FARM_MEMBER_DELETE' },


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

  // Fetch created roles & permissions
  const [adminRole, farmerRole, workerRole, agronomistRole] = await prisma.role.findMany();
  const allPermissions = await prisma.permission.findMany();

  // // Get created roles and permissions
  // const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  // const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  // const workerRole = await prisma.role.findUnique({ where: { name: 'WORKER' } });
  // const agronomistRole = await prisma.role.findUnique({ where: { name: 'AGRONOMIST' } });

  // const fieldCreatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_CREATE' } });
  // const fieldReadPermission = await prisma.permission.findUnique({ where: { name: 'FIELD_READ' } });
  // const fieldUpdatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_UPDATE' } });
  // const fieldDeletePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_DELETE' } });
  // const fieldTaskCreatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_CREATE' } });
  // const fieldTaskReadPermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_READ' } });
  // const fieldTaskUpdatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_UPDATE' } });
  // const fieldTaskDeletePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_DELETE' } });
  // const fieldTaskCommentCreatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_CREATE' } });
  // const fieldTaskCommentReadPermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_READ' } });
  // const fieldTaskCommentUpdatePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_UPDATE' } });
  // const fieldTaskCommentDeletePermission = await prisma.permission.findUnique({ where: { name: 'FIELD_TASK_COMMENT_DELETE' } });
  // const userManagePermission = await prisma.permission.findUnique({ where: { name: 'USER_MANAGE' } });
  // const adminAccessPermission = await prisma.permission.findUnique({ where: { name: 'ADMIN_ACCESS' } });

  // // Create roleRights
  // if (adminRole && farmerRole && workerRole && agronomistRole && fieldCreatePermission && fieldReadPermission && fieldUpdatePermission && fieldDeletePermission && fieldTaskCreatePermission && fieldTaskReadPermission && fieldTaskUpdatePermission && fieldTaskDeletePermission && fieldTaskCommentCreatePermission && fieldTaskCommentReadPermission && fieldTaskCommentUpdatePermission && fieldTaskCommentDeletePermission && userManagePermission && adminAccessPermission) {
  //   await prisma.roleRight.createMany({
  //     data: [
  //       // ADMIN role rights
  //       { roleId: adminRole.id, permissionId: fieldCreatePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldReadPermission.id },
  //       { roleId: adminRole.id, permissionId: fieldUpdatePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldDeletePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskCreatePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskReadPermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskUpdatePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskDeletePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskCommentCreatePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskCommentReadPermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskCommentUpdatePermission.id },
  //       { roleId: adminRole.id, permissionId: fieldTaskCommentDeletePermission.id },
  //       { roleId: adminRole.id, permissionId: userManagePermission.id },
  //       { roleId: adminRole.id, permissionId: adminAccessPermission.id },

  //       // FARMER role rights
  //       { roleId: farmerRole.id, permissionId: fieldCreatePermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldReadPermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldUpdatePermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldTaskCreatePermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldTaskReadPermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldTaskUpdatePermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldTaskCommentCreatePermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldTaskCommentReadPermission.id },
  //       { roleId: farmerRole.id, permissionId: fieldTaskCommentUpdatePermission.id },

  //       // WORKER role rights
  //       { roleId: workerRole.id, permissionId: fieldReadPermission.id },
  //       { roleId: workerRole.id, permissionId: fieldTaskReadPermission.id },
  //       { roleId: workerRole.id, permissionId: fieldTaskCommentCreatePermission.id },
  //       { roleId: workerRole.id, permissionId: fieldTaskCommentReadPermission.id },

  //       // AGRONOMIST role rights
  //       { roleId: agronomistRole.id, permissionId: fieldReadPermission.id },
  //       { roleId: agronomistRole.id, permissionId: fieldTaskReadPermission.id },
  //       { roleId: agronomistRole.id, permissionId: fieldTaskCommentCreatePermission.id },
  //       { roleId: agronomistRole.id, permissionId: fieldTaskCommentReadPermission.id },
  //       { roleId: agronomistRole.id, permissionId: fieldTaskCommentUpdatePermission.id },
  //     ],
  //     skipDuplicates: true,
  //   });
  // }

    // Create equipment type options
    const equipmentTypeOptions = await prisma.equipmentTypeOptions.createMany({
      data: [
        { name: "Tractor" },
        { name: "Combine Harvester" },
        { name: "Plow" },
        { name: "Sprayer" },
        { name: "Seeder" },
        { name: "Cultivator" },
        { name: "Fertilizer Spreader" }
      ],
      skipDuplicates: true
    });
  
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

    // Create task status options
  const taskStatusOptions = await prisma.taskStatusOptions.createMany({
    data: [
      { name: 'Completed' },
      { name: 'Pending' },
      { name: 'Canceled' },
    ],
    skipDuplicates: true,
  }); 

  // // Create users
  // const adminUser = await prisma.user.create({
  //   data: {
  //     username: 'admin',
  //     email: 'admin@example.com',
  //     password: "gvidas123", // for me to remember :)
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: adminRole.id }
  //     //     }
  //     //   }
  //     // }
  //   }
  // });

  // const farmerUser = await prisma.user.create({
  //   data: {
  //     username: 'farmer',
  //     email: 'farmer@example.com',
  //     password: "gvidas123",
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: farmerRole.id }
  //     //     }
  //     //   }
  //     // }
  //   }
  // });

  // const workerUser1 = await prisma.user.create({
  //   data: {
  //     username: 'worker1',
  //     email: 'worker1@example.com',
  //     password: "gvidas123",
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: workerRole.id }
  //     //     }
  //     //   }
  //     // }
  //   }
  // });

  // const workerUser2 = await prisma.user.create({
  //   data: {
  //     username: 'worker2',
  //     email: 'worker2@example.com',
  //     password: "gvidas123",
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: workerRole.id }
  //     //     }
  //     //   }
  //     // }
  //   }
  // });

  // const workerUser3 = await prisma.user.create({
  //   data: {
  //     username: 'worker3',
  //     email: 'worker3@example.com',
  //     password: "gvidas123",
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: workerRole.id }
  //     //     }
  //     //   }
  //     // }
  //   }
  // });

  // const agronomistUser = await prisma.user.create({
  //   data: {
  //     username: 'agronomist',
  //     email: 'agronomist@example.com',
  //     password: "gvidas123",
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: agronomistRole.id }
  //     //     }
  //     //   }
  //     // }
  //   }
  // });

  // // my user
  // const gvidasUser = await prisma.user.create({
  //   data: {
  //     username: 'gvidas',
  //     email: 'gvidas@gmail.com',
  //     password: "gvidas123",
  //     hash: "$argon2id$v=19$m=65536,t=3,p=4$PEoZK5Bd9h8TBCEutueP7g$BbbJCRqyBna3l0h8KGAd/p68NSzxU/sfsqGME7M+Y1A",
  //     // roles: {
  //     //   create: {
  //     //     role: {
  //     //       connect: { id: farmerRole.id }
  //     //     }
  //     //   }
  //     // },

  //     // fields: {
  //     //   create: {
  //     //     connect: { id: 1 }
  //     //   }
  //     // }
  //   }
  // });


  // ✅ Create users
  const users = await prisma.user.createMany({
    data: [
      { username: 'admin', email: 'admin@example.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
      { username: 'farmer', email: 'farmer@example.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
      { username: 'worker1', email: 'worker1@example.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
      { username: 'worker2', email: 'worker2@example.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
      { username: 'worker3', email: 'worker3@example.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
      { username: 'agronomist', email: 'agronomist@example.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
      { username: 'gvidas', email: 'gvidas@gmail.com', password: "gvidas123", hash: await argon.hash("gvidas123") },
    ],
    skipDuplicates: true,
  });

  // ✅ Fetch created users
  const [adminUser, farmerUser, workerUser1, workerUser2, workerUser3, agronomistUser, gvidasUser] = await prisma.user.findMany();

  // Create a new farm for user 'gvidas'
  const farm = await prisma.farm.create({
    data: {
      name: 'Garadausko ūkis',
      ownerId: gvidasUser.id,
    },
  });

  // Create a new farm for user 'farmer'
  const farm2 = await prisma.farm.create({
    data: {
      name: 'Fermerio ūkis',
      ownerId: farmerUser.id,
    },
  });

  // ✅ Fetch created farms
  const farms = await prisma.farm.findMany();

  // Assign Users to 'Garadausko ukis' Farm with Roles
  await prisma.farmMember.createMany({
    data: [
      { userId: workerUser1.id, farmId: farm.id, roleId: farmerRole.id },
      { userId: workerUser2.id, farmId: farm.id, roleId: workerRole.id },
      { userId: agronomistUser.id, farmId: farm.id, roleId: agronomistRole.id },
      { userId: gvidasUser.id, farmId: farm.id, roleId: farmerRole.id },
    ],
    skipDuplicates: true
  });

  // Assign Users to 'Fermerio ukis' Farm with Roles
  await prisma.farmMember.createMany({
    data: [
      { userId: gvidasUser.id, farmId: farm2.id, roleId: agronomistRole.id },
      { userId: farmerUser.id, farmId: farm2.id, roleId: farmerRole.id },
    ],
    skipDuplicates: true
  });

  // Assign permissions to roles PER FARM
  for (const farm of farms) {
    for (const role of [adminRole, farmerRole, workerRole, agronomistRole]) {
      // Get permissions for each role dynamically
      let rolePermissions: string[] = [];

      if (role.name === 'ADMIN') {
        rolePermissions = allPermissions.map((p) => p.name);
      } else if (role.name === 'FARMER') {
        rolePermissions = ['FIELD_CREATE', 'FIELD_READ', 'FIELD_UPDATE', 'FIELD_TASK_CREATE', 'FIELD_TASK_READ', 'FIELD_TASK_UPDATE', 'PERMISSION_READ', 'PERMISSION_ASSIGN', 'PERMISSION_REMOVE', 'FARM_MEMBER_CREATE', 'FARM_MEMBER_READ', 'FARM_MEMBER_UPDATE', 'FARM_MEMBER_DELETE'];
      } else if (role.name === 'WORKER') {
        rolePermissions = ['FIELD_READ', 'FIELD_TASK_READ', 'FIELD_TASK_COMMENT_CREATE', 'FIELD_TASK_COMMENT_READ'];
      } else if (role.name === 'AGRONOMIST') {
        rolePermissions = ['FIELD_READ', 'FIELD_TASK_READ', 'FIELD_TASK_COMMENT_CREATE', 'FIELD_TASK_COMMENT_READ', 'FIELD_TASK_COMMENT_UPDATE'];
      }

      // Create permissions in `FarmRolePermission`
      for (const permissionName of rolePermissions) {
        const permission = allPermissions.find((p) => p.name === permissionName);
        if (permission) {
          await prisma.farmRolePermission.create({
            data: {
              farmId: farm.id,
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
  }

  // Fetch created equipment types
  const tractorType = await prisma.equipmentTypeOptions.findUnique({ where: { name: "Tractor" } });
  const harvesterType = await prisma.equipmentTypeOptions.findUnique({ where: { name: "Combine Harvester" } });
  const sprayerType = await prisma.equipmentTypeOptions.findUnique({ where: { name: "Sprayer" } });

  // Add equipment for user
  const tractor = await prisma.equipment.create({
    data: {
      name: "John Deere 6155M",
      typeId: tractorType.id,
      ownerId: gvidasUser.id,
    }
  });

  const harvester = await prisma.equipment.create({
    data: {
      name: "New Holland CR10.90",
      typeId: harvesterType.id,
      ownerId: gvidasUser.id,
    }
  });

  const sprayer = await prisma.equipment.create({
    data: {
      name: "Amazone UX 11200",
      typeId: sprayerType.id,
      ownerId: gvidasUser.id,
    }
  });

  //Create fields
  const field1 = await prisma.field.create({
    data: {
      name: 'Prie tvenkinio',
      area: 50.5,
      perimeter: 200.0,
      cropId: 1,
      farmId: farm.id, // Assign to 'Garadausko ukis' farm
      ownerId: gvidasUser.id,
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718]
          ]
        ]
      }  
    },
  });

  const field2 = await prisma.field.create({
    data: {
      name: 'Už dirbtuvių',
      area: 80.0,
      perimeter: 300.0,
      cropId: 2,
      ownerId: gvidasUser.id,
      farmId: farm.id, // Assign to 'Garadausko ukis' farm
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718]
          ]
        ]
      }
    },
  });

  const field3 = await prisma.field.create({
    data: {
      name: 'Prie Editos',
      area: 45.0,
      perimeter: 180.0,
      cropId: 3,
      ownerId: farmerUser.id,
      farmId: farm2.id, // Assign to 'Fermerio ukis' farm
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718],
            [23.7284381, 56.3450718]
          ]
        ]
      }
    },
  });

  // Create field tasks
  const fieldTask1 = await prisma.task.create({
    data: {
        typeId: 1,
        description: 'Reikia paruošti žemę sėjai ją suariant.',
        statusId: 1,
        fieldId: field1.id,
        completionDate: new Date('2024-11-15'),
      }
  });

  const fieldTask2 = await prisma.task.create({
    data: {
        typeId: 3,
        description: 'Reikalinga išbarstyti azotines trąšas dėl geresnio derliaus.',
        statusId: 1,
        fieldId: field1.id,
        completionDate: new Date('2024-10-10'),
      }
    });
    
  const fieldTask3 = await prisma.task.create({
    data: {   
        typeId: 2,
        description: 'Kviečių sėja 200 kg/ha.',
        statusId: 1,
        fieldId: field2.id,
        completionDate: new Date('2024-11-15'),
      }
    });
    
  const fieldTask4 = await prisma.task.create({
    data: {
      typeId: 4,
      description: 'Reikia nupurkšti piktžoles, kad neužgožtų pagrindinės kultūros.',
      statusId: 2,
      fieldId: field2.id,
      dueDate: new Date('2025-03-01'),
    }
  })

  const fieldTask5 = await prisma.task.create({
    data: {
      typeId: 5,
      description: 'Derliaus nuėmimas su javų kombainu.',
      statusId: 3,
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

// Assign equipment to tasks
await prisma.taskEquipment.createMany({
  data: [
    { taskId: fieldTask1.id, equipmentId: tractor.id },
    { taskId: fieldTask4.id, equipmentId: sprayer.id },
  ],
  skipDuplicates: true
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
