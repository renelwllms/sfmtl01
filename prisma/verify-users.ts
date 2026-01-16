import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    console.log('Checking all users in database:\n');

    const users = await prisma.user.findMany();
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    const amlPassword = process.env.TEST_AML_PASSWORD;

    for (const user of users) {
      console.log(`Email: ${user.email}`);
      console.log(`Roles: ${user.roles}`);
      console.log(`Has password hash: ${user.passwordHash ? 'Yes' : 'No'}`);
      console.log(`Password hash length: ${user.passwordHash.length}`);

      // Test password verification for test users
      if (user.email === 'admin@test.com' && adminPassword) {
        const isValid = await bcrypt.compare(adminPassword, user.passwordHash);
        console.log(`Password for admin@test.com is valid: ${isValid}`);
      }

      if (user.email === 'aml@test.com' && amlPassword) {
        const isValid = await bcrypt.compare(amlPassword, user.passwordHash);
        console.log(`Password for aml@test.com is valid: ${isValid}`);
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
