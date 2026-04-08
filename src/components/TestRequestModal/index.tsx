import React, { useCallback } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

interface TestRequestModalProps {
  method: string;
  path: string;
}

type ScalarClient = {
  open: (payload?: { path: string; method: string }) => void;
};

let clientInstance: ScalarClient | null = null;
let clientInitPromise: Promise<ScalarClient> | null = null;

async function getClient(): Promise<ScalarClient> {
  if (clientInstance) return clientInstance;
  if (clientInitPromise) return clientInitPromise;

  clientInitPromise = (async () => {
    const mod = await import('@scalar/api-client-modal');

    const el = document.createElement('div');
    document.body.appendChild(el);

    const client = await mod.createScalarApiClient(el, {
      spec: { url: '/openapi.json' },
      showSidebar: false,
    });

    clientInstance = client;
    return client;
  })();

  return clientInitPromise;
}

function TestRequestButton({ method, path }: TestRequestModalProps) {
  const handleClick = useCallback(async () => {
    const client = await getClient();
    client.open({ path, method: method.toLowerCase() });
  }, [method, path]);

  return (
    <button
      className={styles.testRequestButton}
      onClick={handleClick}
      type="button"
    >
      Test Request
    </button>
  );
}

export default function TestRequestModal(props: TestRequestModalProps) {
  return (
    <BrowserOnly>
      {() => <TestRequestButton {...props} />}
    </BrowserOnly>
  );
}
