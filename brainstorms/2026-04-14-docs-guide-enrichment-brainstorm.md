# Brainstorm: Docs Guide Enrichment

**Date:** 2026-04-14
**Status:** Ready for planning

## What We're Building

Enriching the Appreal Business API documentation from its current minimal state (2 pages: intro + authentication) into a comprehensive, merchant-facing guide modeled after Confirmo's documentation style. The guides will cover Invoices, Payouts, and reference material for Networks & Currencies.

## Why This Approach

- **Confirmo-style structure** is proven for crypto payment platforms — prerequisites blocks, lifecycle state descriptions, "What's Next" navigation, and supported asset tables.
- **Guide pages only in business-docs** — no new internal module docs in appreal-backend. Invoice docs already exist there as source material; payout guide pages will be created directly from API code analysis.
- **Scope is tied to actual APIs** — only documenting what the Business API exposes, not Confirmo features we don't have (POS, Dashboard, Crypto Top-ups, etc.).

## Key Decisions

1. **Structure follows Confirmo's pattern** but only includes sections relevant to Appreal's APIs
2. **Payout docs created as guide pages only** (not internal backend module docs)
3. **Confirmo content style adopted**: prerequisites, What's Next links, lifecycle state lists, asset/network tables
4. **Branding**: Use "Appreal" throughout
5. **Network & Currency pages** created from existing backend modules + Confirmo reference patterns

## Guide Structure

### Getting Started
| Page | Description | Source |
|------|-------------|--------|
| Welcome to Appreal | Landing page with service overview cards | Rewrite existing `intro.mdx` |
| Authentication | API key setup and JWT/API key auth | Existing `authentication.mdx` (update if needed) |
| Notifications / Webhooks | How webhooks work, best practices, payload format | Invoice EVENTS.md + Confirmo webhook pattern |

### Checkout (Invoices)
| Page | Description | Source |
|------|-------------|--------|
| Checkout Overview | What checkout is, prerequisites, supported currencies | Invoice README.md + Confirmo pattern |
| Creating Your First Invoice | Step-by-step with API examples (Business API) | Invoice API.md (Business endpoints) |
| Processing Webhooks | Webhook flow for invoices, payload example, verification | Invoice EVENTS.md |
| Invoice Lifecycle | Status states + transitions diagram description | Invoice FLOWS.md |
| Handling Invoice Exceptions | Error states, expiration, recovery | Invoice FLOWS.md (error/exception states) |

### Payouts
| Page | Description | Source |
|------|-------------|--------|
| Payouts Overview | What payouts are, supported assets, prerequisites | Payout module code + Confirmo pattern |
| Sending a Payout | API-driven guide with request/response examples | Payout Business API controller/DTOs |
| Payout Lifecycle | Status states + transitions | Payout service status logic |

### Reference
| Page | Description | Source |
|------|-------------|--------|
| Supported Networks | All blockchain networks with chain details | Network module |
| Supported Currencies & Rates | Currency list, exchange rate API | Currency + currency-rates modules |

## Content Style Guidelines (Confirmo Pattern)

- **Overview pages**: Start with prerequisites block, include supported asset/network tables, end with "What's Next" link
- **How-to pages**: Step-by-step with cURL/API examples, request body parameter breakdowns
- **Lifecycle pages**: Enumerated status list with descriptions, state transition description, data purging notes where applicable
- **All pages**: End with navigation to next logical page in the flow

## Source Material Map

| Source | Location | Used For |
|--------|----------|----------|
| Invoice API.md | `appreal-backend/src/modules/invoice/docs/API.md` | Invoice guide pages |
| Invoice FLOWS.md | `appreal-backend/src/modules/invoice/docs/FLOWS.md` | Invoice lifecycle + exceptions |
| Invoice EVENTS.md | `appreal-backend/src/modules/invoice/docs/EVENTS.md` | Webhooks/notifications |
| Invoice README.md | `appreal-backend/src/modules/invoice/docs/README.md` | Checkout overview |
| Payout controllers | `appreal-backend/src/modules/payout/controllers/` | Payout guide pages |
| Payout DTOs | `appreal-backend/src/modules/payout/dtos/` | Payout request/response examples |
| Payout service | `appreal-backend/src/modules/payout/payout.service.ts` | Payout lifecycle states |
| Network module | `appreal-backend/src/modules/network/` | Supported networks |
| Currency module | `appreal-backend/src/modules/currency/` | Supported currencies |
| Currency-rates module | `appreal-backend/src/modules/currency-rates/` | Exchange rates reference |

## Open Questions

None — all key decisions resolved.

## Total New Pages

- **11 new guide pages** (plus updates to 2 existing pages)
- Organized into 4 sections in the sidebar
