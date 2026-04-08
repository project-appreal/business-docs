import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './styles.module.css';

interface TestRequestModalProps {
  method: string;
  path: string;
}

export default function TestRequestModal({ method, path }: TestRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // After iframe loads, auto-click Scalar's "Test Request" button for this endpoint
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const tryClick = (attempts = 0) => {
      if (attempts > 20) return;
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Find the "Test Request" button matching this method + path
        const target = `${method.toLowerCase()} ${path}`;
        const buttons = iframeDoc.querySelectorAll('button.show-api-client-button');
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes(target)) {
            (btn as HTMLElement).click();
            return;
          }
        }
        // If not found yet, Scalar might still be rendering — retry
        setTimeout(() => tryClick(attempts + 1), 500);
      } catch {
        setTimeout(() => tryClick(attempts + 1), 500);
      }
    };

    // Give Scalar time to render the full reference
    setTimeout(() => tryClick(), 1500);
  }, [method, path]);

  // Build Scalar deep-link hash
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
  const scalarHash = `#tag/${tag}/${method.toUpperCase()}/${cleanPath}`;
  const iframeSrc = `/api-client${scalarHash}`;

  return (
    <>
      <button
        className={styles.testRequestButton}
        onClick={open}
        type="button"
      >
        Test Request
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                <span className={`${styles.methodBadge} ${styles[method.toLowerCase()]}`}>
                  {method.toUpperCase()}
                </span>
                {path}
              </span>
              <button className={styles.closeButton} onClick={close} type="button">
                &times;
              </button>
            </div>
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className={styles.iframe}
              title="API Client"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      )}
    </>
  );
}
