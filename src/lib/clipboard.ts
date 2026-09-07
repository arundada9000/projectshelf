/* ============================================================
   ProjectShelf Clipboard
   Copying is the primary output of this application, so it has
   to degrade gracefully rather than silently fail.
   ============================================================ */

import { playSound } from '@/lib/sound';
import { haptic } from '@/lib/haptics';

/**
 * Copy text, falling back to a hidden selection when the async
 * Clipboard API is unavailable or refused (insecure context, an
 * unfocused document, or a permissions policy).
 *
 * Returns whether the text made it to the clipboard, so callers can
 * offer the text for manual copying instead of just reporting failure.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      playSound('copy');
      haptic('action');
      return true;
    } catch {
      // Fall through to the selection-based path below.
    }
  }

  const ok = copyViaSelection(text);
  if (ok) {
    playSound('copy');
    haptic('action');
  }
  return ok;
}

function copyViaSelection(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const field = document.createElement('textarea');
  field.value = text;
  // Keep it out of view and out of the tab order, but still selectable.
  field.setAttribute('readonly', '');
  field.setAttribute('aria-hidden', 'true');
  field.tabIndex = -1;
  field.style.position = 'fixed';
  field.style.top = '0';
  field.style.left = '-9999px';
  field.style.opacity = '0';

  document.body.appendChild(field);

  try {
    field.select();
    field.setSelectionRange(0, field.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(field);
  }
}
