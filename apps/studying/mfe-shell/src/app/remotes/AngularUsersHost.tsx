import { useEffect, useRef } from 'react';
import { RemoteErrorBoundary } from '../components/ErrorBoundary';

export function AngularUsersHost() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAngularRemote() {
      if (!hostRef.current) return;

      try {
        const remote = await import('mfe_users/Mount');
        if (mounted && hostRef.current) {
          await remote.mountUsers(hostRef.current);
        }
      } catch (error) {
        console.error('Failed to mount Angular users remote', error);
        if (hostRef.current) {
          hostRef.current.innerHTML =
            '<p class="text-amber-300">Start mfe_users on port 4202 with <code class="rounded bg-slate-900 px-1">pnpm mfe:users</code>, then refresh.</p>';
        }
      }
    }

    loadAngularRemote();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <RemoteErrorBoundary remoteName="mfe_users (Angular)">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="mfe-concept-tag">Cross-Framework</span>
          <span className="mfe-concept-tag">Web Components Bridge</span>
        </div>
        <div ref={hostRef} />
      </div>
    </RemoteErrorBoundary>
  );
}
