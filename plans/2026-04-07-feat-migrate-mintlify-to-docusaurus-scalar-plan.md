---
title: "feat: Migrate Mintlify docs to Docusaurus + @scalar/docusaurus"
type: feat
status: completed
date: 2026-04-07
---

# feat: Migrate Mintlify Docs to Docusaurus + @scalar/docusaurus

## Overview

Replace the Mintlify-based docs (cloud-hosted, account-required) with a fully self-hosted Docusaurus site using the `@scalar/docusaurus` plugin for an interactive OpenAPI reference. No Scalar account required. Deploy to Netlify with automatic deploys on push to `main`.

**Brainstorm:** `docs/brainstorms/2026-04-07-mintlify-to-docusaurus-scalar-brainstorm.md`

---

## Current State

| File | Role |
|---|---|
| `docs.json` | Mintlify site config |
| `index.mdx` | Intro page — uses `<CardGroup>`, `<Card>` |
| `authentication.mdx` | Auth guide — uses `<Warning>`, `<CodeGroup>`, `<Steps>`, `<Note>` |
| `openapi.json` | OpenAPI 3.0.0 spec — 107 operations, 21 tag groups already applied |
| `README.md` | Stub only |

No `package.json`, no `.gitignore`, no CI/CD, no Node.js infrastructure.

---

## Proposed Solution

Scaffold Docusaurus in the repo root, wire up the Scalar plugin for the interactive API reference, convert the two `.mdx` guide pages to Docusaurus MDX, and configure Netlify deployment.

---

## Technical Considerations

### Global security not set
The spec declares `X-API-Key` but has no `security` key at the root level (equivalent to no global auth). Scalar's try-it console won't auto-populate the auth header. Fix: add `"security": [{"X-API-Key": []}]` at the root of `openapi.json`.

### Back-office routes in the spec
The spec contains paths under `_bo/` (back-office/admin routes) with tags like `Invoice - Backoffice API`. These will be visible in the public reference unless filtered. To suppress them, create a filtered `static/openapi.json` that removes all `_bo` paths before deploying (use `jq` or a small Node script).

### `.mdx` extension required for JSX
Both converted guide files must use `.mdx` extension, not `.md`. Docusaurus only runs the MDX compiler on `.mdx` files — a `.md` file containing JSX (`<Tabs>`, `<TabItem>`) will fail to build.

### Tabs imports
Docusaurus requires explicit imports at the top of each `.mdx` file that uses tabs:
```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

### Build output dir
Docusaurus outputs to `build/`. Netlify must be configured to use `build` as the publish directory.

### Docs-only mode and scaffold index conflict
When `routeBasePath: '/'` is set (docs-only mode), the scaffold-generated `src/pages/index.tsx` must be deleted — it creates a route conflict with the doc at `slug: /` and will fail the build.

---

## Acceptance Criteria

- [ ] `pnpm run start` serves the site locally with guide pages and interactive API reference
- [ ] `/` renders the Introduction page
- [ ] `/authentication` renders the Authentication guide with working admonitions and code tabs
- [ ] `/api` renders the full interactive Scalar API reference with try-it console
- [ ] `X-API-Key` auth field is pre-populated in the Scalar try-it console
- [ ] `pnpm run build` completes with no errors
- [ ] Site deploys to Netlify on push to `main`
- [ ] Old Mintlify files (`docs.json`, `index.mdx`, `authentication.mdx`) are deleted
- [ ] `node_modules/` and `build/` are in `.gitignore`

---

## Implementation Plan

### Phase 1: Scaffold + Install + Configure

**1a. Scaffold Docusaurus in repo root:**
```bash
npx create-docusaurus@latest . classic --typescript
# The scaffold will prompt only about README.md — choose to overwrite.
# All other existing files (openapi.json, index.mdx, etc.) are unaffected.
```

**1b. Remove npm lockfile and install with pnpm:**
```bash
rm package-lock.json
pnpm install
pnpm add @scalar/docusaurus
```

**1c. Delete scaffold files that conflict with docs-only mode:**
```bash
rm src/pages/index.tsx
rm -rf src/pages/markdown-page.md  # optional scaffold demo content
rm -rf docs/tutorial-basics docs/tutorial-extras  # scaffold demo docs
```

---

### Phase 2: Configuration Files

**`docusaurus.config.ts`** — replace scaffolded content:

```typescript
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { ScalarOptions } from '@scalar/docusaurus';

