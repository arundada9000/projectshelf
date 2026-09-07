'use client';

import React from 'react';
import { useElementProgress } from '@/lib/hooks/useScrollProgress';
import styles from './Landing.module.css';

export interface ParallaxProps {
  children: React.ReactNode;
  /**
   * Total vertical travel in pixels across the element's full pass through
   * the viewport. Keep it small: this should be felt, not watched.
   */
  distance?: number;
  /** Scale at the start of the pass, easing to 1 as it centres. */
  fromScale?: number;
  className?: string;
}

/**
 * Moves content slightly against the scroll so foreground and background
 * separate. Transform only, one layout read per frame, and completely
 * inert when the visitor prefers reduced motion.
 */
export function Parallax({
  children,
  distance = 40,
  fromScale = 1,
  className,
}: ParallaxProps) {
  const { ref, progress } = useElementProgress<HTMLDivElement>();

  // Centre the range on 0 so the element sits still as it crosses the middle.
  const offset = (0.5 - progress) * distance;
  const scale = fromScale + (1 - fromScale) * Math.min(1, progress * 2);

  return (
    <div
      ref={ref}
      className={`${styles.parallax} ${className ?? ''}`}
      style={{ transform: `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})` }}
    >
      {children}
    </div>
  );
}
