'use client';

/**
 * Subtle haptic feedback for meaningful interactions.
 *
 * Uses the Vibration API where the platform provides it (typically touch
 * devices). On desktop it is a silent no-op. Haptics are never required
 * to understand or operate the interface.
 */

export type HapticKind = 'selection' | 'action' | 'danger' | 'drag';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Vibrate when available and enabled. The API takes a number of
 * milliseconds; devices without a vibrator simply do nothing.
 */
export function haptic(kind: HapticKind): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  switch (kind) {
    case 'selection':
      navigator.vibrate(8);
      break;
    case 'action':
      navigator.vibrate(12);
      break;
    case 'danger':
      navigator.vibrate([30, 40, 60]);
      break;
    case 'drag':
      navigator.vibrate(15);
      break;
  }
}