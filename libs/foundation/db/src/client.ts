import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '@everythingme/config';
import * as schema from './schema/index';

let client: ReturnType<typeof postgres> | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function createDb(connectionString = getEnv().DATABASE_URL) {
  const sql = postgres(connectionString, { max: 1 });
  return {
    sql,
    db: drizzle(sql, { schema }),
  };
}

export function getDb() {
  if (!db || !client) {
    const created = createDb();
    client = created.sql;
    db = created.db;
  }

  return db;
}

export { schema };
