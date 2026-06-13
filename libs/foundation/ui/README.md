# @everythingme/ui

Shared UI package built on [shadcn/ui](https://ui.shadcn.com/) (New York style) with Tailwind CSS v4.

## Included components

- `Button` — shadcn button with variants
- `Card` — shadcn card layout primitives
- `PageContainer` — simple layout helper
- `cn` — `clsx` + `tailwind-merge` utility

## Add more components

From the UI package:

```bash
cd libs/foundation/ui
pnpm dlx shadcn@latest add badge
```

From an app (installs into the shared package via `components.json` aliases):

```bash
cd apps/blog
pnpm dlx shadcn@latest add badge
```

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle } from '@everythingme/ui';
```

Import theme variables in your app CSS:

```css
@import "../../../libs/foundation/ui/src/styles/globals.css";
```
