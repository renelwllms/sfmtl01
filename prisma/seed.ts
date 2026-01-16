import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
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
  console.log('Seeded counters.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
