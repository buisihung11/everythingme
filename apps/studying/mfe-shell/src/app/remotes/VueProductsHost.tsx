import { useEffect, useRef } from 'react';
import { RemoteErrorBoundary } from '../components/ErrorBoundary';

// Vite federation remotes must be built — remoteEntry is served from preview, not dev server
const VUE_REMOTE_URL = 'http://localhost:4203/assets/remoteEntry.js';

interface VueFederationRemote {
  init: (shareScope: object) => Promise<void>;
  get: (module: string) => Promise<() => { mount: (el: HTMLElement) => () => void }>;
}

export function VueProductsHost() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function loadVueRemote() {
      if (!hostRef.current) return;

      try {
        // @originjs/vite-plugin-federation exposes ES module exports (get/init), not window globals
        const remote = (await import(
          /* webpackIgnore: true */
          VUE_REMOTE_URL
        )) as VueFederationRemote;

        await remote.init({});
        const factory = await remote.get('./Products');
        const module = factory();
        cleanup = module.mount(hostRef.current);
      } catch (error) {
        console.error('Failed to mount Vue products remote', error);
        if (hostRef.current) {
          hostRef.current.innerHTML =
            '<p class="text-amber-300">Start the Vue remote with <code class="rounded bg-slate-900 px-1">pnpm mfe:products</code> (port 4203), then refresh.</p>';
        }
      }
    }

    loadVueRemote();

    return () => cleanup?.();
  }, []);

  return (
    <RemoteErrorBoundary remoteName="mfe_products_vue (Vue)">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="mfe-concept-tag">Cross-Framework</span>
          <span className="mfe-concept-tag">Vite Module Federation</span>
        </div>
        <div ref={hostRef} />
      </div>
    </RemoteErrorBoundary>
  );
}
