---
title: "feat: API Documentation Overhaul"
type: feat
status: completed
date: 2026-04-08
---

# feat: API Documentation Overhaul

## Overview

Overhaul the Appreal Business API documentation site by replacing the Scalar plugin with `docusaurus-plugin-openapi-docs`, adding per-endpoint pages with interactive "Try It" testing, cleaning up the OpenAPI spec, and adding an API version badge.

## Problem Statement / Motivation

The current Scalar-based API reference renders all endpoints on a single page with no way to link to individual endpoints. It includes unwanted UI elements ("Ask AI", "Open API Client") and a standalone schema section. The site doesn't show which API version is documented. Admin/internal schemas leak into the public business API spec.

## Proposed Solution

Replace `@scalar/docusaurus` with `docusaurus-plugin-openapi-docs` + `docusaurus-theme-openapi-docs`. This generates individual MDX pages per endpoint with built-in interactive testing, multi-language code samples, and native Docusaurus sidebar integration.

## Technical Approach

### Architecture

```
Before:
  navbar -> /api (Scalar single-page app, all endpoints)

After:
  navbar -> /api (category index page, lists all groups)
        -> /api/create-invoice (individual endpoint MDX)
        -> /api/list-invoices (individual endpoint MDX)
        -> ...22 endpoint pages total
```

The plugin reads `openapi.json` at build-prep time via CLI (`gen-api-docs`), generates MDX files into `docs/api/`, and produces a sidebar config. Generated files are committed to the repo.

### Implementation Phases

#### Phase 1: OpenAPI Spec Cleanup

Clean up `static/openapi.json` (the source of truth) before generating docs.

**Tasks:**

- [x] Remove 22 admin/internal schemas not referenced by business endpoints:
  - Admin CRUD: `CreateInvoiceAdminDto`, `UpdateInvoiceAdminDto`, `CreateAccountBalanceDto`, `CreateProviderMappingDto`, `UpdateProviderMappingDto`, `CreateCurrencyDto`, `UpdateCurrencyDto`, `CreateNetworkDto`, `UpdateNetworkDto`, `CompletePayoutDto`, `FailPayoutDto`, `CreatePayoutLimitDto`, `UpdatePayoutLimitDto`
  - Internal models: `AccountDto`, `CurrencyDto`, `NetworkDto`, `CurrencyRateResponseDto`, `PriceResponseDto`, `SyncResponseDto`, `ProviderInfoDto`, `ProviderMappingResponseDto`, `CurrencyProviderResponseDto`
- [x] Verify no business endpoint `$ref` chains reference any removed schema (trace all `$ref` paths)
- [x] Populate top-level `tags` array with clean names and descriptions (remove " - Business API" suffix):
  ```json
  "tags": [
    { "name": "Invoice", "description": "Create, manage, and track payment invoices" },
    { "name": "Balances", "description": "View account balances and transaction history" },
    { "name": "Exchange Rates", "description": "Get current cryptocurrency exchange rates" },
    { "name": "Currencies", "description": "List supported currencies and their details" },
    { "name": "Networks", "description": "List supported blockchain networks" },
    { "name": "Payout", "description": "Create and manage payouts" }
  ]
  ```
