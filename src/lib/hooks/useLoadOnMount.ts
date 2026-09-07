'use client';

import { useEffect } from 'react';

/**
 * Run an asynchronous loader when the component mounts, and again whenever
 * the loader identity changes.
 *
 * Reading from IndexedDB and storing the result is the one place a component
 * legitimately sets state from an effect: the value cannot be derived during
 * render, and the update lands in a later microtask rather than synchronously,
 * so it does not cascade into an extra render pass.
 */
export function useLoadOnMount(load: () => void | Promise<void>): void {
  useEffect(() => {
    void load();
  }, [load]);
}
