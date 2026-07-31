# Micro Frontend Admin Study App

A hands-on NX monorepo demonstrating micro frontend architecture with a React shell and Angular, Vue, and React remotes.

## Architecture

| App | Framework | Port | Role |
|-----|-----------|------|------|
| `mfe_shell` | React | 4200 | Host / Shell |
| `mfe_dashboard` | React | 4201 | Remote |
| `mfe_users` | Angular | 4202 | Remote |
| `mfe_products_vue` | Vue | 4203 | Remote |
| `mfe_analytics` | React | 4204 | Remote |

## Quick Start

Run all micro frontends in parallel:

```bash
pnpm mfe:all
```

Or run individually:

```bash
pnpm mfe:shell      # React host on :4200
pnpm mfe:dashboard  # React remote on :4201
pnpm mfe:users      # Angular remote on :4202
pnpm mfe:products   # Vue remote on :4203
pnpm mfe:analytics  # React remote on :4204
```

Open http://localhost:4200 to see the composed admin app.

## Concepts Demonstrated

- **Module Federation** — Webpack 5 / Vite runtime composition
- **Host / Remote Pattern** — Shell orchestrates independently built apps
- **Cross-Framework** — Angular Web Components + Vue mount bridge inside React
- **Shared Singleton** — React, auth store, event bus on `window`
- **Dynamic Remote Loading** — `React.lazy` + custom mount functions
- **Error Boundaries** — Graceful fallback when remotes are offline
- **Event Bus** — `window.__MFE_EVENT_BUS__` for cross-remote communication
- **Shared State** — `window.__MFE_AUTH_STORE__` (Zustand singleton)
- **Independent Dev** — Each remote runs standalone on its own port

## Lessons

All documentation — architecture, hands-on exercises, and issues encountered — is in one blog post:

**[Learning Micro Frontends the Hard Way](/blog/technical/system-design/learning-micro-frontends)**
