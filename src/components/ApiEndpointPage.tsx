import React, { useEffect, useRef, useState } from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';

interface Endpoint {
  slug: string;
  tag: string;
  summary: string;
  method: string;
  path: string;
  filename: string;
}

interface Props {
  endpoint: Endpoint;
  manifest: Endpoint[];
}

const STORAGE_KEY = 'appreal-api-config';

const METHOD_COLORS: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
};

const METHOD_BG: Record<string, string> = {
  GET: 'rgba(97, 175, 254, 0.15)',
  POST: 'rgba(73, 204, 144, 0.15)',
  PUT: 'rgba(252, 161, 48, 0.15)',
  PATCH: 'rgba(80, 227, 194, 0.15)',
  DELETE: 'rgba(249, 62, 62, 0.15)',
};

function loadSavedConfig(): { serverUrl?: string; apiKey?: string } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveConfig(update: { serverUrl?: string; apiKey?: string }) {
  try {
    const current = loadSavedConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...update }));
  } catch {
    // localStorage unavailable
  }
}

function watchModalChanges() {
  let lastKey = '';
  let lastServer = '';

  function syncFromDom() {
    const serverButtons = document.querySelectorAll<HTMLButtonElement>(
      '[id^="headlessui-popover-button"]'
    );
    for (const btn of serverButtons) {
      const srOnly = btn.querySelector('.sr-only');
      if (srOnly?.textContent?.includes('Server')) {
        const url = btn.textContent?.replace('Server:', '').trim() || '';
        if (url && url.startsWith('http') && url !== lastServer) {
          lastServer = url;
          saveConfig({ serverUrl: url });
        }
        break;
      }
    }

    const authInputs = document.querySelectorAll<HTMLInputElement>(
      '.request-section-content-auth input, [class*="auth"] input'
    );
    for (const input of authInputs) {
      if (input.value && input.value !== lastKey) {
        lastKey = input.value;
        saveConfig({ apiKey: input.value });
      }
    }
  }

  const inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement)) return;
    const isAuth = target.closest('.request-section-content-auth');
    if (isAuth && target.value !== lastKey) {
      lastKey = target.value;
      saveConfig({ apiKey: target.value });
    }
  };

  const clickHandler = () => {
    setTimeout(syncFromDom, 200);
  };

  const observer = new MutationObserver(() => {
    syncFromDom();
  });

  document.addEventListener('input', inputHandler, true);
  document.addEventListener('change', inputHandler, true);
  document.addEventListener('click', clickHandler, true);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  return () => {
    document.removeEventListener('input', inputHandler, true);
    document.removeEventListener('change', inputHandler, true);
    document.removeEventListener('click', clickHandler, true);
    observer.disconnect();
  };
}

function CopyableApiPath({ method, path }: { method: string; path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="api-path-line" onClick={handleCopy} title="Click to copy">
      <span
        className="api-path-line__method"
        style={{ background: METHOD_COLORS[method] || '#999' }}
      >
        {method}
      </span>
      <code className="api-path-line__url">{path}</code>
      {copied && <span className="api-path-line__copied">Copied!</span>}
    </div>
  );
}

function ApiSidebar({ manifest, currentSlug }: { manifest: Endpoint[]; currentSlug: string }) {
  const byTag = new Map<string, Endpoint[]>();
  for (const ep of manifest) {
    if (!byTag.has(ep.tag)) byTag.set(ep.tag, []);
    byTag.get(ep.tag)!.push(ep);
  }

  // Find which tag the current endpoint belongs to
  const currentTag = manifest.find((ep) => ep.slug === currentSlug)?.tag;

  return (
    <nav className="api-sidebar">
      <div className="api-sidebar__header">
        <a href="/api" className="api-sidebar__all-link">API Reference</a>
      </div>
      {[...byTag.entries()].map(([tag, endpoints]) => (
        <SidebarGroup
          key={tag}
          tag={tag}
          endpoints={endpoints}
          currentSlug={currentSlug}
          defaultOpen={tag === currentTag}
        />
      ))}
    </nav>
  );
}

