import React, { useState, useCallback } from 'react';
import styles from './styles.module.css';

interface TestRequestModalProps {
  method: string;
  path: string;
}

export default function TestRequestModal({ method, path }: TestRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

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
              src="/api-client"
              className={styles.iframe}
              title="API Client"
            />
          </div>
        </div>
      )}
    </>
  );
}
