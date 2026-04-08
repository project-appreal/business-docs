// Shared types, constants, and helpers for API reference pages.

export interface Endpoint {
  slug: string;
  tag: string;
  summary: string;
  method: string;
  path: string;
  filename: string;
}

export const METHOD_COLORS: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
};

export const SERVERS = [
  { url: 'https://api.appreal.com/api/business/v1', label: 'Production' },
  { url: 'https://dev.appreal.xyz/api/business/v1', label: 'Development' },
];

export const DEFAULT_SERVER_URL = SERVERS[0].url;

export const STORAGE_KEY = 'appreal-api-config';

export function loadSavedConfig(): { serverUrl?: string; apiKey?: string } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveConfig(update: { serverUrl?: string; apiKey?: string }) {
  try {
    const current = loadSavedConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...update }));
  } catch {
    // localStorage unavailable
  }
}

// Scalar CDN (pinned version) — loaded dynamically on API pages only
export const SCALAR_CDN_URL = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.28';
export const SCALAR_CDN_SRI = 'sha384-2LRSF4c3I5vmmatsF2T7v5mHtCZ8/8oDRLDacPGNMTaWnbI8GuEaJC+bww9lDIM/';

// Type declaration for the Scalar global loaded from CDN
declare global {
  interface Window {
    Scalar?: {
      createApiReference(el: HTMLElement, options: Record<string, unknown>): void;
    };
  }
}

// Copy-icon SVG used in the copyable API path badge
export const COPY_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
