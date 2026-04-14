---
title: "feat: Enrich documentation guides with Confirmo-style structure"
type: feat
status: active
date: 2026-04-14
---

# Enrich Documentation Guides

## Overview

Expand the Appreal Business API docs from 2 pages (intro + authentication) to a comprehensive 13-page guide covering Invoices, Payouts, Networks, and Currencies. Follow Confirmo's documentation patterns: prerequisites blocks, lifecycle state descriptions, "What's Next" navigation, and supported asset tables.

## Problem Statement / Motivation

The current documentation has only a landing page and authentication guide. Merchants integrating the Business API have no guidance on creating invoices, processing webhooks, sending payouts, or understanding supported networks/currencies. The API Reference exists (auto-generated from OpenAPI spec with Scalar) but lacks conceptual guides that explain flows and lifecycles.

## Proposed Solution

Create 11 new `.mdx` guide pages organized into 4 sidebar sections, plus update 2 existing pages. All content sourced from appreal-backend module docs (invoices) and API code analysis (payouts, networks, currencies).

## Technical Approach

### Architecture

- **Framework**: Docusaurus 3.10 with MDX, classic preset
- **Sidebar config**: `sidebars.ts` — currently `['intro', 'authentication']`, needs category structure
- **Existing components**: `Tabs`, `TabItem` from `@theme/Tabs` (used in authentication.mdx)
- **Admonitions**: `:::note`, `:::warning`, `:::tip` (Docusaurus built-in)
- **Route base**: `/` (docs are at root, not `/docs/`)
- **API Reference**: Separate route at `/api` (auto-generated, not in sidebar)

### Sidebar Structure

Update `sidebars.ts` to use category-based organization:

```typescript
// sidebars.ts
const sidebars: SidebarsConfig = {
  guideSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'authentication', 'webhooks'],
    },
    {
      type: 'category',
      label: 'Checkout',
      items: [
        'checkout/overview',
        'checkout/creating-your-first-invoice',
        'checkout/processing-webhooks',
        'checkout/invoice-lifecycle',
        'checkout/handling-invoice-exceptions',
      ],
    },
    {
      type: 'category',
      label: 'Payouts',
      items: [
        'payouts/overview',
        'payouts/sending-a-payout',
        'payouts/payout-lifecycle',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/supported-networks',
        'reference/supported-currencies',
      ],
    },
  ],
};
```

### Implementation Phases

#### Phase 1: Getting Started (update existing + 1 new page)

**1a. Update `docs/intro.mdx`** — Rewrite as a Confirmo-style welcome page

Source: Current `intro.mdx` (3 lines). Rewrite with:
- Brief product description (what Appreal Business API does)
- Service overview cards linking to each section (Checkout, Payouts, Reference)
- Quick links to Authentication and API Reference
- "What's Next" navigation

**1b. Update `docs/authentication.mdx`** — Minor polish

Source: Current `authentication.mdx` (already solid). Minor updates:
- Add "What's Next" link to Webhooks page at bottom
- Ensure consistency with new style

**1c. Create `docs/webhooks.mdx`** — Notifications/Webhooks guide

Source: `appreal-backend/src/modules/invoice/docs/EVENTS.md`

Content:
- What webhooks are and when they fire (every invoice status change)
- Best practice: always verify via GET endpoint, don't trust payload alone
- Webhook payload JSON example (from EVENTS.md)
- Retry strategy table: 21 attempts, linear backoff (5m, 10m, 15m... 100m), then DLQ
- Security: signature verification, source IP validation
- "What's Next" → Checkout Overview

#### Phase 2: Checkout / Invoices (5 new pages)

**2a. Create `docs/checkout/overview.mdx`** — Checkout Overview

Source: `appreal-backend/src/modules/invoice/docs/README.md`

Content:
- Prerequisites block (numbered list: account setup, API key, webhook understanding)
- What checkout is: create invoice → get payment URL → customer pays → webhook notification
- Supported currencies table (from OpenAPI spec — the currencies available for invoices)
- "What's Next" → Creating Your First Invoice

**2b. Create `docs/checkout/creating-your-first-invoice.mdx`** — First Invoice Guide

Source: `appreal-backend/src/modules/invoice/docs/API.md` (Business API section)

