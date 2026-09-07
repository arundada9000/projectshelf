'use client';

import { useSyncExternalStore } from 'react';

/* ============================================================
   Reduced Motion

   The operating system setting is external state, so it is read
   through useSyncExternalStore rather than mirrored into an
   effect. That keeps it correct during hydration and updates
   live if the visitor changes the setting.
   ============================================================ */

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** The server cannot know the preference, so it assumes motion is fine. */
function getServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
