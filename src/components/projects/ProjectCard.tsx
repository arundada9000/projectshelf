'use client';

import React from 'react';
import {
  MoreHorizontal,
  Code2,
  Terminal,
  FolderOpen,
  Pin,
} from 'lucide-react';
import type { Project } from '@/lib/db/schema';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import { Checkbox, Tag } from '@/components/ui';
import styles from './ProjectCard.module.css';

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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function shortenPath(path: string, maxLen = 40): string {
  if (path.length <= maxLen) return path;
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.length <= 3) return path;
  return `.../${parts.slice(-3).join('/')}`;
}

// ── Project Card (Grid View) ───────────────────────────────

export interface ProjectCardProps {
  project: Project;
  selected: boolean;
  onSelect: (id: string, multi: boolean, shift?: boolean) => void;
  onOpen: (project: Project) => void;
  onContextMenu?: (e: React.MouseEvent, project: Project) => void;
  onQuickAction?: (action: string, project: Project) => void;
  onTagClick?: (tag: string) => void;
}

export function ProjectCard({
  project,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  onQuickAction,
  onTagClick,
}: ProjectCardProps) {
  const status = DEFAULT_STATUSES.find((s) => s.id === project.status);

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect(project.id, true, false);
    } else if (e.shiftKey) {
      onSelect(project.id, true, true);
    } else if (e.detail === 2) {
      onOpen(project);
    } else {
      onSelect(project.id, false, false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, project);
  };

  return (
    <div
      className={`${styles.card} ${selected ? styles.cardSelected : ''} ${project.isPinned ? styles.cardPinned : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(project);
        if (e.key === ' ') { e.preventDefault(); onSelect(project.id, e.ctrlKey); }
      }}
    >
      {/* Checkbox */}
      <div className={styles.cardCheckbox}>
        <Checkbox
          checked={selected}
          onChange={() => onSelect(project.id, true)}
        />
      </div>

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          {project.icon || project.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>
            {project.isPinned && <Pin size={11} style={{ display: 'inline', marginRight: 4, opacity: 0.5 }} />}
            {project.name}
          </div>
          <div className={styles.cardPath}>{shortenPath(project.localPath)}</div>
        </div>
        <button
          type="button"
          className={styles.cardMenuBtn}
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e);
          }}
          aria-label="More actions"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Description */}
      {project.description && (
        <p className={styles.cardDescription}>{project.description}</p>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div
          className={styles.cardTags}
          onClick={(e) => e.stopPropagation()}
        >
          {project.tags.slice(0, 3).map((tag) => (
            <Tag
              key={tag}
              onClick={() => onTagClick?.(tag)}
            >
              {tag}
            </Tag>
          ))}
          {project.tags.length > 3 && (
            <Tag>+{project.tags.length - 3}</Tag>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.cardStatus}>
          <span
            className={styles.cardStatusDot}
            style={{ backgroundColor: status?.color ?? 'var(--color-text-muted)' }}
          />
          <span className={styles.cardStatusLabel}>{status?.label ?? project.status}</span>
        </div>

        {/* Quick actions (hover only) */}
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.cardActionBtn}
            title="Open in editor"
            onClick={(e) => { e.stopPropagation(); onQuickAction?.('editor', project); }}
          >
            <Code2 size={13} />
          </button>
          <button
            type="button"
            className={styles.cardActionBtn}
            title="Open terminal"
            onClick={(e) => { e.stopPropagation(); onQuickAction?.('terminal', project); }}
          >
            <Terminal size={13} />
          </button>
          <button
            type="button"
            className={styles.cardActionBtn}
            title="Open folder"
            onClick={(e) => { e.stopPropagation(); onQuickAction?.('explorer', project); }}
          >
            <FolderOpen size={13} />
          </button>
        </div>

        <span className={styles.cardMeta}>
          {formatRelativeTime(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

// ── Project Row (List View) ────────────────────────────────

export interface ProjectRowProps {
  project: Project;
  selected: boolean;
  onSelect: (id: string, multi: boolean, shift?: boolean) => void;
  onOpen: (project: Project) => void;
  onContextMenu?: (e: React.MouseEvent, project: Project) => void;
  onQuickAction?: (action: string, project: Project) => void;
  onTagClick?: (tag: string) => void;
}

export function ProjectRow({
  project,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  onQuickAction,
  onTagClick,
}: ProjectRowProps) {
  const status = DEFAULT_STATUSES.find((s) => s.id === project.status);

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect(project.id, true, false);
    } else if (e.shiftKey) {
      onSelect(project.id, true, true);
    } else if (e.detail === 2) {
      onOpen(project);
    } else {
      onSelect(project.id, false, false);
    }
  };

  return (
    <div
      className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, project);
      }}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(project);
        if (e.key === ' ') { e.preventDefault(); onSelect(project.id, e.ctrlKey); }
      }}
    >
      <div className={styles.rowCheckbox}>
        <Checkbox
          checked={selected}
          onChange={() => onSelect(project.id, true)}
        />
      </div>

      <div className={styles.rowIcon}>
        {project.icon || project.name.charAt(0).toUpperCase()}
      </div>

      <div className={styles.rowMain}>
        <span className={styles.rowName}>{project.name}</span>
        <span className={styles.rowPath}>{shortenPath(project.localPath, 60)}</span>
      </div>

      {project.tags.length > 0 && (
        <div
          className={styles.rowTags}
          onClick={(e) => e.stopPropagation()}
        >
          {project.tags.slice(0, 2).map((tag) => (
            <Tag
              key={tag}
              onClick={() => onTagClick?.(tag)}
            >
              {tag}
            </Tag>
          ))}
          {project.tags.length > 2 && <Tag>+{project.tags.length - 2}</Tag>}
        </div>
      )}

      <div className={styles.rowStatus}>
        <span
          className={styles.cardStatusDot}
          style={{ backgroundColor: status?.color ?? 'var(--color-text-muted)' }}
        />
        <span className={styles.cardStatusLabel}>{status?.label ?? project.status}</span>
      </div>

      <span className={styles.rowMeta}>
        {formatRelativeTime(project.updatedAt)}
      </span>

      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.cardActionBtn}
          title="Open in editor"
          onClick={(e) => { e.stopPropagation(); onQuickAction?.('editor', project); }}
        >
          <Code2 size={13} />
        </button>
        <button
          type="button"
          className={styles.cardActionBtn}
          title="Open terminal"
          onClick={(e) => { e.stopPropagation(); onQuickAction?.('terminal', project); }}
        >
          <Terminal size={13} />
        </button>
      </div>
    </div>
  );
}
