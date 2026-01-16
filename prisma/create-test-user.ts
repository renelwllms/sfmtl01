import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    const amlEmail = process.env.TEST_AML_EMAIL || 'aml@test.com';
    const amlPassword = process.env.TEST_AML_PASSWORD;

    if (!adminPassword || !amlPassword) {
      throw new Error('Missing TEST_ADMIN_PASSWORD or TEST_AML_PASSWORD environment variables.');
    }

    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log('Test user already exists. Updating...');
      // Update the user to have proper roles field
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          roles: 'ADMIN,STAFF'
        }
      });
      console.log(`Updated ${adminEmail} with roles: ADMIN,STAFF`);
    } else {
      // Create new test user
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          roles: 'ADMIN,STAFF'
        }
      });

      console.log('Created test user:');
      console.log(`Email: ${adminEmail}`);
      console.log('Roles:', user.roles);
    }

    // Also create an AML user
    const existingAml = await prisma.user.findUnique({
      where: { email: amlEmail }
    });

    if (existingAml) {
      await prisma.user.update({
        where: { email: amlEmail },
        data: {
          roles: 'STAFF,AML'
        }
      });
      console.log(`Updated ${amlEmail} with roles: STAFF,AML`);
    } else {
      const passwordHash = await bcrypt.hash(amlPassword, 10);

      await prisma.user.create({
        data: {
          email: amlEmail,
          passwordHash,
          roles: 'STAFF,AML'
        }
      });

      console.log('\nCreated AML test user:');
      console.log(`Email: ${amlEmail}`);
      console.log('Roles: STAFF,AML');
    }

    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true
      }
    });

    console.log('\nAll users in database:');
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

createTestUser();
