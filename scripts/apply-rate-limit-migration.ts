import postgres from 'postgres';
import { env } from '../src/env';
import { readFileSync } from 'fs';

const sql = postgres(env.DATABASE_URL, { max: 1 });

async function main() {
  console.log('Applying rate limit migration...');
  
  const migrationSQL = readFileSync('drizzle/0003_add_rate_limit_fields.sql', 'utf-8');
  
  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ Rate limit fields added successfully!');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
  
  await sql.end();
}

main();

