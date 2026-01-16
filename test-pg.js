const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

const client = connectionString
  ? new Client({ connectionString })
  : new Client({
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    });

async function test() {
  try {
    if (!connectionString && (!process.env.PGDATABASE || !process.env.PGUSER || !process.env.PGPASSWORD)) {
      throw new Error('Missing DATABASE_URL or PGDATABASE/PGUSER/PGPASSWORD env vars.');
    }

    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected!');

    const res = await client.query('SELECT current_database(), current_user');
    console.log('✓ Query result:', res.rows[0]);

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

test();
