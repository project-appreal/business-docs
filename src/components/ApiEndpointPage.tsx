import React, { useEffect, useRef } from 'react';
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

/**
 * Watch for changes in the Scalar Test Request modal.
 * - Server URL: rendered as a headlessui popover button with sr-only "Server:" label
 * - API key: rendered as an input inside the auth section
 * Both live in #headlessui-portal-root, outside our component tree.
 */
function watchModalChanges() {
  let lastKey = '';
  let lastServer = '';

  function syncFromDom() {
    // Find the server URL button: has a child <span class="sr-only">Server:</span>
    // The URL text is the button's textContent minus "Server:"
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

    // Find API key inputs in the modal auth section
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

  // Event delegation for typing in auth inputs
  // The auth input is type="text" with class containing "scalar-pas" (scalar-password),
  // inside a section with class "request-section-content-auth"
  const inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement)) return;
    const isAuth = target.closest('.request-section-content-auth');
    if (isAuth && target.value !== lastKey) {
      lastKey = target.value;
      saveConfig({ apiKey: target.value });
    }
  };

  // Click handler: server popover options trigger DOM mutations,
  // so we catch them via MutationObserver. But also run sync on clicks
  // to catch popover item selections.
  const clickHandler = () => {
    // Delay slightly to let Scalar update the button text after selection
    setTimeout(syncFromDom, 200);
  };

  // MutationObserver to catch server URL button text changes
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

function ApiSidebar({ manifest, currentSlug }: { manifest: Endpoint[]; currentSlug: string }) {
  const byTag = new Map<string, Endpoint[]>();
  for (const ep of manifest) {
    if (!byTag.has(ep.tag)) byTag.set(ep.tag, []);
    byTag.get(ep.tag)!.push(ep);
  }

  return (
    <nav className="api-sidebar">
      <div className="api-sidebar__header">
        <a href="/api" className="api-sidebar__all-link">All Endpoints</a>
      </div>
      {[...byTag.entries()].map(([tag, endpoints]) => (
        <div key={tag} className="api-sidebar__group">
          <div className="api-sidebar__tag">{tag}</div>
          {endpoints.map((ep) => (
            <a
              key={ep.slug}
              href={`/api/${ep.slug}`}
              className={`api-sidebar__item ${ep.slug === currentSlug ? 'api-sidebar__item--active' : ''}`}
            >
              <span
                className="api-sidebar__method"
                style={{ color: METHOD_COLORS[ep.method] || '#999' }}
              >
                {ep.method}
              </span>
              <span className="api-sidebar__summary">{ep.summary}</span>
            </a>
          ))}
        </div>
      ))}
    </nav>
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
        // Put saved server first so Scalar selects it by default
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
