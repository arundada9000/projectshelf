'use client';

import { useEffect, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────

export interface HotkeyAction {
  id: string;
  keyCombo: string;
  handler: () => void;
  scope?: string;
  enabled?: boolean;
}

// ── Parse key combo ────────────────────────────────────────

interface ParsedCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

function parseKeyCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split('+');
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    key: parts[parts.length - 1],
  };
}

function matchesEvent(parsed: ParsedCombo, e: KeyboardEvent): boolean {
  const key = e.key.toLowerCase();
  // Handle special keys
  const eventKey =
    key === '/' ? '/'
    : key === '?' ? '?'
    : key === ',' ? ','
    : key === 'escape' ? 'escape'
    : key === 'delete' ? 'delete'
    : key === 'backspace' ? 'backspace'
    : key === 'enter' ? 'enter'
    : key === 'tab' ? 'tab'
    : key === ' ' ? 'space'
    : key === 'f1' ? 'f1'
    : key;

  return (
    parsed.ctrl === (e.ctrlKey || e.metaKey) &&
    parsed.shift === e.shiftKey &&
    parsed.alt === e.altKey &&
    parsed.key === eventKey
  );
}

// ── useHotkeys Hook ────────────────────────────────────────

export function useHotkeys(actions: HotkeyAction[]) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable
      ) {
        // Allow some global shortcuts even when focused on input
        const combo = actionsRef.current.find((a) => {
          if (a.enabled === false) return false;
          const parsed = parseKeyCombo(a.keyCombo);
          return matchesEvent(parsed, e) && (parsed.ctrl || parsed.alt || a.keyCombo === 'escape');
        });
        if (combo) {
          e.preventDefault();
          e.stopPropagation();
          combo.handler();
        }
        return;
      }

      for (const action of actionsRef.current) {
        if (action.enabled === false) continue;
        const parsed = parseKeyCombo(action.keyCombo);
        if (matchesEvent(parsed, e)) {
          e.preventDefault();
          e.stopPropagation();
          action.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

// ── Format key combo for display ───────────────────────────

export function formatKeyCombo(combo: string): string {
  return combo
    .split('+')
    .map((part) => {
      const p = part.trim().toLowerCase();
      switch (p) {
        case 'ctrl': return 'Ctrl';
        case 'shift': return 'Shift';
        case 'alt': return 'Alt';
        case 'meta':
        case 'cmd': return 'Cmd';
        case 'escape': return 'Esc';
        case 'delete': return 'Del';
        case 'backspace': return 'Bksp';
        case 'enter': return 'Enter';
        case 'space': return 'Space';
        default: return p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1);
      }
    })
    .join(' + ');
}