const config: Config = {
  title: 'Appreal API',
  tagline: 'Accept cryptocurrency payments with a single API',
  url: 'https://docs.appreal.com',   // update to real domain
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',          // serve docs from root, not /docs/
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@scalar/docusaurus',
      {
        label: 'API Reference',
        route: '/api',
        showNavLink: true,
        configuration: {
          url: '/openapi.json',        // served from static/openapi.json
        },
      } as ScalarOptions,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Appreal API',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          label: 'API Reference',
          to: '/api',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Appreal`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
```

**`sidebars.ts`** — flat list, no category wrapper needed for 2 pages:

```typescript
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: ['intro', 'authentication'],
};

export default sidebars;
```

---

### Phase 3: Convert Guide Pages

**`docs/intro.mdx`** (converted from `index.mdx`):

```mdx
---
id: intro
title: Appreal Business API
description: Accept cryptocurrency payments with a single API
slug: /
---

The Appreal Business API enables merchants to create invoices, accept crypto payments,
manage balances, and execute payouts across multiple blockchain networks.

- [Authentication](/authentication) — Get your API key and start making requests
- [API Reference](/api) — Full endpoint documentation with live playground
```

> Note: `<CardGroup>` / `<Card>` has no Docusaurus built-in equivalent. The bullet list is an intentional simplification. A custom `src/components/CardGrid.tsx` component can restore the two-column card layout if desired as a follow-on.

**`docs/authentication.mdx`** (converted from `authentication.mdx`):

```mdx
---
id: authentication
title: Authentication
description: How to authenticate requests to the Appreal Business API
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

All Business API requests require your API key in the `x-api-key` header.

:::warning
Your API key grants full access to your account. Never expose it in client-side code,
public repositories, or browser console output.
:::

## Making Authenticated Requests

<Tabs>
  <TabItem value="curl" label="cURL">

```bash
curl https://api.appreal.com/api/business/v1/invoices \
  -H "x-api-key: YOUR_API_KEY"
```

  </TabItem>
  <TabItem value="js" label="Node.js">

```js
const res = await fetch('https://api.appreal.com/api/business/v1/invoices', {
  headers: { 'x-api-key': process.env.API_KEY }
});
```

  </TabItem>
</Tabs>

## Getting Your API Key

1. **Log into the Merchant Dashboard** — Navigate to the Appreal Merchant Dashboard and sign in.
2. **Go to API Keys** — Navigate to **Settings → API Keys**.
3. **Generate a new key** — Click **Generate New Key**. Copy the key immediately — it will only be shown once.

## Security Best Practices

- Store your API key in an environment variable, never hardcode it
- Use separate keys for staging and production
- Rotate keys immediately if you suspect compromise

## Using the Playground

:::note
The interactive playground on each API Reference page sends real requests to your
account. Enter your API key in the authentication field on any endpoint page.
:::

| HTTP Status | Meaning |
|---|---|
| `401` | Missing or invalid API key |
| `403` | Key valid but insufficient permissions |
```

---

### Phase 4: Prepare OpenAPI Spec

**Apply global security** — add to root of `openapi.json`:
```json
"security": [{"X-API-Key": []}]
```

**Filter back-office routes** — the spec contains `_bo/` paths (back-office/admin). To exclude them from the public reference, either:
- Use `jq` to strip them: `jq 'del(.paths | to_entries[] | select(.key | startswith("/_bo")) | .key)' openapi.json > static/openapi.json`
- Or copy as-is if back-office visibility is acceptable: `cp openapi.json static/openapi.json`

The 21 tag groups already in the spec will render as grouped sections in Scalar automatically — no tag work needed.

---

### Phase 5: Netlify Deployment

**`netlify.toml`** (commit to repo root):

```toml
[build]
  command   = "corepack enable pnpm && pnpm install && pnpm run build"
  publish   = "build"

[build.environment]
  NODE_VERSION = "20"
```

> Netlify's build image does not have `pnpm` in `$PATH` by default. The `corepack enable pnpm` prefix enables it. Alternatively, set "Package manager" to `pnpm` in Netlify's Site Settings → Build & Deploy — then the command simplifies to `pnpm run build`.

**Connect to Netlify:**
1. Push to GitHub
2. New site → Import from Git → select repo
3. Build command and publish dir are auto-read from `netlify.toml`
4. ⚠️ Disable **Post Processing → Asset Optimization → Pretty URLs** in Netlify's site settings — this setting mangles Docusaurus's URL enforcement and causes redirect loops.

---

### Phase 6: Cleanup

Delete Mintlify files once `pnpm run build` passes:
```bash
rm docs.json index.mdx authentication.mdx
```

Add `.gitignore`:
```
node_modules/
build/
.docusaurus/
```

---

## Files To Create

| File | Purpose |
|---|---|
| `docusaurus.config.ts` | Site + Scalar plugin config |
| `sidebars.ts` | Guide sidebar structure |
| `docs/intro.mdx` | Converted intro page |
| `docs/authentication.mdx` | Converted auth guide |
| `static/openapi.json` | Filtered spec served to Scalar reference |
| `src/css/custom.css` | Brand color overrides (generated by scaffold) |
| `netlify.toml` | Netlify build config |
| `.gitignore` | Exclude `node_modules/`, `build/`, `.docusaurus/` |

## Files To Delete

| File | Reason |
|---|---|
| `docs.json` | Mintlify config, no longer needed |
| `index.mdx` | Replaced by `docs/intro.mdx` |
| `authentication.mdx` | Replaced by `docs/authentication.mdx` |
| `src/pages/index.tsx` | Conflicts with docs-only `slug: /` route |
| `docs/tutorial-basics/` | Scaffold demo content |
| `docs/tutorial-extras/` | Scaffold demo content |

---

## Follow-on (Out of Scope)

- Custom `<CardGrid>` component to restore two-column card layout on intro page
- `src/css/custom.css` brand color (`--ifm-color-primary: #0D9373`) to match Mintlify theme
- Algolia DocSearch integration for search

---

## References

- `@scalar/docusaurus` npm: https://www.npmjs.com/package/@scalar/docusaurus
- Docusaurus admonitions: https://docusaurus.io/docs/markdown-features/admonitions
- Docusaurus tabs: https://docusaurus.io/docs/markdown-features/tabs
- Docusaurus Netlify deployment: https://docusaurus.io/docs/deployment#deploying-to-netlify
- Docusaurus docs-only mode: https://docusaurus.io/docs/docs-introduction#docs-only-mode
