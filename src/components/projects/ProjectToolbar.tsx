'use client';

import React from 'react';
import {
  Plus,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
  X,
  Code2,
  Terminal,
  FolderOpen,
  Trash2,
  Copy,
  Layers,
  FolderArchive,
} from 'lucide-react';
import type { ViewMode, SortField, SortDirection, ProjectStatus } from '@/lib/db/schema';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import {
  SearchInput,
  Button,
  IconButton,
  SegmentedControl,
  Tag,
} from '@/components/ui';
import { DropdownMenu } from '@/components/ui';
import type { MenuEntry } from '@/components/ui';
import styles from './ProjectToolbar.module.css';

// ── Sort Options ───────────────────────────────────────────

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'localPath', label: 'Path' },
];

// ── Project Toolbar ────────────────────────────────────────

export interface ProjectToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  statusFilter: ProjectStatus | null;
  onStatusFilterChange: (status: ProjectStatus | null) => void;
  totalCount: number;
  filteredCount: number;
  onCreateProject: () => void;
}

export function ProjectToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortField,
  sortDirection,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  filteredCount,
  onCreateProject,
}: ProjectToolbarProps) {
  const sortMenuItems: MenuEntry[] = [
    { type: 'label', label: 'Sort By' },
    ...SORT_OPTIONS.map((opt) => ({
      id: `sort-${opt.value}`,
      label: opt.label,
      icon: sortField === opt.value ? (
        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
      ) : undefined,
      onClick: () => {
        if (sortField === opt.value) {
          onSortChange(opt.value, sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          onSortChange(opt.value, 'desc');
        }
      },
    })),
  ];

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortField);

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <SearchInput
          value={search}
          onValueChange={onSearchChange}
          className={styles.toolbarSearch}
          shortcutHint="/"
        />

        {/* Status filter chips */}
        <div className={styles.filterChips}>
          {DEFAULT_STATUSES.map((status) => (
            <Tag
              key={status.id}
              active={statusFilter === status.id}
              onClick={() =>
                onStatusFilterChange(statusFilter === status.id ? null : status.id)
              }
            >
              {status.label}
            </Tag>
          ))}
        </div>
      </div>

      <div className={styles.toolbarRight}>
        <span className={styles.toolbarCount}>
          {filteredCount === totalCount
            ? `${totalCount} projects`
            : `${filteredCount} of ${totalCount}`}
        </span>

        <div className={styles.toolbarDivider} />

        <DropdownMenu
          items={sortMenuItems}
          trigger={
            <Button variant="ghost" size="sm">
              {sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
              {currentSort?.label ?? 'Sort'}
            </Button>
          }
        />

        <SegmentedControl
          options={[
            { value: 'grid' as ViewMode, label: '', icon: <LayoutGrid size={14} /> },
            { value: 'list' as ViewMode, label: '', icon: <List size={14} /> },
          ]}
          value={viewMode}
          onChange={onViewModeChange}
        />

        <div className={styles.toolbarDivider} />

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onCreateProject}
        >
          New Project
        </Button>
      </div>
    </div>
  );
}

// ── Selection Toolbar (floating bar) ───────────────────────

export interface SelectionToolbarProps {
  count: number;
  onClear: () => void;
  onOpenInEditor: () => void;
  onOpenInTerminal: () => void;
  onOpenInExplorer: () => void;
  onCopyPaths: () => void;
  onCreateLaunchSet: () => void;
  onBulkStatus: () => void;
  onDelete: () => void;
}

export function SelectionToolbar({
  count,
  onClear,
  onOpenInEditor,
  onOpenInTerminal,
  onOpenInExplorer,
  onCopyPaths,
  onCreateLaunchSet,
  onBulkStatus,
  onDelete,
}: SelectionToolbarProps) {
  if (count === 0) return null;

  return (
    <div className={styles.selectionBar}>
      <span className={styles.selectionCount}>
        {count} selected
      </span>
      <div className={styles.selectionActions}>
        <IconButton size="sm" label="Open in editor (Ctrl+E)" onClick={onOpenInEditor}>
          <Code2 size={15} />
        </IconButton>
        <IconButton size="sm" label="Open terminal (Ctrl+T)" onClick={onOpenInTerminal}>
          <Terminal size={15} />
        </IconButton>
        <IconButton size="sm" label="Open folder (Ctrl+Shift+E)" onClick={onOpenInExplorer}>
          <FolderOpen size={15} />
        </IconButton>
        <IconButton size="sm" label="Copy paths (Ctrl+Shift+C)" onClick={onCopyPaths}>
          <Copy size={15} />
        </IconButton>
        <IconButton size="sm" label="Create launch set (Ctrl+Shift+L)" onClick={onCreateLaunchSet}>
          <Layers size={15} />
        </IconButton>
        <IconButton size="sm" label="Change status" onClick={onBulkStatus}>
          <FolderArchive size={15} />
        </IconButton>
        <IconButton size="sm" label="Delete (Del)" onClick={onDelete}>
          <Trash2 size={15} />
        </IconButton>
      </div>
      <IconButton
        size="sm"
        label="Clear selection (Esc)"
        onClick={onClear}
        className={styles.selectionClose}
      >
        <X size={15} />
      </IconButton>
    </div>
  );
}
