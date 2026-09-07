/* ============================================================
   ProjectShelf Appearance
   Applies theme, font, and density to the document root.

   Settings live in IndexedDB, which is async, so the chosen
   appearance is mirrored into localStorage. That lets the
   blocking script in the root layout restore it synchronously
   on the next load, before the first paint.
   ============================================================ */

import type {
  ThemeName,
  FontName,
  DensityMode,
  FontSizeScale,
  IconSizeScale,
} from '@/lib/db/schema';

// ── Storage Keys ───────────────────────────────────────────

export const APPEARANCE_KEYS = {
  theme: 'projectshelf:theme',
  font: 'projectshelf:font',
  density: 'projectshelf:density',
  fontSize: 'projectshelf:font-size',
  iconSize: 'projectshelf:icon-size',
} as const;

// ── Resolve ────────────────────────────────────────────────

/**
 * Turn the stored theme into a concrete theme name.
 * 'system' follows the operating system's light/dark preference.
 */
export function resolveTheme(theme: ThemeName): Exclude<ThemeName, 'system'> {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// ── Apply ──────────────────────────────────────────────────

export interface AppearanceValues {
  theme?: ThemeName;
  font?: FontName;
  density?: DensityMode;
  fontSize?: FontSizeScale;
  iconSize?: IconSizeScale;
}

/**
 * Write the appearance onto <html> and mirror it to localStorage.
 * Only the keys present in `values` are touched.
 */
export function applyAppearance(values: AppearanceValues): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (values.theme) {
    root.setAttribute('data-theme', resolveTheme(values.theme));
    writeMirror(APPEARANCE_KEYS.theme, values.theme);
  }
  if (values.font) {
    root.setAttribute('data-font', values.font);
    writeMirror(APPEARANCE_KEYS.font, values.font);
  }
  if (values.density) {
    root.setAttribute('data-density', values.density);
    writeMirror(APPEARANCE_KEYS.density, values.density);
  }
  if (values.fontSize) {
    root.setAttribute('data-font-size', values.fontSize);
    writeMirror(APPEARANCE_KEYS.fontSize, values.fontSize);
  }
  if (values.iconSize) {
    root.setAttribute('data-icon-size', values.iconSize);
    writeMirror(APPEARANCE_KEYS.iconSize, values.iconSize);
  }
}

function writeMirror(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the attribute is still applied,
    // it just will not survive a reload.
  }
}

// ── System Theme Watch ─────────────────────────────────────

/**
 * Keep the document in sync with the OS light/dark preference while the
 * user's theme is set to 'system'. Reads the localStorage mirror on each
 * change, so it always reflects the current choice without re-subscribing.
 * Returns an unsubscribe function.
 */
export function startSystemThemeWatch(): () => void {
  if (typeof window === 'undefined') return () => {};

  const query = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(APPEARANCE_KEYS.theme);
    } catch {
      stored = null;
    }
    if (!stored || stored === 'system') {
      document.documentElement.setAttribute('data-theme', resolveTheme('system'));
    }
  };

  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

// ── Boot Script ────────────────────────────────────────────

/**
 * Runs before first paint to restore the saved appearance.
 * Serialised into the document, so it cannot reference imports.
 */
export const APPEARANCE_BOOT_SCRIPT = `
(function () {
  try {
    var root = document.documentElement;
    var theme = localStorage.getItem('${APPEARANCE_KEYS.theme}');
    var font = localStorage.getItem('${APPEARANCE_KEYS.font}');
    var density = localStorage.getItem('${APPEARANCE_KEYS.density}');
    var fontSize = localStorage.getItem('${APPEARANCE_KEYS.fontSize}');
    var iconSize = localStorage.getItem('${APPEARANCE_KEYS.iconSize}');

    if (!theme || theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    root.setAttribute('data-theme', theme);
    if (font) root.setAttribute('data-font', font);
    if (density) root.setAttribute('data-density', density);
    if (fontSize) root.setAttribute('data-font-size', fontSize);
    if (iconSize) root.setAttribute('data-icon-size', iconSize);
  } catch (e) {
    // Leave the server-rendered defaults in place.
  }
})();
`;
