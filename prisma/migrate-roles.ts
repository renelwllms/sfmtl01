import Database from 'better-sqlite3';

async function migrateRoles() {
  try {
    // Use direct SQL to migrate data
    const db = new Database('./prisma/dev.db');

    // Disable foreign keys temporarily
    db.exec('PRAGMA foreign_keys = OFF;');

    // Drop User_new table if it exists from previous failed attempt
    db.exec('DROP TABLE IF EXISTS User_new;');

    // Create new User table with roles column
    db.exec(`
      CREATE TABLE User_new (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        roles TEXT NOT NULL DEFAULT 'STAFF',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Copy data from old table, converting role to roles
    db.exec(`
      INSERT INTO User_new (id, email, passwordHash, roles, createdAt)
      SELECT id, email, passwordHash, role, createdAt FROM User;
    `);

    // Drop old table
    db.exec('DROP TABLE User;');

    // Rename new table
    db.exec('ALTER TABLE User_new RENAME TO User;');

    // Re-enable foreign keys
    db.exec('PRAGMA foreign_keys = ON;');

    db.close();

    console.log('Successfully migrated roles!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

migrateRoles();
