import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    if (existingUser) {
      console.log('Test user already exists. Updating...');
      // Update the user to have proper roles field
      await prisma.user.update({
        where: { email: 'admin@test.com' },
        data: {
          roles: 'ADMIN,STAFF'
        }
      });
      console.log('Updated admin@test.com with roles: ADMIN,STAFF');
    } else {
      // Create new test user
      const passwordHash = await bcrypt.hash('admin123', 10);

      const user = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          passwordHash,
          roles: 'ADMIN,STAFF'
        }
      });

      console.log('Created test user:');
      console.log('Email: admin@test.com');
      console.log('Password: admin123');
      console.log('Roles:', user.roles);
    }

    // Also create an AML user
    const existingAml = await prisma.user.findUnique({
      where: { email: 'aml@test.com' }
    });

    if (existingAml) {
      await prisma.user.update({
        where: { email: 'aml@test.com' },
        data: {
          roles: 'STAFF,AML'
        }
      });
      console.log('Updated aml@test.com with roles: STAFF,AML');
    } else {
      const passwordHash = await bcrypt.hash('aml123', 10);

      await prisma.user.create({
        data: {
          email: 'aml@test.com',
          passwordHash,
          roles: 'STAFF,AML'
        }
      });

      console.log('\nCreated AML test user:');
      console.log('Email: aml@test.com');
      console.log('Password: aml123');
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
