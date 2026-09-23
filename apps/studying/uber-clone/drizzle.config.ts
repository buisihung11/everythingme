import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './services/ride-service/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://everythingme:everythingme@localhost:5433/uber_clone',
  },
});