function SidebarGroup({
  tag,
  endpoints,
  currentSlug,
  defaultOpen,
}: {
  tag: string;
  endpoints: Endpoint[];
  currentSlug: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`api-sidebar__group ${open ? 'api-sidebar__group--open' : ''}`}>
      <button
        className="api-sidebar__tag"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <svg
          className="api-sidebar__chevron"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
        >
          <path d="M3 2l4 3-4 3z" />
        </svg>
        {tag}
        <span className="api-sidebar__count">{endpoints.length}</span>
      </button>
      {open && (
        <div className="api-sidebar__items">
          {endpoints.map((ep) => (
            <a
              key={ep.slug}
              href={`/api/${ep.slug}`}
              className={`api-sidebar__item ${ep.slug === currentSlug ? 'api-sidebar__item--active' : ''}`}
            >
              <span className="api-sidebar__summary">{ep.summary}</span>
              <span
                className="api-sidebar__method-badge"
                style={{ background: METHOD_COLORS[ep.method] || '#999' }}
              >
                {ep.method}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApiEndpointPage({ endpoint, manifest }: Props) {
  const scalarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const el = scalarRef.current;
    if (!el) return;

    el.innerHTML = '';

    const saved = loadSavedConfig();

    fetch(`/api-specs/${endpoint.filename}`)
      .then((res) => res.json())
      .then((spec) => {
        if (saved.serverUrl && spec.servers) {
          const idx = spec.servers.findIndex(
            (s: { url: string }) => s.url === saved.serverUrl
          );
          if (idx > 0) {
            const [selected] = spec.servers.splice(idx, 1);
            spec.servers.unshift(selected);
          }
        }

        const tryInit = () => {
          if ((window as any).Scalar) {
            (window as any).Scalar.createApiReference(el, {
              content: JSON.stringify(spec),
              hideClientButton: true,
              hideModels: true,
              hideDownloadButton: true,
              hideDarkModeToggle: true,
              _integration: 'docusaurus',
              authentication: {
                preferredSecurityScheme: 'X-API-Key',
                apiKey: {
                  token: saved.apiKey || '',
                },
              },
            });

            // Inject copyable API path under Scalar's visible title
            const injectPath = () => {
              const headings = el.querySelectorAll('h3.section-header-label');
              let heading: Element | null = null;
              for (const h of headings) {
                if (h.getBoundingClientRect().height > 0) {
                  heading = h;
                  break;
                }
              }
              if (!heading) {
                setTimeout(injectPath, 200);
                return;
              }

              // Walk up to find the section-header-wrapper or a block-level ancestor
              let container = heading.closest('.section-header-wrapper') || heading.closest('.section-header');
              if (!container) container = heading.parentElement?.parentElement || heading.parentElement;
              if (!container || container.querySelector('.api-path-line')) return;

              // Use the saved server or default production URL
              const saved = loadSavedConfig();
              const baseUrl = saved.serverUrl || spec.servers?.[0]?.url || 'https://api.appreal.com/api/business/v1';
              const fullUrl = baseUrl + endpoint.path;

              const pathEl = document.createElement('div');
              pathEl.className = 'api-path-line';
              pathEl.title = 'Click to copy';
              pathEl.innerHTML = `<span class="api-path-line__method" style="background:${METHOD_COLORS[endpoint.method] || '#999'}">${endpoint.method}</span><code class="api-path-line__url">${fullUrl}</code><span class="api-path-line__copy-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>`;
              pathEl.addEventListener('click', () => {
                navigator.clipboard.writeText(fullUrl).then(() => {
                  const icon = pathEl.querySelector('.api-path-line__copy-icon');
                  if (icon) {
                    icon.textContent = 'Copied!';
                    setTimeout(() => {
                      icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                    }, 1500);
                  }
                });
              });
              container.after(pathEl);
            };
            setTimeout(injectPath, 500);
          } else {
            setTimeout(tryInit, 100);
          }
        };
        tryInit();
      });

    const cleanupWatcher = watchModalChanges();
    return cleanupWatcher;
  }, [endpoint.filename, location.pathname]);

  return (
    <Layout title={`${endpoint.method} ${endpoint.summary}`}>
      <div className="api-page-layout">
        <ApiSidebar manifest={manifest} currentSlug={endpoint.slug} />
        <main className="api-page-content">
          <div ref={scalarRef} />
        </main>
      </div>
    </Layout>
  );
}
