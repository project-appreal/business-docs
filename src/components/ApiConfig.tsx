import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'appreal-api-config';

const SERVERS = [
  { url: 'https://api.appreal.com/api/business/v1', label: 'Production' },
  { url: 'https://dev.appreal.xyz/api/business/v1', label: 'Development' },
];

function load(): { serverUrl?: string; apiKey?: string } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function save(data: { serverUrl: string; apiKey: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

export default function ApiConfig() {
  const [serverUrl, setServerUrl] = useState(SERVERS[0].url);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = load();
    if (config.serverUrl) setServerUrl(config.serverUrl);
    if (config.apiKey) setApiKey(config.apiKey);
  }, []);

  const handleSave = () => {
    save({ serverUrl, apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="api-config">
      <div className="api-config__field">
        <label className="api-config__label">Server</label>
        <select
          className="api-config__select"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        >
          {SERVERS.map((s) => (
            <option key={s.url} value={s.url}>
              {s.label} — {s.url}
            </option>
          ))}
        </select>
      </div>
      <div className="api-config__field">
        <label className="api-config__label">X-API-Key</label>
        <input
          className="api-config__input"
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <button className="api-config__button" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save for API Playground'}
      </button>
      <p className="api-config__hint">
        These values are stored in your browser's localStorage and will be
        pre-filled on all API endpoint pages. They are never sent to our servers.
      </p>
    </div>
  );
}
