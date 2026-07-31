/// <reference types='vitest' />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/apps/studying/mfe-products-vue',
  server: {
    port: 4203,
    host: 'localhost',
    cors: true,
  },
  preview: {
    port: 4303,
    host: 'localhost',
    cors: true,
  },
  plugins: [
    vue(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    federation({
      name: 'mfe_products_vue',
      filename: 'remoteEntry.js',
      exposes: {
        './Products': './src/remote-entry.ts',
      },
      shared: ['vue'],
    }),
  ],
  build: {
    outDir: '../../../dist/apps/studying/mfe-products-vue',
    emptyOutDir: true,
    reportCompressedSize: true,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
