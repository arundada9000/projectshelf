'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/* ============================================================
   Scroll Progress

   Scroll handlers are the easiest thing on a page to make janky,
   so these read layout once per animation frame and never write
   anything but transforms and opacity.
   ============================================================ */

/** How far down the whole document the reader is, from 0 to 1. */
export function useDocumentProgress(): number {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };

    const onScroll = () => {
      // Coalesce bursts of scroll events into one read per frame.
      if (frame.current) return;
      frame.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return reduced ? 0 : progress;
}

/**
 * How far an element has travelled through the viewport, from 0 when its
 * top edge first appears at the bottom to 1 when its bottom edge leaves
 * at the top. Useful for parallax that is tied to the element rather
 * than to the page.
 */
export function useElementProgress<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  progress: number;
} {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    const update = () => {
      frame.current = 0;
      const rect = node.getBoundingClientRect();
      const total = window.innerHeight + rect.height;
      const travelled = window.innerHeight - rect.top;
      setProgress(Math.max(0, Math.min(1, travelled / total)));
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  return { ref, progress: reduced ? 0.5 : progress };
}
