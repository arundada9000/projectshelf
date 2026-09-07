'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Landing.module.css';

/**
 * A navigation bar in the iOS mould: transparent over the large title,
 * then settling onto a translucent material once the title scrolls away,
 * with the product name taking the title's place.
 */
export function LandingNav() {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    // The threshold is roughly where the large title leaves the viewport.
    const onScroll = () => setCondensed(window.scrollY > 120);
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.navBar} ${condensed ? styles.navBarCondensed : ''}`}>
      <div className={styles.navBarInner}>
        <Link href="/" className={styles.navBrand}>
          <span className={styles.navLogo} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className={styles.navBrandName}>ProjectShelf</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/guides" className={styles.navLink}>
            Guides
          </Link>
          <Link href="/app/projects" className={styles.navAction}>
            Open
          </Link>
        </div>
      </div>
    </header>
  );
}
