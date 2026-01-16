import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const localUrl = process.env.LOCAL_DATABASE_URL;

if (!supabaseUrl || !localUrl) {
  throw new Error('Missing SUPABASE_DATABASE_URL or LOCAL_DATABASE_URL environment variables.');
}

// Supabase connection (direct connection, not pooler)
const supabase = new PrismaClient({
  datasources: {
    db: {
      url: supabaseUrl
    }
  }
});

// Local connection
const local = new PrismaClient({
  datasources: {
    db: {
      url: localUrl
    }
  }
});

async function migrate() {
  console.log('Starting data migration from Supabase to local PostgreSQL...\n');

  try {
    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await supabase.user.findMany();
    for (const user of users) {
      await local.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`✓ Migrated ${users.length} users\n`);

    // 2. Migrate Agents
    console.log('Migrating Agents...');
    const agents = await supabase.agent.findMany();
    for (const agent of agents) {
      await local.agent.upsert({
        where: { id: agent.id },
        update: agent,
        create: agent
      });
    }
    console.log(`✓ Migrated ${agents.length} agents\n`);

    // 3. Migrate Customers
    console.log('Migrating Customers...');
    const customers = await supabase.customer.findMany();
    for (const customer of customers) {
      await local.customer.upsert({
        where: { id: customer.id },
        update: customer,
        create: customer
      });
    }
    console.log(`✓ Migrated ${customers.length} customers\n`);

    // 4. Migrate Customer ID Files
    console.log('Migrating Customer ID Files...');
    const idFiles = await supabase.customerIdFile.findMany();
    for (const file of idFiles) {
      await local.customerIdFile.upsert({
        where: { id: file.id },
        update: file,
        create: file
      });
    }
    console.log(`✓ Migrated ${idFiles.length} customer ID files\n`);

    // 5. Migrate Transactions
    console.log('Migrating Transactions...');
    const transactions = await supabase.transaction.findMany();
    for (const txn of transactions) {
      await local.transaction.upsert({
        where: { id: txn.id },
        update: txn,
        create: txn
      });
    }
    console.log(`✓ Migrated ${transactions.length} transactions\n`);

    // 6. Migrate Exchange Rates
    console.log('Migrating Exchange Rates...');
    const rates = await supabase.exchangeRate.findMany();
    for (const rate of rates) {
      await local.exchangeRate.upsert({
        where: { id: rate.id },
        update: rate,
        create: rate
      });
    }
    console.log(`✓ Migrated ${rates.length} exchange rates\n`);

    // 7. Migrate Counters
    console.log('Migrating Counters...');
    const counters = await supabase.counter.findMany();
    for (const counter of counters) {
      await local.counter.upsert({
        where: { name: counter.name },
        update: counter,
        create: counter
      });
    }
    console.log(`✓ Migrated ${counters.length} counters\n`);

    // 8. Migrate Document Types
    console.log('Migrating Document Types...');
    const docTypes = await supabase.documentType.findMany();
    for (const docType of docTypes) {
      await local.documentType.upsert({
        where: { id: docType.id },
        update: docType,
        create: docType
      });
    }
    console.log(`✓ Migrated ${docTypes.length} document types\n`);

    // 9. Migrate Activity Logs
    console.log('Migrating Activity Logs...');
    const logs = await supabase.activityLog.findMany();
    for (const log of logs) {
      await local.activityLog.upsert({
        where: { id: log.id },
        update: log,
        create: log
      });
    }
    console.log(`✓ Migrated ${logs.length} activity logs\n`);

    // 10. Migrate Email Settings
    console.log('Migrating Email Settings...');
    const emailSettings = await supabase.emailSettings.findMany();
    for (const setting of emailSettings) {
      await local.emailSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting
      });
    }
    console.log(`✓ Migrated ${emailSettings.length} email settings\n`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await supabase.$disconnect();
    await local.$disconnect();
  }
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
