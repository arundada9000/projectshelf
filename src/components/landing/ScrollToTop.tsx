'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useDocumentProgress } from '@/lib/hooks/useScrollProgress';
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion';
import styles from './Landing.module.css';

/* Geometry for the progress ring. The circle is drawn in a viewBox of its
   own so the stroke stays crisp at any rendered size. */
const SIZE = 44;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A floating return-to-top control whose ring fills as the reader moves
 * through the page, so it doubles as a position indicator. It stays out
 * of the way until there is enough page behind you to want it.
 */
export function ScrollToTop() {
  const progress = useDocumentProgress();
  const reduced = usePrefersReducedMotion();

  // Nothing to return to until the reader is properly into the page.
  const visible = progress > 0.06;

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={`${styles.toTop} ${visible ? styles.toTopShown : ''}`}
      onClick={handleClick}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      aria-label={`Back to top. ${Math.round(progress * 100)} percent of the page read.`}
    >
      <svg
        className={styles.toTopRing}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className={styles.toTopTrack}
        />
        {/* Fill, rotated so it starts at the top and runs clockwise. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className={styles.toTopFill}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: CIRCUMFERENCE * (1 - progress),
          }}
        />
      </svg>

      <ArrowUp size={16} className={styles.toTopIcon} />
    </button>
  );
}
