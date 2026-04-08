import React, { useState, useEffect } from 'react';
import { SERVERS, loadSavedConfig, saveConfig } from '../lib/api-shared';

export default function ApiConfig() {
  const [serverUrl, setServerUrl] = useState(SERVERS[0].url);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = loadSavedConfig();
    if (config.serverUrl) setServerUrl(config.serverUrl);
    if (config.apiKey) setApiKey(config.apiKey);
  }, []);

  const handleSave = () => {
    saveConfig({ serverUrl, apiKey });
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
        Use a <strong>test or development API key</strong> only. Never enter your
        production key in a browser-based playground. Values are stored in your
        browser's localStorage and are never sent to our servers.
      </p>
    </div>
  );
}
