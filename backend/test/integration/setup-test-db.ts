import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Function to set up the test database for integration testing
 * This function will:
 * 1. Create the test database if it doesn't exist
 * 2. Run migrations on the test database
 */
async function setupTestDatabase() {
  // Load test environment variables if not already loaded
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.test' });
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in .env.test');
  }
  
  // Extract database name from URL
  const dbNameMatch = databaseUrl.match(/\/([^?]*)/);
  if (!dbNameMatch || !dbNameMatch[1]) {
    throw new Error('Could not extract database name from DATABASE_URL');
  }
  
  const dbName = dbNameMatch[1];
  console.log(`Setting up test database: ${dbName}`);
  
  try {
    // Create database if it doesn't exist
    const pgUrl = databaseUrl.replace(dbName, 'postgres');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: pgUrl
        }
      }
    });
    
    // Check if database exists and create it if it doesn't
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
    
    // Run Prisma migrations on the test database
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

// Export as default function
export default setupTestDatabase;