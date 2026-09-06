'use client';

import React from 'react';
import {
  FolderKanban,
  Keyboard,
  Terminal,
  Palette,
  Search,
  Layers,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import styles from './Landing.module.css';

// ── Feature Data ───────────────────────────────────────────

const FEATURES = [
  {
    icon: <FolderKanban size={20} />,
    title: 'Unified Project Hub',
    description:
      'All your projects in one place. Grid or list view, rich search, status filters, and tagging. No more hunting across folders.',
  },
  {
    icon: <Keyboard size={20} />,
    title: 'Keyboard-First',
    description:
      'Every action has a shortcut. Command palette (Ctrl+K), global hotkeys, focus management. Built for speed.',
  },
  {
    icon: <Terminal size={20} />,
    title: 'Quick Actions',
    description:
      'Open any project in your editor, terminal, or file explorer with one click. Multi-select for batch operations.',
  },
  {
    icon: <Palette size={20} />,
    title: '12 Handcrafted Themes',
    description:
      'Midnight, Nordic, Forest, Ocean, Plum, Amber, and more. Every theme is carefully tuned for readability and aesthetics.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Local-First & Offline',
    description:
      'Zero cloud dependencies. All data lives in your browser\'s IndexedDB. Works offline. Export/import JSON backups anytime.',
  },
  {
    icon: <Layers size={20} />,
    title: 'Launch Sets',
    description:
      'Group projects into launch sets. Open your entire workspace — editor, terminal, browser — in one command.',
  },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Command palette' },
  { keys: ['Ctrl', 'N'], label: 'New project' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['?'], label: 'Shortcuts cheat sheet' },
  { keys: ['Ctrl', ','], label: 'Settings' },
  { keys: ['Alt', '1-4'], label: 'Navigate sections' },
  { keys: ['Ctrl', 'E'], label: 'Open in editor' },
  { keys: ['Ctrl', 'T'], label: 'Open terminal' },
];

// ── Landing Page ───────────────────────────────────────────

export interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  // Support Ctrl+K, Ctrl+F, etc. directly from the landing page
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const hasPrimary = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const code = e.code?.toLowerCase();

      // Ctrl+K or Ctrl+P: Launch and open command palette
      if (hasPrimary && (key === 'k' || code === 'keyk' || key === 'p' || code === 'keyp')) {
        e.preventDefault();
        e.stopPropagation();
        onLaunchApp();
        return;
      }

      // Ctrl+F or /: Launch and focus search
      if ((hasPrimary && (key === 'f' || code === 'keyf')) || key === '/') {
        e.preventDefault();
        e.stopPropagation();
        onLaunchApp();
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[role="searchbox"], input[type="text"]');
          input?.focus();
        }, 100);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onLaunchApp]);
  return (
    <div className={styles.landing}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Zap size={12} />
            Local-first • Offline-ready • Zero tracking
          </div>
          <h1 className={styles.heroTitle}>
            Your Developer{' '}
            <span className={styles.heroTitleAccent}>Command Center</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Organize, search, and launch all your software projects from one
            keyboard-driven interface. No cloud. No accounts. Just speed.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.heroCta}
              onClick={onLaunchApp}
            >
              Launch App
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className={styles.heroSecondary}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See Features
            </button>
          </div>
          <div className={styles.heroKbd}>
            Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open the command palette
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className={styles.features}>
        <div className={styles.featuresHeader}>
          <div className={styles.featuresLabel}>Features</div>
          <h2 className={styles.featuresTitle}>Built for developers who ship</h2>
          <p className={styles.featuresSubtitle}>
            Every detail is designed for speed, clarity, and control.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((feature, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Keyboard Showcase ─────────────────────────────── */}
      <section className={styles.kbdSection}>
        <h2 className={styles.kbdTitle}>Every key does something</h2>
        <p className={styles.kbdSubtitle}>
          Designed for the keyboard. Every action is one shortcut away.
        </p>
        <div className={styles.kbdGrid}>
          {SHORTCUTS.map((shortcut, i) => (
            <div key={i} className={styles.kbdRow}>
              <span className={styles.kbdLabel}>{shortcut.label}</span>
              <span className={styles.kbdKeys}>
                {shortcut.keys.map((k, j) => (
                  <kbd key={j}>{k}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to organize your projects?</h2>
          <p className={styles.ctaDesc}>
            No sign-up, no cloud sync, no tracking. Just open and start adding projects.
          </p>
          <button
            type="button"
            className={styles.heroCta}
            onClick={onLaunchApp}
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          ProjectShelf — Built with Next.js, TypeScript, and IndexedDB.
          100% local-first.
        </p>
      </footer>
    </div>
  );
}
