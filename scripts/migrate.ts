import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../src/env';

const sql = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations complete!');
  
  // Apply custom SQL from 0002
  console.log('Applying full-text search enhancements...');
  const fs = await import('fs');
  const customSql = fs.readFileSync('drizzle/0002_add_fulltext_search.sql', 'utf-8');
  await sql.unsafe(customSql);
  console.log('Full-text search enhancements applied!');
  
  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

