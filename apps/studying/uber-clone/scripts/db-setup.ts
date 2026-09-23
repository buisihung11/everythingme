/**
 * db-setup.ts
 * Creates the uber_clone database and pushes the Drizzle schema.
 */

import postgres from 'postgres';

const ADMIN_URL =
  process.env.ADMIN_DATABASE_URL ??
  'postgres://everythingme:everythingme@localhost:5433/everythingme';

const DB_NAME = 'uber_clone';

async function main() {
  console.log('Setting up uber_clone database…');

  // 1. Create database if needed
  const admin = postgres(ADMIN_URL, { max: 1 });
  try {
    await admin`CREATE DATABASE ${admin(DB_NAME)}`;
    console.log(`  ✚ Created database: ${DB_NAME}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already exists')) {
      console.log(`  ✓ Database already exists: ${DB_NAME}`);
    } else {
      throw err;
    }
  } finally {
    await admin.end();
  }

  // 2. Run drizzle-kit push
  const { execSync } = await import('child_process');
  console.log('  Running drizzle-kit push…');
  execSync('npx drizzle-kit push', {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: `postgres://everythingme:everythingme@localhost:5433/${DB_NAME}`,
    },
  });
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
