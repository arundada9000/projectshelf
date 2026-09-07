'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/* ============================================================
   PWA Install Prompt

   The browser hands over a deferred prompt event when the app is
   installable. We hold it and fire it from a real control, rather
   than nagging the visitor with an automatic banner.
   ============================================================ */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallPromptState {
  /** A prompt is available, so an install control is worth showing. */
  canInstall: boolean;
  /** Already running as an installed app. */
  isInstalled: boolean;
  /** Triggers the browser's own dialog. Resolves to whether it was accepted. */
  install: () => Promise<boolean>;
}

// ── Installed state ────────────────────────────────────────
// Whether the app is running standalone is the browser's state, not
// ours, so it is read through a store rather than mirrored into an effect.

const STANDALONE_QUERY = '(display-mode: standalone)';

function subscribeStandalone(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia(STANDALONE_QUERY);
  media.addEventListener('change', onChange);
  window.addEventListener('appinstalled', onChange);
  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener('appinstalled', onChange);
  };
}

function getStandalone(): boolean {
  if (window.matchMedia(STANDALONE_QUERY).matches) return true;
  // iOS Safari reports installed state on navigator instead.
  return (window.navigator as { standalone?: boolean }).standalone === true;
}

/** The server cannot know, and assuming "not installed" is the safe default. */
function getStandaloneOnServer(): boolean {
  return false;
}

// ── Hook ───────────────────────────────────────────────────

export function useInstallPrompt(): InstallPromptState {
  const isInstalled = useSyncExternalStore(
    subscribeStandalone,
    getStandalone,
    getStandaloneOnServer
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Keep the event so the choice belongs to the user, not the browser.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event can only be used once, whatever the answer.
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  return {
    canInstall: deferred !== null && !isInstalled,
    isInstalled,
    install,
  };
}
