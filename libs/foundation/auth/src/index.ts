import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { getEnv } from '@everythingme/config';
import { getDb, schema } from '@everythingme/db';

let authInstance: ReturnType<typeof betterAuth> | undefined;

export function getAuth() {
  if (!authInstance) {
    const env = getEnv();
    authInstance = betterAuth({
      database: drizzleAdapter(getDb(), {
        provider: 'pg',
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      emailAndPassword: {
        enabled: true,
      },
      plugins: [tanstackStartCookies()],
    });
  }

  return authInstance;
}

export type Auth = ReturnType<typeof getAuth>;