Content:
- Overview of the flow
- cURL example: `POST /api/business/v1/invoices` with `x-api-key` header
- Request body breakdown table:
  - `customerEmail` (string, required)
  - `invoice.amount` (number, required)
  - `invoice.destinationCurrency` (string, required)
  - `redirectUrl` (string, optional)
  - `webhookUrl` (string, optional)
  - `reference` (string, optional)
  - `nonce` (string, optional)
- Response example with `paymentUrl`, `id`, `number`, `status: PREPARED`
- Tabs component with cURL + Node.js examples (matching auth page pattern)
- "What's Next" → Processing Webhooks

**2c. Create `docs/checkout/processing-webhooks.mdx`** — Invoice Webhook Processing

Source: `appreal-backend/src/modules/invoice/docs/EVENTS.md`

Content:
- Overview: webhooks fire on every invoice status change to the `webhookUrl`
- Best practice: call `GET /api/business/v1/invoices/:id` to verify data
- Event types table:
  - `invoice.lifecycle.created`
  - `invoice.lifecycle.expired`
  - `invoice.lifecycle.cancelled`
  - `invoice.payment.processing`
  - `invoice.payment.received`
  - `invoice.status.changed`
- Full webhook payload JSON example
- Retry behavior reference (link back to webhooks page)
- "What's Next" → Invoice Lifecycle

**2d. Create `docs/checkout/invoice-lifecycle.mdx`** — Invoice Lifecycle

Source: `appreal-backend/src/modules/invoice/docs/FLOWS.md`

Content:
- Status list with descriptions (Confirmo pattern):
  - `PREPARED` — Invoice created, customer selects payment method (15-min timeout)
  - `ACTIVE` — Payment method selected, wallet assigned, awaiting payment (configurable timeout)
  - `CONFIRMING` — Payment detected, awaiting blockchain confirmations
  - `COMPLETED` — Payment confirmed, final success state
  - `EXPIRED` — No payment received within time limit
  - `CANCELLED` — Merchant cancelled the invoice
