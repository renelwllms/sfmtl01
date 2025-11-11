const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'samoa_finance',
  user: 'postgres',
  password: 'postgres',
});

async function test() {
  try {
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
