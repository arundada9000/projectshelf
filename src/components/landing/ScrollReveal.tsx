'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion';
import styles from './Landing.module.css';

export interface ScrollRevealProps {
  children: React.ReactNode;
  /** Stagger within a group, in steps of roughly 60ms. */
  order?: number;
  as?: 'div' | 'section' | 'li' | 'article';
  className?: string;
  id?: string;
}

/**
 * Reveals content as it enters the viewport: a short rise and fade that
 * signals "this arrived", nothing more. Content is visible from the start
 * for anyone who prefers reduced motion, and if IntersectionObserver is
 * unavailable it simply renders shown.
 */
export function ScrollReveal({
  children,
  order = 0,
  as: Tag = 'div',
  className,
  id,
}: ScrollRevealProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Reduced motion renders everything shown from the start.
    if (reduced || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );

    observer.observe(node);

    // Safety net: IntersectionObserver callbacks are tied to the rendering
    // lifecycle, so a tab that is never painted would leave this hidden for
    // good. Reveal regardless after a short wait.
    const fallback = setTimeout(() => {
      setShown(true);
      observer.disconnect();
    }, 2500);

    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, [reduced]);

  const isShown = reduced || shown;

  return (
    <Tag
      // The ref type varies with the tag; the element is the same either way.
      ref={ref as React.Ref<never>}
      id={id}
      className={`${styles.reveal} ${isShown ? styles.revealShown : ''} ${className ?? ''}`}
      style={{ transitionDelay: `${Math.min(order, 6) * 60}ms` }}
    >
      {children}
    </Tag>
  );
}
