import { ReactNode, Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: ReactNode;
}

function RemoteFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        <p className="text-sm text-admin-muted">Loading remote module...</p>
        <p className="mt-1 text-xs text-sky-300">Dynamic Remote Loading</p>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<RemoteFallback />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
