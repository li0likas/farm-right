// test/integration/helpers.ts

/**
 * Cleans up the database by truncating all tables
 * Preserves the database schema while removing all data
 */
export async function cleanDatabase(prisma) {
  try {
    // Disable foreign key constraints for the cleanup
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;
    
    // Execute deletion in the correct order to respect foreign key constraints
    await prisma.$transaction([
      prisma.taskParticipant.deleteMany({}),
      prisma.taskEquipment.deleteMany({}),
      prisma.comment.deleteMany({}),
      prisma.task.deleteMany({}),
      prisma.field.deleteMany({}),
      prisma.equipment.deleteMany({}),
      prisma.farmInvitation.deleteMany({}),
      prisma.farmRolePermission.deleteMany({}),
      prisma.farmMember.deleteMany({}),
      prisma.season.deleteMany({}),
      prisma.farm.deleteMany({}),
      prisma.user.deleteMany({}),
      prisma.permission.deleteMany({}),
      prisma.role.deleteMany({}),
      prisma.fieldCropOptions.deleteMany({}),
      prisma.taskTypeOptions.deleteMany({}),
      prisma.taskStatusOptions.deleteMany({}),
      prisma.equipmentTypeOptions.deleteMany({}),
    ]);
    
    // Re-enable foreign key constraints
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;
    
    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Waits for a specific amount of time
 * @param ms Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates random string
 * @param length Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}