- Payment status sub-states: `UNPAID`, `PROCESSING`, `PAID`, `OVERPAID`, `UNDERPAID`
- State transition description (text-based, matching Confirmo's style)
- Required confirmations by network table (all 3 blocks currently)
- Data purging note: PREPARED→EXPIRED invoices purged after ~1 year
- "What's Next" → Handling Invoice Exceptions

**2e. Create `docs/checkout/handling-invoice-exceptions.mdx`** — Invoice Exceptions

Source: `appreal-backend/src/modules/invoice/docs/FLOWS.md` (error states)

Content:
- What exceptions are: underpayment, overpayment, expiration with partial payment
- Expired invoice recovery: `txHash` recovery via PATCH endpoint for EXPIRED invoices
- Overpayment handling: status becomes OVERPAID, merchant balance credited full amount
- Underpayment handling: within tolerance = PAID, outside = UNDERPAID
- Cancellation: via `POST /invoices/:id/cancel` — only PREPARED or ACTIVE
- "What's Next" → Payouts Overview

#### Phase 3: Payouts (3 new pages)

**3a. Create `docs/payouts/overview.mdx`** — Payouts Overview

Source: Payout business controller + DTOs

Content:
- What payouts are: send funds to recipients (bank accounts or crypto wallets)
- Prerequisites block (account setup, API key, positive balance)
- Payout types table:
  - `CRYPTO_FIAT` — Send crypto, recipient gets fiat (bank transfer)
  - `CRYPTO_CRYPTO` — Wallet to wallet
  - `FIAT_FIAT` — Bank to bank
  - `FIAT_CRYPTO` — Fiat to crypto wallet
- Supported asset combinations (source → destination currency pairs from routing)
- Fee structure: percentage-based + fixed component, country-specific compliance fees
- "What's Next" → Sending a Payout

**3b. Create `docs/payouts/sending-a-payout.mdx`** — Sending a Payout

Source: `payout-business.controller.ts` + DTOs

Content:
- Step 1: Inquire account (verify recipient) — `POST /_b/payout/inquire-account`
  - Request: `bankCode`, `accountNumber`, `destinationCurrencyAlias`, `sourceCurrencyAlias`, `networkSlug`, `payoutProviderName`
  - Response: `accountName`, `accountNumber`, `bankCode`
- Step 2: Get payout info (fees + exchange rate) — `POST /_b/payout/payout-info`
  - Request: `amount`, `destinationCurrencyAlias`, `sourceCurrencyAlias`, `payoutType`, `networkSlug`, `payoutProviderName`
  - Response: fee breakdown, exchange rate, validation requirements
- Step 3: Create payout — `POST /_b/payout`
  - Full request body table with all fields (amount, currency aliases, network, provider, recipient details)
  - Idempotency key header: `X-Idempotency-Key` (UUID)
  - Response: `PayoutBusinessResponseDto` with id, number, status, amounts, currencies
- Step 4: Check status — `GET /_b/payout/:id`
- Tabs with cURL + Node.js examples for each step
- "What's Next" → Payout Lifecycle

**3c. Create `docs/payouts/payout-lifecycle.mdx`** — Payout Lifecycle

Source: Payout service status logic + enums

Content:
- Status list with descriptions:
  - `REQUESTED` — Initial state, awaiting processing
  - `PENDING` — Ready for provider processing
  - `PROCESSING` — Provider is executing the payout
  - `CONFIRMING` — Awaiting blockchain confirmation (crypto payouts)
  - `COMPLETED` — Successfully delivered to recipient
  - `FAILED` — Payout failed (balance refunded)
  - `EXPIRED` — Request expired before processing
- State transition description
- Status history: available via `GET /_b/payout/:id/history`
- History response fields: `previousStatus`, `newStatus`, `source`, `action`, `createdAt`
- "What's Next" → Supported Networks

#### Phase 4: Reference (2 new pages)

**4a. Create `docs/reference/supported-networks.mdx`** — Supported Networks

Source: Network module + Prisma schema + seed data

Content:
- What networks are: blockchain networks Appreal supports
- Networks table:
  | Network | Slug | Chain ID | Type | Block Confirmations |
  - Ethereum (`ethereum`, 1, EVM, 3)
  - Polygon (`polygon`, 137, EVM, 3)
  - Arbitrum One (`arbitrum-one`, 42161, EVM, 3)
  - Base (`base`, 8453, EVM, 3)
  - Solana (`solana`, -, SOLANA, 3)
  - TRON (`tron`, -, TRON, 3)
- Network types: EVM, SOLANA, TRON
- API endpoints: `GET /_b/networks`, `GET /_b/networks/:slug`
- Query filters: `isActive`, `blockchainType`

**4b. Create `docs/reference/supported-currencies.mdx`** — Supported Currencies & Rates

Source: Currency module + currency-rates module + README

Content:
- Currency types: FIAT vs CRYPTO
- Supported cryptocurrencies table (symbol, name, decimals, networks available)
- Supported fiat currencies table (IDR, USD)
- Currency alias system: `usdt_polygon`, `eth_arbitrum` format
- Exchange rates API:
  - `GET /_b/exchange-rates` — All crypto with rates
  - `GET /_b/exchange-rates/:asset` — Rates for specific asset (e.g., BTC, ETH)
- Currency listing API:
  - `GET /_b/currencies` — List supported currencies
  - `GET /_b/currencies/:alias` — Get by alias
- Auto-sync: rates refresh automatically (stale after 1 minute)
- Rate providers: CoinGecko (primary), CoinMarketCap (fallback)

#### Phase 5: Sidebar + Final Polish

- Update `sidebars.ts` with category structure
- Create subdirectories: `docs/checkout/`, `docs/payouts/`, `docs/reference/`
- Verify all "What's Next" links work
- Verify sidebar navigation order matches reading flow
- Test with `pnpm start` to confirm rendering

## File Manifest

### New Files (11)

| # | File | Description |
|---|------|-------------|
| 1 | `docs/webhooks.mdx` | Webhook/notification guide |
| 2 | `docs/checkout/overview.mdx` | Checkout overview with prerequisites |
| 3 | `docs/checkout/creating-your-first-invoice.mdx` | Step-by-step invoice creation |
| 4 | `docs/checkout/processing-webhooks.mdx` | Invoice webhook processing |
| 5 | `docs/checkout/invoice-lifecycle.mdx` | Invoice status states + transitions |
| 6 | `docs/checkout/handling-invoice-exceptions.mdx` | Error states + recovery |
| 7 | `docs/payouts/overview.mdx` | Payouts overview with asset table |
| 8 | `docs/payouts/sending-a-payout.mdx` | 4-step payout creation guide |
| 9 | `docs/payouts/payout-lifecycle.mdx` | Payout status states + transitions |
| 10 | `docs/reference/supported-networks.mdx` | Network listing with chain details |
| 11 | `docs/reference/supported-currencies.mdx` | Currencies + exchange rates |

### Modified Files (3)

| # | File | Change |
|---|------|--------|
| 1 | `sidebars.ts` | Replace flat array with 4-category structure |
| 2 | `docs/intro.mdx` | Rewrite as welcome/landing page with section cards |
| 3 | `docs/authentication.mdx` | Add "What's Next" link to webhooks |

## Content Style Rules

All pages follow these Confirmo-inspired patterns:

1. **Frontmatter**: `id`, `title`, `description` (for SEO)
2. **Overview pages**: Prerequisites block → explanation → supported assets table → "What's Next"
3. **How-to pages**: Overview → step-by-step with code examples (Tabs: cURL + Node.js) → "What's Next"
4. **Lifecycle pages**: Status list with descriptions → transition rules → data purging note → "What's Next"
5. **All pages**: End with `:::info What's Next` admonition linking to the next page in flow
6. **Code examples**: Use `import Tabs from '@theme/Tabs'` + `import TabItem from '@theme/TabItem'` for multi-language snippets
7. **Tables**: Use for structured data (currencies, networks, parameters, statuses)
8. **Admonitions**: `:::warning` for security, `:::note` for callouts, `:::tip` for best practices

## Acceptance Criteria

- [ ] All 11 new pages render correctly in Docusaurus dev server
- [ ] Sidebar shows 4 categories with correct page ordering
- [ ] Every page has working "What's Next" navigation to the next logical page
- [ ] Code examples use correct API base URL (`https://api.appreal.com/api/business/v1`)
- [ ] All API endpoints, request/response shapes match the OpenAPI spec
- [ ] Invoice lifecycle statuses match FLOWS.md (PREPARED, ACTIVE, CONFIRMING, COMPLETED, EXPIRED, CANCELLED)
- [ ] Payout lifecycle statuses match service code (REQUESTED, PENDING, PROCESSING, CONFIRMING, COMPLETED, FAILED, EXPIRED)
- [ ] Network and currency data matches current seed/Prisma schema
- [ ] No broken links between guide pages
- [ ] Tabs component works for cURL/Node.js code examples

## Dependencies & Risks

- **Source data accuracy**: Invoice docs in appreal-backend are well-maintained. Payout data is extracted from code — may need verification against actual API responses.
- **Currency/Network seed data**: The supported networks and currencies tables should match production. Verify against the OpenAPI spec's actual enum values.
- **No new dependencies**: All MDX features (Tabs, admonitions, categories) are already available in the Docusaurus setup.

## Build Sequence

Recommended implementation order to allow incremental testing:

1. `sidebars.ts` + subdirectories (structural foundation)
2. `intro.mdx` update (landing page)
3. `webhooks.mdx` (standalone, no deps)
4. Checkout pages in order (overview → first invoice → webhooks → lifecycle → exceptions)
5. Payout pages in order (overview → sending → lifecycle)
6. Reference pages (networks → currencies)
7. `authentication.mdx` update (just add "What's Next")
8. Full navigation test

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-04-14-docs-guide-enrichment-brainstorm.md`
- Invoice docs: `appreal-backend/src/modules/invoice/docs/` (API.md, FLOWS.md, EVENTS.md, README.md)
- Payout controller: `appreal-backend/src/modules/payout/payout-business.controller.ts`
- Payout DTOs: `appreal-backend/src/modules/payout/dto/`
- Payout service: `appreal-backend/src/modules/payout/payout.service.ts`
- Network controller: `appreal-backend/src/modules/network/controllers/network-business.controller.ts`
- Currency controller: `appreal-backend/src/modules/currency/controllers/currency-business.controller.ts`
- Exchange rate controller: `appreal-backend/src/modules/currency-rates/controllers/exchange-rate-business.controller.ts`
- Prisma schemas: `appreal-backend/prisma/schema/` (payout.prisma, network.prisma, currency.prisma, currency_rate.prisma)
- OpenAPI spec: `business-docs/static/openapi.json`

### External References
- Confirmo docs (style reference): https://docs.confirmo.net/docs/welcome-to-confirmo
- Docusaurus sidebar docs: https://docusaurus.io/docs/sidebar
