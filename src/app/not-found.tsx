import Link from 'next/link';
import styles from './status-page.module.css';

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>That page does not exist</h1>
        <p className={styles.body}>
          The link may be out of date, or the address may have a typo in it. Your
          projects are unaffected.
        </p>
        <div className={styles.actions}>
          <Link href="/app/projects" className={styles.primary}>
            Go to your projects
          </Link>
          <Link href="/" className={styles.secondary}>
            Back to the start
          </Link>
        </div>
      </div>
    </main>
  );
}
