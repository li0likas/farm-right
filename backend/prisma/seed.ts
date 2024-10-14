import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  const field1 = await prisma.field.create({
    data: {
      name: 'North Field',
      size: 50.5,
      location: 'Northern Region',
      crop: 'Wheat',
    },
  });

  const field2 = await prisma.field.create({
    data: {
      name: 'East Field',
      size: 80.0,
      location: 'Eastern Hills',
      crop: 'Corn',
    },
  });

  const field3 = await prisma.field.create({
    data: {
      name: 'West Field',
      size: 45.0,
      location: 'Western Plains',
      crop: 'Barley',
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Plowing',
        description: 'Plowing the field in preparation for planting.',
        status: 'Pending',
        fieldId: field1.id,
      },
      {
        title: 'Fertilizing',
        description: 'Applying nitrogen fertilizer to boost crop growth.',
        status: 'In Progress',
        fieldId: field1.id,
      },
      {
        title: 'Irrigation Setup',
        description: 'Setting up irrigation system in the field.',
        status: 'Completed',
        fieldId: field2.id,
      },
      {
        title: 'Weeding',
        description: 'Removing weeds from the field to prevent crop damage.',
        status: 'Pending',
        fieldId: field2.id,
      },
      {
        title: 'Harvesting',
        description: 'Harvesting crops from the field.',
        status: 'Pending',
        fieldId: field3.id,
      },
    ],
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
