'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ToastProvider, useToast } from '@/components/ui';
import { AppShell, type NavPage } from '@/components/layout/AppShell';
import { ProjectsView } from '@/components/projects/ProjectsView';
import { CommandPalette, buildDefaultPaletteItems } from '@/components/features/CommandPalette';
import { ShortcutsModal } from '@/components/features/ShortcutsModal';
import { OnboardingModal } from '@/components/features/Onboarding';
import { useHotkeys, type HotkeyAction } from '@/lib/hooks/useHotkeys';
import { exportAllData, downloadJSON } from '@/lib/db/import-export';
import { SettingsView } from '@/components/settings/SettingsView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { LaunchSetsView } from '@/components/launch-sets/LaunchSetsView';
import { ManualView } from '@/components/manual/ManualView';

// ── Page Titles ────────────────────────────────────────────

const PAGE_TITLES: Record<NavPage, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  'launch-sets': 'Launch Sets',
  settings: 'Settings',
  manual: 'User Manual',
};

// ── Inner App (needs ToastProvider above it) ───────────────

function AppInner() {
  const { toast } = useToast();
  const [activePage, setActivePage] = useState<NavPage>('projects');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // ── Navigation ─────────────────────────────────────────

  const navigate = useCallback((page: string) => {
    setActivePage(page as NavPage);
  }, []);

  // ── Actions ────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    try {
      const data = await exportAllData();
      downloadJSON(data);
      toast('Data exported successfully', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  }, [toast]);

  const handleImport = useCallback(() => {
    toast('Import: use Settings > Data to import a backup file', 'info');
  }, [toast]);

  // ── Command Palette Items ──────────────────────────────

  const paletteItems = useMemo(
    () =>
      buildDefaultPaletteItems({
        navigate,
        createProject: () => {
          setActivePage('projects');
          // Dispatch custom event that ProjectsView listens to
          document.dispatchEvent(new CustomEvent('projectshelf:create-project'));
        },
        toggleView: () => {
          document.dispatchEvent(new CustomEvent('projectshelf:toggle-view'));
        },
        showShortcuts: () => setShortcutsOpen(true),
        openSettings: () => setActivePage('settings'),
        openManual: () => setActivePage('manual'),
        exportData: handleExport,
        importData: handleImport,
      }),
    [navigate, handleExport, handleImport]
  );

  // ── Global Hotkeys ─────────────────────────────────────

  const focusSearchInput = useCallback(() => {
    setActivePage('projects');
    setTimeout(() => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[role="searchbox"], input[type="text"][placeholder*="Search"], input[placeholder*="Search"]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }, 60);
  }, []);

  const hotkeys: HotkeyAction[] = useMemo(
    () => [
      {
        id: 'command-palette-k',
        keyCombo: 'ctrl+k',
        handler: () => setPaletteOpen((prev) => !prev),
      },
      {
        id: 'command-palette-p',
        keyCombo: 'ctrl+p',
        handler: () => setPaletteOpen((prev) => !prev),
      },
      {
        id: 'focus-search-ctrl-f',
        keyCombo: 'ctrl+f',
        handler: focusSearchInput,
      },
      {
        id: 'focus-search-slash',
        keyCombo: '/',
        handler: focusSearchInput,
      },
      {
        id: 'shortcuts-shift-question',
        keyCombo: 'shift+?',
        handler: () => setShortcutsOpen((prev) => !prev),
      },
      {
        id: 'shortcuts-question',
        keyCombo: '?',
        handler: () => setShortcutsOpen((prev) => !prev),
      },
      {
        id: 'new-project',
        keyCombo: 'ctrl+n',
        handler: () => {
          setActivePage('projects');
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('projectshelf:create-project'));
          }, 60);
        },
      },
      {
        id: 'toggle-view',
        keyCombo: 'ctrl+shift+v',
        handler: () => {
          document.dispatchEvent(new CustomEvent('projectshelf:toggle-view'));
        },
      },
      {
        id: 'select-all',
        keyCombo: 'ctrl+a',
        handler: () => {
          if (activePage === 'projects') {
            document.dispatchEvent(new CustomEvent('projectshelf:select-all'));
          }
        },
      },
      {
        id: 'settings',
        keyCombo: 'ctrl+,',
        handler: () => setActivePage('settings'),
      },
      {
        id: 'manual',
        keyCombo: 'f1',
        handler: () => setActivePage('manual'),
      },
      {
        id: 'nav-dashboard',
        keyCombo: 'alt+1',
        handler: () => setActivePage('dashboard'),
      },
      {
        id: 'nav-projects',
        keyCombo: 'alt+2',
        handler: () => setActivePage('projects'),
      },
      {
        id: 'nav-launch-sets',
        keyCombo: 'alt+3',
        handler: () => setActivePage('launch-sets'),
      },
      {
        id: 'nav-settings',
        keyCombo: 'alt+4',
        handler: () => setActivePage('settings'),
      },
    ],
    [activePage, focusSearchInput]
  );

  useHotkeys(hotkeys);

  // Listen for custom events
  React.useEffect(() => {
    const showShortcuts = () => setShortcutsOpen(true);
    document.addEventListener('projectshelf:show-shortcuts', showShortcuts);
    return () => document.removeEventListener('projectshelf:show-shortcuts', showShortcuts);
  }, []);

  return (
    <>
      <AppShell
        activePage={activePage}
        onNavigate={setActivePage}
        pageTitle={PAGE_TITLES[activePage]}
      >
        {activePage === 'projects' && <ProjectsView />}
        {activePage === 'dashboard' && <DashboardView onNavigate={(p) => setActivePage(p as NavPage)} />}
        {activePage === 'launch-sets' && <LaunchSetsView />}
        {activePage === 'settings' && <SettingsView />}
        {activePage === 'manual' && <ManualView />}
      </AppShell>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <OnboardingModal />
    </>
  );
}

// ── App Entry Point ────────────────────────────────────────

import { LandingPage } from '@/components/landing/LandingPage';

export default function AppPage() {
  const [showApp, setShowApp] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Check if user has used the app before
    const hasLaunched = localStorage.getItem('projectshelf:launched');
    setShowApp(hasLaunched === 'true');
  }, []);

  const handleLaunchApp = React.useCallback(() => {
    localStorage.setItem('projectshelf:launched', 'true');
    setShowApp(true);
  }, []);

  // Loading state
  if (showApp === null) return null;

  // Landing page for first-time visitors
  if (!showApp) {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  // Main app
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
