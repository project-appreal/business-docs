# Mintlify → Docusaurus + Scalar Migration Brainstorm

**Date:** 2026-04-07

---

## What We're Building

Migrate the Appreal Business API public docs from Mintlify (cloud-hosted, account-required) to a fully self-hosted Docusaurus site with the `@scalar/docusaurus` plugin for an interactive API reference. No Scalar account required. Deployed to Vercel or Netlify.

---

## Why This Approach

- **Self-hosted, no lock-in** — no Mintlify or Scalar accounts; the output is a static site owned entirely by the team
- **Official plugin** — `@scalar/docusaurus` is maintained by Scalar, gives full interactive try-it console with zero configuration
- **Docusaurus for guides** — battle-tested for markdown docs with built-in sidebar, search, dark mode, and Vercel/Netlify one-click deploys
- **Minimal migration effort** — 2 guide pages, 1 OpenAPI spec; no complex restructuring needed

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | Docusaurus (classic TypeScript template) | Best Mintlify analog; handles guides + API reference natively |
| API reference | `@scalar/docusaurus` plugin | Official, zero-config, full interactive console |
| Deployment | Vercel or Netlify | Auto-deploys on push, preview deploys per PR |
| Content format | Docusaurus MDX components | Preserve rich formatting: `:::warning`, `<Tabs>`, numbered steps |
| OpenAPI spec | Keep `openapi.json` as-is | No changes needed; placed in `/static/` |

---

## Scope

**Files to create:**
- `docusaurus.config.ts` — site config + Scalar plugin registration
- `docs/intro.md` — converted from `index.mdx`
- `docs/authentication.md` — converted from `authentication.mdx`
- `sidebars.ts` — sidebar structure
- `static/openapi.json` — copy of existing spec

**Files to delete (post-migration):**
- `docs.json`
- `index.mdx`
- `authentication.mdx`

**Component conversions:**

| Mintlify | Docusaurus |
|---|---|
| `<Warning>` | `:::warning` admonition |
| `<Note>` | `:::note` admonition |
| `<CodeGroup>` | `<Tabs>` + `<TabItem>` |
| `<Steps>` / `<Step>` | Numbered markdown list |
| `<Card>` / `<CardGroup>` | Plain markdown links |

---

## Resolved Questions

- **Deployment target:** Vercel or Netlify (auto-deploy on push, PR previews)
- **Content style:** Convert to Docusaurus equivalents, not plain markdown

---

## Open Questions

_None — scope is fully defined._