- [x] Update operation-level tags to match (strip " - Business API" suffix from each endpoint's `tags` array)
- [x] Remove `localhost:8000` server from the servers array (not appropriate for public docs)
- [x] Clean up `accountId` field descriptions in `CreatePayoutDto` and `PayoutInfoDto` to remove "required for admins" language
- [x] Delete root `/openapi.json` (duplicate) — `static/openapi.json` is the single source of truth
- [x] Ensure the top-level `security` block (`X-API-Key`) is present

**Files:**
- `static/openapi.json` — edit
- `openapi.json` (root) — delete

#### Phase 2: Plugin Swap

Replace Scalar with docusaurus-openapi-docs.

**Tasks:**

- [x] Uninstall Scalar: `npm uninstall @scalar/docusaurus`
- [x] Install new packages: `npm install docusaurus-plugin-openapi-docs docusaurus-theme-openapi-docs`
- [x] Update `docusaurus.config.ts`:
  - Remove Scalar plugin block (lines 33-45) and `ScalarOptions` import
  - Add `docItemComponent: "@theme/ApiItem"` to docs preset config
  - Add `docusaurus-plugin-openapi-docs` plugin config:
    ```typescript
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'api',
        docsPluginId: 'classic',
        config: {
          appreal: {
            specPath: 'static/openapi.json',
            outputDir: 'docs/api',
            sidebarOptions: {
              groupPathsBy: 'tag',
              categoryLinkSource: 'tag',
            },
            showSchemas: false,
            downloadUrl: '/openapi.json',
          },
        },
      },
    ]
    ```
  - Add `themes: ['docusaurus-theme-openapi-docs']`
  - Add `languageTabs` to `themeConfig` (curl, python, nodejs, go, php)
  - Add `api: { authPersistance: 'localStorage' }` to `themeConfig`
- [x] Verify `docItemComponent: "@theme/ApiItem"` works with non-API docs (`intro.mdx`, `authentication.mdx`) — if it breaks guide pages, use a separate docs plugin instance for API

**Files:**
- `docusaurus.config.ts` — edit
- `package.json` — modified by npm install/uninstall

#### Phase 3: Generate API Docs & Configure Sidebar

**Tasks:**

- [x] Run `npx docusaurus gen-api-docs all` to generate MDX files in `docs/api/`
- [x] Verify generated files: one MDX per endpoint (~22 files) + `sidebar.ts`
- [x] Create `docs/api/index.mdx` (using generated info page instead) — API Reference landing/category page listing all endpoint groups with brief descriptions. This is what `/api` resolves to.
- [x] Update `sidebars.ts` to import generated sidebar:
  ```typescript
  import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
  import apiSidebar from './docs/api/sidebar';

  const sidebars: SidebarsConfig = {
    guideSidebar: ['intro', 'authentication'],
    apiSidebar: apiSidebar,
  };

  export default sidebars;
  ```
- [x] Update navbar "API Reference" item to use `type: 'docSidebar', sidebarId: 'apiSidebar'` instead of `to: '/api'`

**Files:**
- `docs/api/` — generated (new directory)
- `docs/api/index.mdx` — new file
- `sidebars.ts` — edit
- `docusaurus.config.ts` — edit (navbar item)

#### Phase 4: API Version Badge

**Tasks:**

- [x] Add a `type: 'html'` navbar item for the version badge:
  ```typescript
  {
    type: 'html',
    position: 'right',
    value: '<span class="api-version-badge">v1.0</span>',
  }
  ```
- [x] Add CSS for `.api-version-badge` in `src/css/custom.css`:
  ```css
  .api-version-badge {
    background: var(--ifm-color-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  ```

**Files:**
- `docusaurus.config.ts` — edit (navbar items)
- `src/css/custom.css` — edit

#### Phase 5: Dead Code Cleanup

**Tasks:**

- [x] Delete `src/components/HomepageFeatures/index.tsx`
- [x] Delete `src/components/HomepageFeatures/styles.module.css`
- [x] Delete `static/img/undraw_docusaurus_mountain.svg`
- [x] Delete `static/img/undraw_docusaurus_react.svg`
- [x] Delete `static/img/undraw_docusaurus_tree.svg`
- [x] Verify no imports reference `HomepageFeatures` anywhere

**Files:**
- 5 files deleted (listed above)

#### Phase 6: Verification

**Tasks:**

- [x] Run `npm run build` — verify no broken links (site has `onBrokenLinks: 'throw'`)
- [ ] Run `npm start` and verify:
  - `/` — intro page loads correctly
  - `/authentication` — guide page loads correctly
  - `/api` — category landing page with endpoint groups
  - Individual endpoint pages load with "Try It" panel
  - Sidebar shows Guides and API Reference sections
  - Version badge visible in navbar
  - No "Ask AI" or "Open API Client" buttons
  - No standalone schema/models section
  - Code samples show in multiple languages
- [ ] Test "Try It" with the production server URL
- [ ] Verify `intro.mdx` links to API Reference still work

## Acceptance Criteria

- [ ] Each API endpoint has its own page with interactive "Try It" panel
- [ ] No "Ask AI" button anywhere
- [ ] No "Open API Client" button anywhere
- [ ] No standalone schema/models section — schemas shown inline only
- [ ] "v1.0" version badge visible in navbar
- [ ] No admin/internal schemas in the OpenAPI spec
- [ ] All existing guide pages (`/`, `/authentication`) still work
- [ ] Navbar "API Reference" links to the API docs section
- [ ] Sidebar shows endpoint groups organized by tag
- [ ] Multi-language code samples (curl, python, nodejs, go, php)
- [ ] Build passes with no broken links

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| `@theme/ApiItem` as `docItemComponent` may break non-API pages | Test immediately; if broken, use separate docs plugin instance for API |
| Generated MDX must be re-generated when spec changes | Add `gen-api-docs` to a build script or document the workflow |
| Existing external links to `/api` or `/api#anchors` will break | The `/api` index page catches top-level links; anchor-based links are unavoidable breakage |
| CORS issues with "Try It" panel hitting production API | May need a proxy config; test and add if needed |

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-04-08-api-docs-overhaul-brainstorm.md`
- Current config: `docusaurus.config.ts`
- OpenAPI spec: `static/openapi.json` (3199 lines, 22 endpoints, 6 tag groups)
- Sidebar: `sidebars.ts`

### External References
- Plugin docs: https://docusaurus-openapi.tryingpan.dev/
- Plugin GitHub: https://github.com/PaloAltoNetworks/docusaurus-openapi-docs
- npm: `docusaurus-plugin-openapi-docs` + `docusaurus-theme-openapi-docs` (v4.7.x)
- Confirmo reference (design inspiration): https://docs.confirmo.net/reference/getassets-1
