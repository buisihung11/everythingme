import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const url =
  process.env.DATABASE_URL ??
  'postgres://everythingme:everythingme@localhost:5433/uber_clone';

const sql = postgres(url, { max: 5 });
export const db = drizzle(sql, { schema });
export { schema };
