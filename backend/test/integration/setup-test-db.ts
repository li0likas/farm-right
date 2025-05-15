import * as dotenv from 'dotenv';

const result = dotenv.config({ path: '.env.test' });
console.log(result);

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

setupTestDatabase();

async function setupTestDatabase() {
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.test' });
  }

  console.log(`Loaded DATABASE_URL: ${process.env.DATABASE_URL}`);

  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in .env.test');
  }
  
  const dbUrl = new URL(databaseUrl);
  const dbName = dbUrl.pathname.replace('/', '');

  console.log(`Setting up test database: ${dbName}`);
  
  try {
    const pgUrl = databaseUrl.replace(dbName, 'postgres');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: pgUrl
        }
      }
    });
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
      const exists = Array.isArray(result) && result.length > 0;
      
      if (!exists) {
        console.log(`Creating database ${dbName}...`);
        await prisma.$executeRaw`CREATE DATABASE "${dbName}"`;
        console.log(`Database ${dbName} created.`);
      } else {
        console.log(`Database ${dbName} already exists.`);
      }
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('Running Prisma migrations...');
    try {
      await execAsync(`npx prisma migrate deploy --schema=./prisma/schema.prisma`);
      console.log('Migrations applied successfully.');
    } catch (migrateError) {
      console.error('Error running migrations:', migrateError);
      throw migrateError;
    }
    
    console.log('Test database setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

export default setupTestDatabase;