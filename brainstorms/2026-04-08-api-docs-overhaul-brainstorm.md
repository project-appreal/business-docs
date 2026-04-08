# API Documentation Overhaul

**Date:** 2026-04-08
**Status:** Completed

## What We're Building

A set of changes to the Appreal Business API documentation site to clean up unnecessary UI elements, remove leaked internal schemas, and show the API version.

### Changes

1. **Remove "Open API Client" button** — Set `hideClientButton: true` in Scalar config.

2. **Hide schemas from API reference** — Set `hideModels: true` to remove the standalone models section at the bottom of the API reference.

3. **Add API version badge to navbar** — Display "v1.0" as a visible badge in the top navigation bar.

4. **Clean up OpenAPI spec** — Remove 22 admin/internal schemas that don't belong in the public business API docs (e.g., `CreateInvoiceAdminDto`, `AccountDto`, `ProviderInfoDto`). Clean up tag names (strip " - Business API" suffix). Remove localhost server. Clean up admin-related field descriptions.

5. **Dead code cleanup** — Remove unused HomepageFeatures component and undraw SVGs.

### Not included

- **UI template overhaul** — We explored switching from `@scalar/docusaurus` to `docusaurus-openapi-docs` for per-endpoint pages, but Scalar's built-in "Test Request" Postman-like UI is superior and `@scalar/api-client-modal` doesn't integrate cleanly with Docusaurus's Webpack/Vue setup. We keep Scalar as the sole API reference plugin.

## Why This Approach

- Scalar already provides a good API reference experience with built-in interactive testing ("Test Request").
- The `hideClientButton` and `hideModels` config options address the unwanted UI elements cleanly.
- Spec cleanup and version badge are independent of the UI framework.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| API docs plugin | Keep `@scalar/docusaurus` | Built-in "Test Request" UI is the best option; `docusaurus-openapi-docs` and `@scalar/api-client-modal` both had integration issues |
| Schema display | Hidden via `hideModels: true` | Removes standalone models section |
| "Open API Client" | Hidden via `hideClientButton: true` | Not needed for public docs |
| Version indicator | Navbar badge | Always visible, minimal effort |
| Admin schemas | Removed from spec | Don't belong in public business API docs |
