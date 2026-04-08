import React, { useState, useCallback, useRef, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

interface TestRequestModalProps {
  method: string;
  path: string;
}

function TestRequestButton({ method, path }: TestRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // When Scalar's own client closes, close our overlay too
  useEffect(() => {
    if (!isOpen) return;

    const checkClosed = setInterval(() => {
      try {
        const iframeDoc = iframeRef.current?.contentDocument;
        if (!iframeDoc) return;
        // Scalar's client adds/removes an element when open/closed
        const clientEl = iframeDoc.querySelector('.scalar-client, [data-v-app]');
        const exitBtn = iframeDoc.querySelector('.app-exit-button, .agent-scalar-exit-button');
        // If client was open but exit button is gone, user closed it
        if (!exitBtn && clientEl) {
          // Client view was closed
          setIsOpen(false);
        }
      } catch {}
    }, 500);

    return () => clearInterval(checkClosed);
  }, [isOpen]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const target = `${method.toLowerCase()} ${path}`;

    const tryClick = (attempts = 0) => {
      if (attempts > 40) return;
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) { setTimeout(() => tryClick(attempts + 1), 300); return; }

        const buttons = iframeDoc.querySelectorAll('button.show-api-client-button');
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes(target)) {
            (btn as HTMLElement).click();
            return;
          }
        }
        setTimeout(() => tryClick(attempts + 1), 300);
      } catch {
        setTimeout(() => tryClick(attempts + 1), 300);
      }
    };

    setTimeout(() => tryClick(), 2000);
  }, [method, path]);

  // Build deep-link hash
  const cleanPath = path.replace(/^\//, '');
  const tagMap: Record<string, string> = {
    'invoices': 'invoice',
    'account-balances': 'balances',
    'exchange-rates': 'exchange-rates',
    'currencies': 'currencies',
    'networks': 'networks',
    'payout': 'payout',
  };
  const firstSegment = cleanPath.split('/')[0];
  const tag = tagMap[firstSegment] || firstSegment;
  const iframeSrc = `/api-client#tag/${tag}/${method.toUpperCase()}/${cleanPath}`;

  return (
    <>
      <button
        className={styles.testRequestButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Test Request
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <button className={styles.closeButton} onClick={close} type="button">
            &times;
          </button>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className={styles.iframe}
            title="API Client"
            onLoad={handleIframeLoad}
          />
        </div>
      )}
    </>
  );
}

export default function TestRequestModal(props: TestRequestModalProps) {
  return (
    <BrowserOnly>
      {() => <TestRequestButton {...props} />}
    </BrowserOnly>
  );
}
