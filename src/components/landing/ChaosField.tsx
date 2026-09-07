'use client';

import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion';
import styles from './Landing.module.css';

/**
 * The scatter that opens the story. Real-looking fragments of a developer's
 * project sprawl drift in place, then settle into a column once the page
 * has loaded, which is the whole product argument in one gesture.
 *
 * Positions are fixed values rather than random so the composition is
 * deliberate and identical between server and client render.
 */

interface Fragment {
  text: string;
  kind: 'path' | 'repo' | 'url' | 'note';
  /** Percentage offsets within the field. */
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

const FRAGMENTS: Fragment[] = [
  { text: 'C:\\Dev\\', kind: 'path', x: 4, y: 12, rotate: -3, scale: 1 },
  { text: 'project-final-2', kind: 'path', x: 30, y: 4, rotate: 2, scale: 0.92 },
  { text: 'github.com/…/beacon', kind: 'repo', x: 62, y: 9, rotate: -1.5, scale: 0.96 },
  { text: 'D:\\Projects\\', kind: 'path', x: 9, y: 44, rotate: 1.5, scale: 0.94 },
  { text: 'thing-i-was-building', kind: 'note', x: 36, y: 34, rotate: -2, scale: 1 },
  { text: 'localhost:3000', kind: 'url', x: 70, y: 40, rotate: 2.5, scale: 0.9 },
  { text: 'Desktop\\new-app-real', kind: 'path', x: 2, y: 72, rotate: -1, scale: 0.93 },
  { text: 'DO NOT DELETE', kind: 'note', x: 33, y: 66, rotate: 3, scale: 0.88 },
  { text: 'Downloads\\old-site', kind: 'path', x: 63, y: 70, rotate: -2.5, scale: 0.95 },
  { text: 'aurora.dev', kind: 'url', x: 46, y: 88, rotate: 1, scale: 0.9 },
  { text: 'what was this again?', kind: 'note', x: 12, y: 92, rotate: -1.5, scale: 0.86 },
];

export function ChaosField() {
  const reduced = usePrefersReducedMotion();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduced) return;
    // Let the scatter register before it resolves.
    const timer = setTimeout(() => setSettled(true), 1400);
    return () => clearTimeout(timer);
  }, [reduced]);

  // With reduced motion the scatter is skipped and the stack shown outright.
  const isSettled = reduced || settled;

  return (
    <div
      className={`${styles.chaos} ${isSettled ? styles.chaosSettled : ''}`}
      aria-hidden="true"
    >
      <div className={styles.chaosCount}>
        <span className={styles.chaosCountValue}>127</span>
        <span className={styles.chaosCountLabel}>projects, somewhere</span>
      </div>

      {FRAGMENTS.map((fragment, index) => (
        <span
          key={fragment.text}
          className={`${styles.chaosItem} ${styles[`chaos_${fragment.kind}`]}`}
          style={
            {
              '--x': `${fragment.x}%`,
              '--y': `${fragment.y}%`,
              '--rotate': `${fragment.rotate}deg`,
              '--scale': fragment.scale,
              '--settle-order': index,
              // A drift unique to each fragment, so nothing moves in lockstep.
              '--drift-duration': `${7 + (index % 5)}s`,
              '--drift-delay': `${index * 0.35}s`,
              animationPlayState: reduced ? 'paused' : undefined,
            } as React.CSSProperties
          }
        >
          {fragment.text}
        </span>
      ))}
    </div>
  );
}
