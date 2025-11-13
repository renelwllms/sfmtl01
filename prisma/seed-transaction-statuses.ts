import { db } from '../src/lib/db';

async function seedTransactionStatuses() {
  console.log('Seeding transaction statuses...');

  const statuses = [
    {
      name: 'OPEN',
      label: 'Open',
      color: '#3b82f6', // Blue
      isDefault: true,
      isActive: true,
      order: 1
    },
    {
      name: 'IN_PROGRESS',
      label: 'In Progress',
      color: '#f59e0b', // Amber
      isDefault: false,
      isActive: true,
      order: 2
    },
    {
      name: 'COMPLETED',
      label: 'Completed',
      color: '#10b981', // Green
      isDefault: false,
      isActive: true,
      order: 3
    },
    {
      name: 'CLOSED',
      label: 'Closed',
      color: '#6b7280', // Gray
      isDefault: false,
      isActive: true,
      order: 4
    }
  ];

  for (const status of statuses) {
    const existing = await db.transactionStatus.findUnique({
      where: { name: status.name }
    });

    if (existing) {
      console.log(`Status "${status.label}" already exists, updating...`);
      await db.transactionStatus.update({
        where: { name: status.name },
        data: {
          label: status.label,
          color: status.color,
          isDefault: status.isDefault,
          isActive: status.isActive,
          order: status.order
        }
      });
    } else {
      console.log(`Creating status "${status.label}"...`);
      await db.transactionStatus.create({
        data: status
      });
    }
  }

  console.log('Transaction statuses seeded successfully!');
}

seedTransactionStatuses()
  .catch((error) => {
    console.error('Error seeding transaction statuses:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
