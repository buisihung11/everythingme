import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../..',
);

for (const envFile of [
  '.env',
  '.env.local',
  'apps/blog/.env',
  'apps/blog/.env.local',
]) {
  loadEnv({ path: path.join(workspaceRoot, envFile), override: true });
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
