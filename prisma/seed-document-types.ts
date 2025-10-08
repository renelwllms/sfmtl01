import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDocumentTypes() {
  // Clear all existing document types first
  await prisma.documentType.deleteMany({});

  const defaultTypes = [
    { name: 'PASSPORT', label: 'Passport', order: 1 },
    { name: 'DRIVERS_LICENSE', label: "Driver's License", order: 2 }
  ];

  for (const type of defaultTypes) {
    await prisma.documentType.upsert({
      where: { name: type.name },
      update: {},
      create: {
        ...type,
        isDefault: true,
        isActive: true
      }
    });
  }

  console.log('Document types seeded successfully');
}

seedDocumentTypes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
