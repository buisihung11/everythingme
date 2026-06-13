import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSessionFn } from '@/lib/auth-server';

export const Route = createFileRoute('/admin/')({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session?.user) {
      throw redirect({ to: '/' });
    }
    return { session };
  },
  component: AdminPage,
});

function AdminPage() {
  const { session } = Route.useRouteContext();

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-2xl p-6">
        <p className="island-kicker mb-2">Protected area</p>
        <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)]">
          Admin
        </h1>
        <p className="text-[var(--sea-ink-soft)]">
          Signed in as <strong>{session.user.email}</strong>. CMS authoring UI
          will live here later.
        </p>
      </section>
    </main>
  );
}
