'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Keyboard,
  Settings,
  Layers,
  LayoutDashboard,
  Code2,
  Terminal,
} from 'lucide-react';
import type { Project } from '@/lib/db/schema';
import { getAllProjects } from '@/lib/db';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
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

function shortenPath(path: string, maxLen = 35): string {
  if (path.length <= maxLen) return path;
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.length <= 2) return path;
  return `.../${parts.slice(-2).join('/')}`;
}

// ── Quick Actions ──────────────────────────────────────────

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  action: () => void;
}

// ── Dashboard View ─────────────────────────────────────────

export interface DashboardViewProps {
  onNavigate: (page: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const quickActions: QuickAction[] = [
    {
      icon: <Plus size={18} />,
      label: 'New Project',
      shortcut: 'Ctrl+N',
      action: () => {
        onNavigate('projects');
        setTimeout(() => document.dispatchEvent(new CustomEvent('projectshelf:create-project')), 100);
      },
    },
    {
      icon: <Search size={18} />,
      label: 'Search Projects',
      shortcut: '/',
      action: () => {
        onNavigate('projects');
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('[role="searchbox"]');
          input?.focus();
        }, 100);
      },
    },
    {
      icon: <Keyboard size={18} />,
      label: 'Command Palette',
      shortcut: 'Ctrl+K',
      action: () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      },
    },
    {
      icon: <Settings size={18} />,
      label: 'Settings',
      shortcut: 'Ctrl+,',
      action: () => onNavigate('settings'),
    },
  ];

  // Stats
  const totalProjects = projects.length;
  const pinnedCount = projects.filter((p) => p.isPinned).length;
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const recentProjects = [...projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  // Status counts
  const statusCounts = DEFAULT_STATUSES.map((status) => ({
    ...status,
    count: projects.filter((p) => p.status === status.id).length,
  }));

  // Unique tags
  const allTags = new Set(projects.flatMap((p) => p.tags));

  if (loading) return null;

  if (projects.length === 0) {
    return (
      <div className={styles.emptyDashboard}>
        <LayoutDashboard size={48} className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>Welcome to ProjectShelf</h2>
        <p className={styles.emptyDesc}>
          Your dashboard will show project stats and quick actions once you add projects.
          Get started by adding your first project.
        </p>
        <Button
          variant="primary"
          icon={<Plus size={14} />}
          onClick={() => {
            onNavigate('projects');
            setTimeout(() => document.dispatchEvent(new CustomEvent('projectshelf:create-project')), 100);
          }}
        >
          Add First Project
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Projects</span>
          <span className={styles.statValue}>{totalProjects}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active</span>
          <span className={styles.statValue}>{activeCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pinned</span>
          <span className={styles.statValue}>{pinnedCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tags</span>
          <span className={styles.statValue}>{allTags.size}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
        </div>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={styles.quickAction}
              onClick={action.action}
            >
              <div className={styles.quickActionIcon}>{action.icon}</div>
              <span className={styles.quickActionLabel}>{action.label}</span>
              <span className={styles.quickActionShortcut}>{action.shortcut}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Projects</h3>
          <button
            type="button"
            className={styles.sectionAction}
            onClick={() => onNavigate('projects')}
          >
            View all →
          </button>
        </div>
        <div className={styles.recentGrid}>
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className={styles.recentCard}
              onClick={() => {
                onNavigate('projects');
                // Could dispatch event to select this project
              }}
            >
              <div className={styles.recentCardIcon}>
                {project.icon || project.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.recentCardInfo}>
                <div className={styles.recentCardName}>{project.name}</div>
                <div className={styles.recentCardPath}>{shortenPath(project.localPath)}</div>
              </div>
              <span className={styles.recentCardTime}>
                {formatRelativeTime(project.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>By Status</h3>
        </div>
        <div className={styles.statusBreakdown}>
          {statusCounts.map((status) => (
            <div
              key={status.id}
              className={styles.statusItem}
              onClick={() => onNavigate('projects')}
            >
              <span
                className={styles.statusDot}
                style={{ backgroundColor: status.color }}
              />
              <span className={styles.statusLabel}>{status.label}</span>
              <span className={styles.statusCount}>{status.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
