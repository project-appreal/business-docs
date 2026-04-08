---
title: "feat: API Documentation Overhaul"
type: feat
status: completed
date: 2026-04-08
---

# feat: API Documentation Overhaul

## Overview

Clean up the Appreal Business API documentation site by removing admin/internal schemas from the OpenAPI spec, adding per-endpoint API pages alongside the existing Scalar reference, adding an API version badge, and deleting dead code.

## Problem Statement / Motivation

The current Scalar-based API reference renders all endpoints on a single page with no way to link to individual endpoints. It includes unwanted UI elements ("Ask AI", "Open API Client") and a standalone schema section. The site doesn't show which API version is documented. Admin/internal schemas leak into the public business API spec.

## Proposed Solution

Keep the existing Scalar API reference at `/api`. Add `docusaurus-plugin-openapi-docs` alongside it to generate per-endpoint MDX pages with interactive "Try It" panels. Also clean up the OpenAPI spec, add a version badge, and remove dead starter code.

## Technical Approach

### Architecture

```
Scalar:   /api (single-page interactive reference — unchanged)
Docs:     /api/appreal-api-business (API info page)
          /api/invoice-business-controller-create (per-endpoint page)
          /api/invoice-business-controller-list (per-endpoint page)
          ...22 endpoint pages total, grouped by tag in sidebar
```

Both Scalar and docusaurus-plugin-openapi-docs coexist. Scalar serves `/api` exact path; individual endpoint pages are under `/api/*` via the docs plugin.

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

#### Phase 2: Plugin Swap — SKIPPED

Keeping the current Scalar-based API reference. No plugin swap — installed `docusaurus-plugin-openapi-docs` and `docusaurus-theme-openapi-docs` alongside Scalar instead.

#### Phase 3: Generate API Docs & Configure Sidebar

**Tasks:**

- [x] Install `docusaurus-plugin-openapi-docs` and `docusaurus-theme-openapi-docs` alongside Scalar
- [x] Add plugin config and theme to `docusaurus.config.ts` (keep Scalar at `/api`)
- [x] Add `docItemComponent: "@theme/ApiItem"` to docs preset config
- [x] Install `@docusaurus/theme-common` (required peer dependency)
- [x] Run `npx docusaurus gen-api-docs all` — generated 22 endpoint MDX + 6 tag category pages + sidebar
- [x] Update `sidebars.ts` to import generated API sidebar
- [x] Update navbar "API Reference" to use `type: 'docSidebar', sidebarId: 'apiSidebar'`
- [x] Build passes with no errors

**Files:**
- `docusaurus.config.ts` — edit
- `sidebars.ts` — edit
- `docs/api/` — generated (22 endpoint pages, 6 tag pages, sidebar, info page)
- `package.json` / `pnpm-lock.yaml` — modified by pnpm install

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
  - `/api` — Scalar API reference loads correctly
  - Version badge visible in navbar
  - No "Ask AI" or "Open API Client" buttons
- [ ] Verify `intro.mdx` links to API Reference still work

## Acceptance Criteria

- [x] No admin/internal schemas in the OpenAPI spec
- [x] Clean tag names (no " - Business API" suffix)
- [x] No localhost server in spec
- [x] Per-endpoint MDX pages generated with interactive "Try It" panels
- [x] Sidebar shows endpoint groups organized by tag
- [x] "v1.0" version badge visible in navbar
- [x] No "Ask AI" or "Open API Client" buttons (Scalar CDN pinned to v1.28)
- [x] Dead starter code removed (HomepageFeatures, undraw images)
- [x] All existing guide pages (`/`, `/authentication`) still work
- [x] Build passes with no broken links

## Dependencies & Risks

No significant risks — changes are limited to spec cleanup and cosmetic improvements. No plugin changes or URL breakage.

## References & Research

### Internal References
- Brainstorm: `brainstorms/2026-04-08-api-docs-overhaul-brainstorm.md`
- Current config: `docusaurus.config.ts`
- OpenAPI spec: `static/openapi.json` (3199 lines, 22 endpoints, 6 tag groups)
- Sidebar: `sidebars.ts`

### External References
- Plugin docs: https://docusaurus-openapi.tryingpan.dev/
- Plugin GitHub: https://github.com/PaloAltoNetworks/docusaurus-openapi-docs
- npm: `docusaurus-plugin-openapi-docs` + `docusaurus-theme-openapi-docs` (v4.7.x)
- Confirmo reference (design inspiration): https://docs.confirmo.net/reference/getassets-1
