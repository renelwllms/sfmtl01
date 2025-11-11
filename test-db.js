const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function test() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);

    await db.$connect();
    console.log('✓ Connected successfully!');

    const count = await db.user.count();
    console.log(`✓ User count: ${count}`);

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.$disconnect();
  }
}

test();
