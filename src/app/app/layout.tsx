'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Download, Upload } from 'lucide-react';
import { ToastProvider, useToast } from '@/components/ui';
import { AppShell, type NavPage } from '@/components/layout/AppShell';
import { CommandPalette, buildPaletteItems } from '@/components/features/CommandPalette';
import { ShortcutsModal } from '@/components/features/ShortcutsModal';
import { OnboardingModal } from '@/components/features/Onboarding';
import { useShortcuts, type ActionHandlers } from '@/lib/hooks/useShortcuts';
import { APP_EVENTS, emitAppEvent } from '@/lib/actions';
import { exportAllData, downloadJSON } from '@/lib/db/import-export';
import { getSettings } from '@/lib/db';
import { applyAppearance, startSystemThemeWatch } from '@/lib/appearance';
import { setSoundEnabled } from '@/lib/sound';
import { setHapticsEnabled } from '@/lib/haptics';

// ── Routes ─────────────────────────────────────────────────

const PAGE_ROUTES: Record<NavPage, string> = {
  dashboard: '/app/dashboard',
  projects: '/app/projects',
  'launch-sets': '/app/launch-sets',
  settings: '/app/settings',
  manual: '/app/manual',
};

const PAGE_TITLES: Record<NavPage, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  'launch-sets': 'Launch Sets',
  settings: 'Settings',
  manual: 'User Manual',
};

function pageFromPath(pathname: string): NavPage {
  const match = (Object.entries(PAGE_ROUTES) as [NavPage, string][]).find(
    ([, route]) => pathname.startsWith(route)
  );
  return match ? match[0] : 'projects';
}

// ── Shell ──────────────────────────────────────────────────

function AppFrame({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const activePage = pageFromPath(pathname);
  const activePageRef = useRef(activePage);
  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);

  const navigate = useCallback(
    (page: NavPage) => router.push(PAGE_ROUTES[page]),
    [router]
  );

  // ── Data actions ───────────────────────────────────────

  const handleExport = useCallback(async () => {
    try {
      downloadJSON(await exportAllData());
      toast('Backup downloaded', 'success');
    } catch {
      toast('Could not export your data', 'error');
    }
  }, [toast]);

  const handleImport = useCallback(() => {
    router.push(PAGE_ROUTES.settings);
    toast('Choose a backup file under Data', 'info');
  }, [router, toast]);

  // ── Action handlers ────────────────────────────────────

  const focusSearchInput = useCallback(() => {
    if (activePageRef.current !== 'projects') router.push(PAGE_ROUTES.projects);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[role="searchbox"], input[placeholder*="Search"]'
      );
      input?.focus();
      input?.select();
    }, 80);
  }, [router]);

  const actionHandlers = useMemo<ActionHandlers>(() => {
    // Project actions need the projects view mounted. Dispatch straight
    // away when it already is, and only wait when we had to navigate.
    const onProjectsPage = (run: () => void) => {
      if (activePageRef.current === 'projects') {
        run();
        return;
      }
      router.push(PAGE_ROUTES.projects);
      setTimeout(run, 120);
    };

    return {
      openCommandPalette: () => setPaletteOpen((prev) => !prev),
      focusSearch: focusSearchInput,
      showShortcuts: () => setShortcutsOpen((prev) => !prev),
      openSettings: () => router.push(PAGE_ROUTES.settings),
      openManual: () => router.push(PAGE_ROUTES.manual),

      createProject: () => onProjectsPage(() => emitAppEvent(APP_EVENTS.createProject)),
      selectAll: () => onProjectsPage(() => emitAppEvent(APP_EVENTS.selectAll)),
      clearSelection: () => emitAppEvent(APP_EVENTS.clearSelection),
      toggleView: () => onProjectsPage(() => emitAppEvent(APP_EVENTS.toggleView)),
      deleteSelected: () => emitAppEvent(APP_EVENTS.deleteSelected),

      openInEditor: () => emitAppEvent(APP_EVENTS.openInEditor),
      openInTerminal: () => emitAppEvent(APP_EVENTS.openInTerminal),
      openInExplorer: () => emitAppEvent(APP_EVENTS.openInExplorer),
      copyPaths: () => emitAppEvent(APP_EVENTS.copyPaths),
      copyCommands: () => emitAppEvent(APP_EVENTS.copyCommands),
      createLaunchSet: () => emitAppEvent(APP_EVENTS.createLaunchSet),

      navDashboard: () => router.push(PAGE_ROUTES.dashboard),
      navProjects: () => router.push(PAGE_ROUTES.projects),
      navLaunchSets: () => router.push(PAGE_ROUTES['launch-sets']),
      navSettings: () => router.push(PAGE_ROUTES.settings),
    };
  }, [router, focusSearchInput]);

  const { shortcuts } = useShortcuts(actionHandlers);

  // ── Command palette ────────────────────────────────────

  const paletteItems = useMemo(
    () =>
      buildPaletteItems({
        handlers: actionHandlers,
        shortcuts,
        selectionCount,
        extraItems: [
          {
            id: 'export-data',
            label: 'Export all data',
            icon: <Download size={16} />,
            section: 'Data',
            action: handleExport,
          },
          {
            id: 'import-data',
            label: 'Import a backup',
            icon: <Upload size={16} />,
            section: 'Data',
            action: handleImport,
          },
        ],
      }),
    [actionHandlers, shortcuts, selectionCount, handleExport, handleImport]
  );

  // ── Cross-component events ─────────────────────────────

  useEffect(() => {
    const showShortcuts = () => setShortcutsOpen(true);
    const onSelectionChange = (e: Event) =>
      setSelectionCount((e as CustomEvent<number>).detail ?? 0);

    document.addEventListener(APP_EVENTS.showShortcuts, showShortcuts);
    document.addEventListener(APP_EVENTS.selectionChanged, onSelectionChange);
    return () => {
      document.removeEventListener(APP_EVENTS.showShortcuts, showShortcuts);
      document.removeEventListener(APP_EVENTS.selectionChanged, onSelectionChange);
    };
  }, []);

  // ── Appearance ─────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const stopSystemWatch = startSystemThemeWatch();

    getSettings()
      .then((saved) => {
        if (cancelled) return;
        setSoundEnabled(saved.soundEnabled);
        setHapticsEnabled(saved.hapticsEnabled);
        applyAppearance({
          theme: saved.theme,
          font: saved.font,
          density: saved.density,
          fontSize: saved.fontSize,
          iconSize: saved.iconSize,
        });
      })
      .catch(() => {
        // The boot script already applied the last known appearance.
      });

    return () => {
      cancelled = true;
      stopSystemWatch();
    };
  }, []);

  return (
    <>
      <AppShell
        activePage={activePage}
        onNavigate={navigate}
        pageTitle={PAGE_TITLES[activePage]}
      >
        {children}
      </AppShell>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
      />

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <OnboardingModal />
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppFrame>{children}</AppFrame>
    </ToastProvider>
  );
}
