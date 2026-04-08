# Code Review: PR #2 — feat: Replace Scalar with per-endpoint API reference pages

**Branch:** feat/api-docs-overhaul
**Date:** 2026-04-08
**Reviewers:** Security Sentinel, TypeScript Reviewer, Code Simplicity Reviewer, Architecture Strategist

## Summary

- **Total Findings:** 13
- **P1 Critical:** 2 — Blocks merge
- **P2 Important:** 6 — Should fix
- **P3 Nice-to-Have:** 5 — Enhancements

---

## P1 — Critical (Blocks Merge)

### 001: Replace innerHTML with DOM API calls (XSS vector)

- **Tags:** security
- **File:** `src/components/ApiEndpointPage.tsx`, line 297

**Problem:** `innerHTML` is used to inject the copyable API path. The `fullUrl` includes `saved.serverUrl` from localStorage, which can be poisoned by any same-origin XSS. An attacker could write `<img src=x onerror="alert(document.cookie)">` to localStorage and get script execution.

**Findings:**
- Security Sentinel: MEDIUM severity — innerHTML with partially user-controlled data from localStorage
- TypeScript Reviewer: HIGH confidence — raw innerHTML is an XSS vector; the unused `CopyableApiPath` React component already does this safely with JSX

**Recommended Fix:** Use `document.createElement` + `textContent` instead of innerHTML.

```typescript
const methodSpan = document.createElement('span');
methodSpan.className = 'api-path-line__method';
methodSpan.style.background = METHOD_COLORS[endpoint.method] || '#999';
methodSpan.textContent = endpoint.method;

const urlCode = document.createElement('code');
urlCode.className = 'api-path-line__url';
urlCode.textContent = fullUrl;

pathEl.appendChild(methodSpan);
pathEl.appendChild(urlCode);
```

**Effort:** Small (15 min)

---

### 002: Fix memory leak in ApiEndpointPage useEffect

- **Tags:** quality
- **File:** `src/components/ApiEndpointPage.tsx`, lines 231-321

**Problem:** The main `useEffect` starts an async fetch chain and recursive `setTimeout` polls (`tryInit`, `injectPath`) that are never cancelled on cleanup. On navigation, stale callbacks write to unmounted DOM refs. `tryInit` polls forever if `window.Scalar` never loads.

**Findings:**
- TypeScript Reviewer: HIGH confidence — uncancelled fetch, infinite retry loops, stale DOM ref access

**Recommended Fix:** Add `AbortController` for fetch, a `cancelled` flag checked by each setTimeout callback, and a max retry count.

```typescript
useEffect(() => {
  const el = scalarRef.current;
  if (!el) return;
  let cancelled = false;
  const controller = new AbortController();

  fetch(`/api-specs/${endpoint.filename}`, { signal: controller.signal })
    .then(res => res.json())
    .then(spec => {
      if (cancelled) return;
      const tryInit = (retries = 0) => {
        if (cancelled || retries > 50) return;
        // ...
      };
      tryInit();
    });

  const cleanupWatcher = watchModalChanges();
  return () => {
    cancelled = true;
    controller.abort();
    cleanupWatcher();
  };
}, [endpoint.filename, location.pathname]);
```

**Effort:** Small (20 min)

---

## P2 — Important (Should Fix)

### 003: Add SRI hash to Scalar CDN script

- **Tags:** security
- **File:** `plugins/api-endpoint-pages.js`, lines 15-18

**Problem:** The Scalar CDN script is loaded without Subresource Integrity (SRI). If jsdelivr or the npm package is compromised, a malicious script gains full access to the page including localStorage API keys.

**Recommended Fix:** Generate SHA-384 hash and add `integrity` + `crossorigin="anonymous"` attributes to the script tag.

**Effort:** Small (5 min)

---

### 004: Chain gen-api-specs into build script and gitignore generated specs

- **Tags:** architecture
- **Files:** `package.json`, `.gitignore`

**Problem:** The 22 generated JSON files in `static/api-specs/` are committed to the repo. If someone edits `openapi.json` and forgets to run `pnpm gen-api-specs`, the generated files will be stale with no error.

**Recommended Fix:** Change `"build"` to `"node scripts/gen-api-specs.mjs && docusaurus build"` and add `static/api-specs/` to `.gitignore`.

**Effort:** Small (5 min)

---

### 005: Remove dead code

- **Tags:** quality
- **Files:** `src/components/ApiEndpointPage.tsx`, `src/css/custom.css`

**Problem:** 38 lines of dead code:

