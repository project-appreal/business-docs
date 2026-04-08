import React, { useCallback, useRef, useEffect, useState } from 'react';
import styles from './styles.module.css';

interface TestRequestModalProps {
  method: string;
  path: string;
}

export default function TestRequestModal({ method, path }: TestRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    document.body.style.overflow = 'hidden';

    const el = containerRef.current;

    // Build hash to deep-link to the right endpoint
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

    // Set hash so Scalar navigates to the right endpoint
    const origHash = window.location.hash;
    window.location.hash = `tag/${tag}/${method.toUpperCase()}/${cleanPath}`;

    // Render Scalar into the overlay container
    const w = window as any;
    if (w.Scalar?.createApiReference) {
      w.Scalar.createApiReference(el, {
        url: '/openapi.json',
        hideDarkModeToggle: true,
      });
    }

    // Auto-click "Test Request" button for this endpoint once Scalar renders
    const target = `${method.toLowerCase()} ${path}`;
    const tryClick = (attempts = 0) => {
      if (attempts > 30 || !isOpen) return;
      const buttons = el.querySelectorAll('button.show-api-client-button');
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes(target)) {
          (btn as HTMLElement).click();
          return;
        }
      }
      setTimeout(() => tryClick(attempts + 1), 300);
    };
    setTimeout(() => tryClick(), 1500);

    return () => {
      document.body.style.overflow = '';
      window.location.hash = origHash;
      // Clean up Scalar from the container
      el.innerHTML = '';
    };
  }, [isOpen, method, path]);

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
        <div className={styles.overlay}>
          <button className={styles.closeButtonFloat} onClick={close} type="button">
            &times; Close
          </button>
          <div ref={containerRef} className={styles.scalarContainer} />
        </div>
      )}
    </>
  );
}
