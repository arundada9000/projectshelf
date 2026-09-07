'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './status-page.module.css';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the console for anyone debugging; not sent anywhere.
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.code}>Error</p>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.body}>
          The page stopped unexpectedly. Your projects are stored in this browser and
          have not been touched, so trying again is safe.
        </p>
        {error.digest && <p className={styles.digest}>Reference: {error.digest}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={reset}>
            Try again
          </button>
          <Link href="/app/projects" className={styles.secondary}>
            Go to your projects
          </Link>
        </div>
      </div>
    </main>
  );
}
