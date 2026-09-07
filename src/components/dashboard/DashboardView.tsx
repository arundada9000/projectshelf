'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Command,
  Pin,
  Layers,
  Clock,
  LayoutDashboard,
  Play,
} from 'lucide-react';
import type { Project, LaunchSet, ShortcutDefinition } from '@/lib/db/schema';
import { getAllProjects, getAllLaunchSets, getAllShortcuts } from '@/lib/db';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import { APP_EVENTS, emitAppEvent } from '@/lib/actions';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import { Button } from '@/components/ui';
import styles from './Dashboard.module.css';

// ── Helpers ────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function shortenPath(path: string, maxLen = 42): string {
  if (!path) return 'No path saved';
  if (path.length <= maxLen) return path;
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.length <= 2) return path;
  return `.../${parts.slice(-2).join('/')}`;
}

// ── Dashboard ──────────────────────────────────────────────

export interface DashboardViewProps {
  onNavigate: (page: string) => void;
}

/**
 * The dashboard is a set of entry points into work, not a report.
 * Every element here either opens something or starts an action.
 */
export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [launchSets, setLaunchSets] = useState<LaunchSet[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllProjects(), getAllLaunchSets(), getAllShortcuts()])
      .then(([p, s, k]) => {
        setProjects(p);
        setLaunchSets(s);
        setShortcuts(k);
      })
      .catch(() => {
        setProjects([]);
        setLaunchSets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const keyFor = useCallback(
    (actionId: string) => {
      const combo = shortcuts.find((s) => s.actionId === actionId)?.keyCombo;
      return combo ? formatKeyCombo(combo) : '';
    },
    [shortcuts]
  );

  const goToProjects = useCallback(
    (then?: () => void) => {
      onNavigate('projects');
      if (then) setTimeout(then, 120);
    },
    [onNavigate]
  );

  if (loading) return null;

  if (projects.length === 0) {
    return (
      <div className={styles.emptyDashboard}>
        <LayoutDashboard size={44} className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>Nothing on the shelf yet</h2>
        <p className={styles.emptyDesc}>
          Add a project and this becomes your way back into it: what you touched last,
          what you pinned, and the sets you launch together. A name and a folder path is
          enough to start.
        </p>
        <Button
          variant="primary"
          icon={<Plus size={14} />}
          onClick={() => goToProjects(() => emitAppEvent(APP_EVENTS.createProject))}
        >
          Add your first project
        </Button>
      </div>
    );
  }

  const pinned = projects.filter((p) => p.isPinned);
  const recent = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  const recentSets = [...launchSets]
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, 4);

  const statusCounts = DEFAULT_STATUSES.map((status) => ({
    ...status,
    count: projects.filter((p) => p.status === status.id).length,
  })).filter((status) => status.count > 0);

  const renderProjectRow = (project: Project) => (
    <button
      key={project.id}
      type="button"
      className={styles.projectRow}
      onClick={() => goToProjects()}
    >
      <span className={styles.projectRowIcon}>
        {project.icon || project.name.charAt(0).toUpperCase()}
      </span>
      <span className={styles.projectRowInfo}>
        <span className={styles.projectRowName}>{project.name}</span>
        <span className={styles.projectRowPath}>{shortenPath(project.localPath)}</span>
      </span>
      <span className={styles.projectRowTime}>{formatRelativeTime(project.updatedAt)}</span>
    </button>
  );

  return (
    <div className={styles.dashboard}>
      {/* Quick actions */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Start</h2>
        </div>
        <div className={styles.quickActions}>
          <button
            type="button"
            className={styles.quickAction}
            onClick={() => goToProjects(() => emitAppEvent(APP_EVENTS.createProject))}
          >
            <span className={styles.quickActionIcon}>
              <Plus size={17} />
            </span>
            <span className={styles.quickActionLabel}>New project</span>
            <span className={styles.quickActionShortcut}>{keyFor('createProject')}</span>
          </button>

          <button
            type="button"
            className={styles.quickAction}
            onClick={() =>
              goToProjects(() => {
                const input = document.querySelector<HTMLInputElement>(
                  'input[role="searchbox"], input[placeholder*="Search"]'
                );
                input?.focus();
              })
            }
          >
            <span className={styles.quickActionIcon}>
              <Search size={17} />
            </span>
            <span className={styles.quickActionLabel}>Find a project</span>
            <span className={styles.quickActionShortcut}>{keyFor('focusSearch')}</span>
          </button>

          <button
            type="button"
            className={styles.quickAction}
            onClick={() => emitAppEvent(APP_EVENTS.showShortcuts)}
          >
            <span className={styles.quickActionIcon}>
              <Command size={17} />
            </span>
            <span className={styles.quickActionLabel}>All shortcuts</span>
            <span className={styles.quickActionShortcut}>{keyFor('showShortcuts')}</span>
          </button>

          <button
            type="button"
            className={styles.quickAction}
            onClick={() => onNavigate('launch-sets')}
          >
            <span className={styles.quickActionIcon}>
              <Layers size={17} />
            </span>
            <span className={styles.quickActionLabel}>Launch sets</span>
            <span className={styles.quickActionShortcut}>{keyFor('navLaunchSets')}</span>
          </button>
        </div>
      </section>

      {/* Pinned */}
      {pinned.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Pin size={14} className={styles.sectionTitleIcon} />
              Pinned
            </h2>
          </div>
          <div className={styles.projectRows}>{pinned.map(renderProjectRow)}</div>
        </section>
      )}

      {/* Recent */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Clock size={14} className={styles.sectionTitleIcon} />
            Recently updated
          </h2>
          <button
            type="button"
            className={styles.sectionAction}
            onClick={() => onNavigate('projects')}
          >
            View all
          </button>
        </div>
        <div className={styles.projectRows}>{recent.map(renderProjectRow)}</div>
      </section>

      {/* Launch sets */}
      {recentSets.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Layers size={14} className={styles.sectionTitleIcon} />
              Launch sets
            </h2>
            <button
              type="button"
              className={styles.sectionAction}
              onClick={() => onNavigate('launch-sets')}
            >
              View all
            </button>
          </div>
          <div className={styles.projectRows}>
            {recentSets.map((set) => (
              <button
                key={set.id}
                type="button"
                className={styles.projectRow}
                onClick={() => onNavigate('launch-sets')}
              >
                <span className={styles.projectRowIcon}>
                  <Play size={13} />
                </span>
                <span className={styles.projectRowInfo}>
                  <span className={styles.projectRowName}>{set.name}</span>
                  <span className={styles.projectRowPath}>
                    {set.projectIds.length} project{set.projectIds.length === 1 ? '' : 's'}
                  </span>
                </span>
                <span className={styles.projectRowTime}>
                  {set.lastUsedAt > 0 ? formatRelativeTime(set.lastUsedAt) : 'Not used yet'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Status filters: each one is a jump into a filtered list. */}
      {statusCounts.length > 1 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Jump to</h2>
          </div>
          <div className={styles.statusBreakdown}>
            {statusCounts.map((status) => (
              <button
                key={status.id}
                type="button"
                className={styles.statusItem}
                onClick={() =>
                  goToProjects(() => emitAppEvent(APP_EVENTS.filterStatus, status.id))
                }
              >
                <span
                  className={styles.statusDot}
                  style={{ backgroundColor: status.color }}
                />
                <span className={styles.statusLabel}>{status.label}</span>
                <span className={styles.statusCount}>{status.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
