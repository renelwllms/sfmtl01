import Database from 'better-sqlite3';

async function addAmlFields() {
  try {
    const db = new Database('./prisma/dev.db');

    console.log('Adding AML tracking fields to Transaction table...');

    // Add new columns (using quotes around table name since Transaction is a reserved word)
    db.exec(`
      ALTER TABLE "Transaction" ADD COLUMN isPtrRequired INTEGER NOT NULL DEFAULT 0;
    `);

    db.exec(`
      ALTER TABLE "Transaction" ADD COLUMN isGoAmlExportReady INTEGER NOT NULL DEFAULT 0;
    `);

    db.exec(`
      ALTER TABLE "Transaction" ADD COLUMN goAmlExportedAt DATETIME;
    `);

    console.log('Creating indexes for AML fields...');

    db.exec(`
      CREATE INDEX IF NOT EXISTS Transaction_isPtrRequired_idx ON "Transaction"(isPtrRequired);
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS Transaction_isGoAmlExportReady_idx ON "Transaction"(isGoAmlExportReady);
    `);

    // Update existing international transactions (non-WST) with >= NZD 1,000 to require PTR
    console.log('Flagging existing international transactions >= NZD 1,000 for PTR...');
    db.exec(`
      UPDATE "Transaction"
      SET isPtrRequired = 1, isGoAmlExportReady = 1
      WHERE currency != 'WST' AND totalPaidNzdCents >= 100000;
    `);

    db.close();

    console.log('Successfully added AML tracking fields!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

addAmlFields();
