import React from 'react';
import Layout from '@theme/Layout';
import ApiConfig from './ApiConfig';
import { Endpoint, METHOD_COLORS } from '../lib/api-shared';

export default function ApiIndexPage({ manifest }: { manifest: Endpoint[] }) {
  const byTag = new Map<string, Endpoint[]>();
  for (const ep of manifest) {
    if (!byTag.has(ep.tag)) byTag.set(ep.tag, []);
    byTag.get(ep.tag)!.push(ep);
  }

  return (
    <Layout title="API Reference">
      <div className="api-index">
        <h1>API Reference</h1>
        <p>Appreal Business API v1.0</p>
        <h2>Configure API Playground</h2>
        <p>Set your server and API key. These will be pre-filled on all endpoint pages.</p>
        <ApiConfig />
        {[...byTag.entries()].map(([tag, endpoints]) => (
          <div key={tag} className="api-index__group">
            <h2>{tag}</h2>
            <div className="api-index__endpoints">
              {endpoints.map((ep) => (
                <a
                  key={ep.slug}
                  href={`/api/${ep.slug}`}
                  className="api-index__endpoint"
                >
                  <span
                    className="api-index__method"
                    style={{ background: METHOD_COLORS[ep.method] || '#999' }}
                  >
                    {ep.method}
                  </span>
                  <span className="api-index__path">{ep.path}</span>
                  <span className="api-index__summary">{ep.summary}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
