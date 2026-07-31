import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'mfe_users',
  remotes: [],
  // Emit classic remoteEntry.js so the React webpack host can load without ESM/import.meta issues
  library: { type: 'var', name: 'mfe_users' },
  exposes: {
    './Routes': 'apps/studying/mfe_users/src/app/remote-entry/entry.routes.ts',
    './Mount': 'apps/studying/mfe_users/src/app/remote-entry/mount.ts',
  },
};

export default config;
