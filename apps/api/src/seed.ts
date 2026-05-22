import 'dotenv/config';
import pool from './db/pool';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  console.log('Running database migrations...');
  const schema = readFileSync(join(__dirname, 'db', 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('✅ Database schema applied');
  await pool.end();
}

runMigrations().catch(console.error);
