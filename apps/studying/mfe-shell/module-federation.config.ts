import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'mfe_shell',
  remotes: ['mfe_dashboard', 'mfe_users', 'mfe_analytics'],
};

export default config;
