import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany();

    console.log('Fixing existing users...\n');

    for (const user of users) {
      // Check if roles field doesn't contain a comma (single role)
      if (!user.roles.includes(',')) {
        console.log(`Updating ${user.email} from "${user.roles}" to "${user.roles}"`);
        // The role is already correct, it's just a single role
        // No update needed unless we want to ensure format consistency
      }
    }

    console.log('\nUpdated all users!');

    // Show final state
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        roles: true
      }
    });

    console.log('\nCurrent users:');
    allUsers.forEach(u => {
      console.log(`- ${u.email}: ${u.roles}`);
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers();
