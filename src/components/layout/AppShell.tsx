'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Settings,
  BookOpen,
  Keyboard,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/db';
import styles from './AppShell.module.css';

// ── Navigation Items ───────────────────────────────────────

export type NavPage = 'dashboard' | 'projects' | 'launch-sets' | 'settings' | 'manual';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, shortcut: 'Alt+1' },
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} />, shortcut: 'Alt+2' },
  { id: 'launch-sets', label: 'Launch Sets', icon: <Layers size={18} />, shortcut: 'Alt+3' },
];

const FOOTER_ITEMS: NavItem[] = [
  { id: 'manual', label: 'User Manual', icon: <BookOpen size={18} />, shortcut: 'F1' },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} />, shortcut: 'Ctrl+,' },
];

// ── App Shell ──────────────────────────────────────────────

export interface AppShellProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  children: React.ReactNode;
  pageTitle: string;
  headerActions?: React.ReactNode;
}

export function AppShell({
  activePage,
  onNavigate,
  children,
  pageTitle,
  headerActions,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setCollapsed(s.sidebarCollapsed));
  }, []);

  const toggleSidebar = useCallback(async () => {
    setCollapsed((prev) => {
      const next = !prev;
      updateSettings({ sidebarCollapsed: next });
      return next;
    });
  }, []);

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>PS</div>
          <span className={styles.sidebarBrand}>ProjectShelf</span>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>Navigation</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.shortcut && (
                <span className={styles.navShortcut}>{item.shortcut}</span>
              )}
            </button>
          ))}

          <div className={styles.navDivider} />

          <button
            type="button"
            className={styles.navItem}
            onClick={() => {
              // Keyboard shortcuts cheat sheet -- will dispatch via event
              document.dispatchEvent(new CustomEvent('projectshelf:show-shortcuts'));
            }}
            title={collapsed ? 'Keyboard Shortcuts' : undefined}
          >
            <span className={styles.navIcon}><Keyboard size={18} /></span>
            <span className={styles.navLabel}>Shortcuts</span>
            <span className={styles.navShortcut}>?</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          {FOOTER_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.shortcut && (
                <span className={styles.navShortcut}>{item.shortcut}</span>
              )}
            </button>
          ))}

          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.mainHeader}>
          <h1 className={styles.mainTitle}>{pageTitle}</h1>
          {headerActions}
        </header>
        <div className={styles.mainContent}>{children}</div>
      </main>
    </div>
  );
}
