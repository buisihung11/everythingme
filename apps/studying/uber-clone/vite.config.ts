import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../../..');
const uiPackageRoot = resolve(workspaceRoot, 'libs/foundation/ui');
const requireFromUi = createRequire(resolve(uiPackageRoot, 'package.json'));

/** Resolve a dependency owned by @everythingme/ui (pnpm isolation). */
function uiDep(specifier: string): string {
  return requireFromUi.resolve(specifier);
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'web',
  server: {
    port: 4400,
    strictPort: true,
    fs: {
      allow: [workspaceRoot],
    },
  },
  resolve: {
    // NX path mappings from tsconfig.base.json (@everythingme/*, @studying/*)
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom'],
    alias: {
      // UI lib deps live under libs/foundation/ui; map them so Vite can resolve
      // when following tsconfig path imports into the shared source.
      'radix-ui': uiDep('radix-ui'),
      'lucide-react': uiDep('lucide-react'),
      '@radix-ui/react-slider': uiDep('@radix-ui/react-slider'),
      '@radix-ui/react-progress': uiDep('@radix-ui/react-progress'),
      '@radix-ui/react-scroll-area': uiDep('@radix-ui/react-scroll-area'),
      '@radix-ui/react-separator': uiDep('@radix-ui/react-separator'),
      '@radix-ui/react-tabs': uiDep('@radix-ui/react-tabs'),
      '@radix-ui/react-slot': uiDep('@radix-ui/react-slot'),
    },
  },
  optimizeDeps: {
    include: [
      'radix-ui',
      'lucide-react',
      '@radix-ui/react-slider',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slot',
    ],
  },
});