| Location | What | Lines |
|---|---|---|
| `ApiEndpointPage.tsx` lines 29-35 | `METHOD_BG` constant (never referenced) | 7 |
| `ApiEndpointPage.tsx` lines 120-142 | `CopyableApiPath` component (unused, replaced by DOM injection) | 23 |
| `custom.css` lines 371-378 | `.api-version-badge` class (unused in components) | 8 |

**Effort:** Small (5 min)

---

### 006: Extract shared code to eliminate triple duplication

- **Tags:** quality
- **Files:** `ApiEndpointPage.tsx`, `ApiIndexPage.tsx`, `ApiConfig.tsx`

**Problem:** `Endpoint` interface, `METHOD_COLORS`, and localStorage helpers (`STORAGE_KEY`, load/save) are duplicated across 2-3 files (~32 lines of duplication).

**Recommended Fix:** Create `src/lib/api-shared.ts` with all shared items. Import from each component.

**Effort:** Small (15 min)

---

### 007: Add error handling to spec fetch

- **Tags:** quality
- **File:** `src/components/ApiEndpointPage.tsx`, line 239

**Problem:** `fetch(...).then(res => res.json())` with no `res.ok` check and no `.catch()`. A 404 or network error silently shows a blank page.

**Recommended Fix:**
```typescript
fetch(`/api-specs/${endpoint.filename}`)
  .then(res => {
    if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`);
    return res.json();
  })
  .catch(err => console.error('Failed to load API spec:', err));
```

**Effort:** Small (5 min)

---

### 008: Narrow MutationObserver scope to Scalar container

- **Tags:** security, performance
- **File:** `src/components/ApiEndpointPage.tsx`, lines 99-117

**Problem:** `watchModalChanges()` attaches a MutationObserver on `document.body` with `subtree: true`, firing `syncFromDom()` on every DOM mutation across the entire page. The `setTimeout(syncFromDom, 200)` in the click handler can also fire after cleanup.

**Recommended Fix:**
- Scope MutationObserver to `scalarRef.current` instead of `document.body`
- Store timeout IDs and clear on cleanup
- Add comment documenting Scalar v1.28 DOM dependency

**Effort:** Small (10 min)

---

## P3 — Nice-to-Have (Enhancements)

### 009: Add CSP and security headers to netlify.toml

- **Tags:** security
- **File:** `netlify.toml`

**Problem:** No Content-Security-Policy, X-Frame-Options, or other security headers configured. Any XSS has no restrictions.

**Recommended Fix:** Add `[[headers]]` section with CSP (allowing jsdelivr CDN and API servers), X-Frame-Options DENY, HSTS.

**Effort:** Small (10 min)

---

### 010: Load Scalar CDN only on API pages, not globally

- **Tags:** performance
- **File:** `plugins/api-endpoint-pages.js`

**Problem:** The Scalar script (~200KB+) loads on every page including guides that don't use it.

**Recommended Fix:** Move CDN loading from the plugin's `injectHtmlTags` to a dynamic script tag in `ApiEndpointPage.tsx` on mount.

**Effort:** Small (15 min)

---

### 011: Declare window.Scalar type instead of (window as any)

- **Tags:** quality
- **File:** `src/components/ApiEndpointPage.tsx`

**Problem:** `(window as any).Scalar` suppresses all type checking. If Scalar changes its API, TypeScript won't catch it.

**Recommended Fix:** Add `declare global { interface Window { Scalar?: { createApiReference(...): void } } }`.

**Effort:** Small (5 min)

---

### 012: Centralize server URL list (currently in 3 places)

- **Tags:** architecture
- **Files:** `ApiConfig.tsx`, `ApiEndpointPage.tsx`, `static/openapi.json`

**Problem:** Server URLs hardcoded in `ApiConfig.tsx` SERVERS array, the OpenAPI spec `servers` field, and a fallback in `ApiEndpointPage.tsx` line 291. Three sources of truth.

**Recommended Fix:** Derive server list from OpenAPI spec at build time and include in the manifest, or extract to a shared constant.

**Effort:** Small (10 min)

---

### 013: Strengthen API key warning to recommend test keys only

- **Tags:** security
- **File:** `src/components/ApiConfig.tsx`

**Problem:** The API playground stores API keys in localStorage. For a crypto payment API, stolen keys could allow unauthorized payouts. The current hint text should explicitly warn users to use test/development keys only.

**Recommended Fix:** Update hint to: "Use a **test or development API key** only. Never enter your production key in a browser-based playground."

**Effort:** Small (2 min)
