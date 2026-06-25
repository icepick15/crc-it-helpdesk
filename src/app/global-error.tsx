'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // global-error replaces the root layout entirely — must include <html> and <body>
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: '#fef2f2',
              borderRadius: '9999px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={48} color="#dc2626" />
          </div>

          <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Critical Error
          </p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Application error
          </h1>
          <p style={{ color: '#6b7280', maxWidth: '28rem', margin: '0 auto 1.5rem' }}>
            A critical error occurred. Please reload the page or contact IT support if this continues.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '1.5rem' }}>
              Reference: {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = '/signin')}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'transparent',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Go to sign in
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
