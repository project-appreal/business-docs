import React, { useEffect, useRef, useState } from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';
import {
  Endpoint,
  METHOD_COLORS,
  SCALAR_CDN_URL,
  SCALAR_CDN_SRI,
  COPY_ICON_SVG,
  DEFAULT_SERVER_URL,
  loadSavedConfig,
  saveConfig,
} from '../lib/api-shared';

interface Props {
  endpoint: Endpoint;
  manifest: Endpoint[];
}

const MAX_RETRIES = 50;

/**
 * Ensures the Scalar CDN script is loaded (only once, only on API pages).
 * Returns a promise that resolves when window.Scalar is available.
 */
function ensureScalarLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Scalar) {
      resolve();
      return;
    }
    // Check if script tag already exists
    if (!document.querySelector(`script[src="${SCALAR_CDN_URL}"]`)) {
      const script = document.createElement('script');
      script.src = SCALAR_CDN_URL;
      script.integrity = SCALAR_CDN_SRI;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Scalar CDN'));
      document.head.appendChild(script);
    } else {
      // Script exists but hasn't loaded yet — poll
      let retries = 0;
      const check = () => {
        if (window.Scalar) resolve();
        else if (retries++ > MAX_RETRIES) reject(new Error('Scalar failed to initialize'));
        else setTimeout(check, 100);
      };
      check();
    }
  });
}

/**
 * Watch for server URL and API key changes in the Scalar Test Request modal.
 *
 * Scalar v1.28 DOM dependency: This function scrapes Scalar's internal DOM to
 * detect changes. The selectors below are coupled to Scalar v1.28's rendering.
 * If the CDN pin is bumped, these selectors must be verified.
 *
 * - Server URL: headlessui popover button with sr-only "Server:" label
 * - API key: input inside .request-section-content-auth
 */
function watchModalChanges(scalarContainer: HTMLElement) {
  let lastKey = '';
  let lastServer = '';
  let clickTimeout: ReturnType<typeof setTimeout> | null = null;

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
      '.request-section-content-auth input'
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
    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(syncFromDom, 200);
  };

  const observer = new MutationObserver(() => {
    syncFromDom();
  });

  document.addEventListener('input', inputHandler, true);
  document.addEventListener('change', inputHandler, true);
  document.addEventListener('click', clickHandler, true);
  observer.observe(scalarContainer, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  return () => {
    document.removeEventListener('input', inputHandler, true);
    document.removeEventListener('change', inputHandler, true);
    document.removeEventListener('click', clickHandler, true);
    if (clickTimeout) clearTimeout(clickTimeout);
    observer.disconnect();
  };
}

/**
 * Injects a copyable API path (method badge + full URL) under Scalar's
 * visible endpoint title (h3.section-header-label).
 *
 * Uses DOM API (not innerHTML) to avoid XSS from localStorage-sourced values.
 */
function injectCopyablePath(
  container: HTMLElement,
  method: string,
  apiPath: string,
  serverUrl: string,
  cancelled: () => boolean,
) {
  let retries = 0;

  const attempt = () => {
    if (cancelled() || retries++ > MAX_RETRIES) return;

    const headings = container.querySelectorAll('h3.section-header-label');
    let heading: Element | null = null;
    for (const h of headings) {
      if (h.getBoundingClientRect().height > 0) {
        heading = h;
        break;
      }
    }
    if (!heading) {
      setTimeout(attempt, 200);
      return;
    }

    const wrapper = heading.closest('.section-header-wrapper') || heading.closest('.section-header');
    const target = wrapper || heading.parentElement?.parentElement || heading.parentElement;
    if (!target || target.querySelector('.api-path-line')) return;

    const fullUrl = serverUrl + apiPath;

    const pathEl = document.createElement('div');
    pathEl.className = 'api-path-line';
    pathEl.title = 'Click to copy';

    const methodSpan = document.createElement('span');
    methodSpan.className = 'api-path-line__method';
    methodSpan.style.background = METHOD_COLORS[method] || '#999';
    methodSpan.textContent = method;

    const urlCode = document.createElement('code');
    urlCode.className = 'api-path-line__url';
    urlCode.textContent = fullUrl;

    const copyIcon = document.createElement('span');
    copyIcon.className = 'api-path-line__copy-icon';
    copyIcon.innerHTML = COPY_ICON_SVG;

    pathEl.appendChild(methodSpan);
    pathEl.appendChild(urlCode);
    pathEl.appendChild(copyIcon);

    pathEl.addEventListener('click', () => {
      navigator.clipboard.writeText(fullUrl).catch(() => {});
      copyIcon.textContent = 'Copied!';
      setTimeout(() => {
        copyIcon.textContent = '';
        copyIcon.innerHTML = COPY_ICON_SVG;
      }, 1500);
    });

    target.after(pathEl);
  };

  setTimeout(attempt, 500);
}

function ApiSidebar({ manifest, currentSlug }: { manifest: Endpoint[]; currentSlug: string }) {
  const byTag = new Map<string, Endpoint[]>();
  for (const ep of manifest) {
    if (!byTag.has(ep.tag)) byTag.set(ep.tag, []);
    byTag.get(ep.tag)!.push(ep);
  }

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

    let cancelled = false;
    const controller = new AbortController();

    el.textContent = '';

    const saved = loadSavedConfig();

    fetch(`/api-specs/${endpoint.filename}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`);
        return res.json();
      })
      .then((spec) => {
        if (cancelled) return;

        // Reorder servers so saved selection is first
        if (saved.serverUrl && spec.servers) {
          const idx = spec.servers.findIndex(
            (s: { url: string }) => s.url === saved.serverUrl
          );
          if (idx > 0) {
            const [selected] = spec.servers.splice(idx, 1);
            spec.servers.unshift(selected);
          }
        }

        ensureScalarLoaded()
          .then(() => {
            if (cancelled) return;
            window.Scalar!.createApiReference(el, {
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

            const baseUrl = saved.serverUrl || spec.servers?.[0]?.url || DEFAULT_SERVER_URL;
            injectCopyablePath(el, endpoint.method, endpoint.path, baseUrl, () => cancelled);
          })
          .catch((err) => console.error('Scalar initialization failed:', err));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load API spec:', err);
        }
      });

    const cleanupWatcher = watchModalChanges(el);

    return () => {
      cancelled = true;
      controller.abort();
      cleanupWatcher();
    };
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
