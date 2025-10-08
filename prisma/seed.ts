import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();

async function main() {
  const adminEmail = 'admin@samoafinance.local';
  const staffEmail = 'staff@samoafinance.local';

  const [admin, staff] = await Promise.all([
    db.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('Admin@123', 12),
        roles: 'ADMIN,STAFF'
      }
    }),
    db.user.upsert({
      where: { email: staffEmail },
      update: {},
      create: {
        email: staffEmail,
        passwordHash: await bcrypt.hash('Staff@123', 12),
        roles: 'STAFF'
      }
    })
  ]);

  // counters
  await db.counter.upsert({
    where: { name: 'customer' },
    update: {},
    create: { name: 'customer', value: 0 }
  });
  await db.counter.upsert({
    where: { name: 'transaction' },
    update: {},
    create: { name: 'transaction', value: 0 }
  });

  console.log({ admin, staff });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
