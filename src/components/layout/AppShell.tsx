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
import { APP_EVENTS, emitAppEvent } from '@/lib/actions';
import { InstallButton } from '@/components/features/InstallButton';
import styles from './AppShell.module.css';

// ── Navigation Items ───────────────────────────────────────

export type NavPage = 'dashboard' | 'projects' | 'launch-sets' | 'settings' | 'manual';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  /** Shown in the mobile bottom bar. */
  onBottomBar?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    shortcut: 'Alt+1',
    onBottomBar: true,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderKanban size={18} />,
    shortcut: 'Alt+2',
    onBottomBar: true,
  },
  {
    id: 'launch-sets',
    label: 'Launch Sets',
    icon: <Layers size={18} />,
    shortcut: 'Alt+3',
    onBottomBar: true,
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { id: 'manual', label: 'User Manual', icon: <BookOpen size={18} />, shortcut: 'F1' },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={18} />,
    shortcut: 'Ctrl+,',
    onBottomBar: true,
  },
];

const BOTTOM_BAR_ITEMS = [...NAV_ITEMS, ...FOOTER_ITEMS].filter(
  (item) => item.onBottomBar
);

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
    getSettings()
      .then((s) => setCollapsed(s.sidebarCollapsed))
      .catch(() => setCollapsed(false));
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      updateSettings({ sidebarCollapsed: next });
      return next;
    });
  }, []);

  const renderNavItem = (item: NavItem) => (
    <button
      key={item.id}
      type="button"
      className={`${styles.navItem} ${
        activePage === item.id ? styles.navItemActive : ''
      }`}
      aria-current={activePage === item.id ? 'page' : undefined}
      onClick={() => onNavigate(item.id)}
      title={collapsed ? item.label : undefined}
    >
      <span className={styles.navIcon}>{item.icon}</span>
      <span className={styles.navLabel}>{item.label}</span>
      {item.shortcut && <span className={styles.navShortcut}>{item.shortcut}</span>}
    </button>
  );

  return (
    <div className={styles.shell}>
      {/* Sidebar: desktop and tablet only. */}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
        aria-label="Main navigation"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>PS</div>
          <span className={styles.sidebarBrand}>ProjectShelf</span>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>Navigation</div>
          {NAV_ITEMS.map(renderNavItem)}

          <div className={styles.navDivider} />

          <button
            type="button"
            className={styles.navItem}
            onClick={() => emitAppEvent(APP_EVENTS.showShortcuts)}
            title={collapsed ? 'Keyboard Shortcuts' : undefined}
          >
            <span className={styles.navIcon}>
              <Keyboard size={18} />
            </span>
            <span className={styles.navLabel}>Shortcuts</span>
            <span className={styles.navShortcut}>?</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          {/* Only renders while the browser reports the app as installable. */}
          <div className={styles.sidebarInstall}>
            <InstallButton variant="sidebar" compact={collapsed} />
          </div>

          {FOOTER_ITEMS.map(renderNavItem)}

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

      {/* Bottom bar: small screens only, where the sidebar would take
          most of the width. */}
      <nav className={styles.bottomBar} aria-label="Main navigation">
        {BOTTOM_BAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.bottomBarItem} ${
              activePage === item.id ? styles.bottomBarItemActive : ''
            }`}
            aria-current={activePage === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.bottomBarIcon}>{item.icon}</span>
            <span className={styles.bottomBarLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
