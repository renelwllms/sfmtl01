import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    console.log('Checking all users in database:\n');

    const users = await prisma.user.findMany();

    for (const user of users) {
      console.log(`Email: ${user.email}`);
      console.log(`Roles: ${user.roles}`);
      console.log(`Has password hash: ${user.passwordHash ? 'Yes' : 'No'}`);
      console.log(`Password hash length: ${user.passwordHash.length}`);

      // Test password verification for test users
      if (user.email === 'admin@test.com') {
        const isValid = await bcrypt.compare('admin123', user.passwordHash);
        console.log(`Password 'admin123' is valid: ${isValid}`);
      }

      if (user.email === 'aml@test.com') {
        const isValid = await bcrypt.compare('aml123', user.passwordHash);
        console.log(`Password 'aml123' is valid: ${isValid}`);
      }

      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers();
