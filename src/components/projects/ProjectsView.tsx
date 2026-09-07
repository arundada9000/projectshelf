'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  FolderArchive,
  Code2,
  Terminal,
  FolderOpen,
  Copy,
  ExternalLink,
  Pencil,
  Pin,
  Trash2,
  Plus,
  Search,
  LayoutGrid,
  List,
  Keyboard,
  CheckSquare,
  CopyPlus,
  RefreshCw,
  X,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import menuStyles from '@/components/ui/ContextMenu.module.css';
import type {
  Project,
  ViewMode,
  SortField,
  SortDirection,
  ProjectStatus,
  UserSettings,
  ShortcutDefinition,
} from '@/lib/db/schema';
import {
  getAllProjects,
  addProject,
  updateProject,
  deleteProjects,
  getSettings,
  updateSettings,
  addLaunchSet,
  getAllShortcuts,
} from '@/lib/db';
import type { LaunchSet } from '@/lib/db/schema';
import { useToast, Modal, CommandPreview, Button } from '@/components/ui';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import { copyText } from '@/lib/clipboard';
import {
  applyFilters,
  hasActiveFilters,
  EMPTY_FILTERS,
  type ProjectFilters,
} from '@/lib/filters';
import { APP_EVENTS, emitAppEvent } from '@/lib/actions';
import { playSound } from '@/lib/sound';
import {
  loadToolContext,
  buildCommandForProject,
  buildCommandsForSelection,
  toolChoices,
  resolveToolId,
  findToolName,
  protocolUrlFor,
  type ToolContext,
  type ToolKind,
} from '@/lib/commands/resolver';
import { ProjectCard, ProjectRow } from './ProjectCard';
import { ProjectToolbar, SelectionToolbar } from './ProjectToolbar';
import { ProjectModal } from './ProjectModal';
import { BulkStatusModal } from './BulkStatusModal';
import { BatchCommandModal } from './BatchCommandModal';
import { LaunchSetModal } from '@/components/launch-sets/LaunchSetsView';
import { useLoadOnMount } from '@/lib/hooks/useLoadOnMount';
import styles from './ProjectToolbar.module.css';

// ── Sorting ────────────────────────────────────────────────

function sortProjects(
  projects: Project[],
  field: SortField,
  direction: SortDirection
): Project[] {
  const sorted = [...projects].sort((a, b) => {
    // Pinned projects always first
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

    let cmp = 0;
    switch (field) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'updatedAt':
        cmp = a.updatedAt - b.updatedAt;
        break;
      case 'createdAt':
        cmp = a.createdAt - b.createdAt;
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'localPath':
        cmp = a.localPath.localeCompare(b.localPath);
        break;
      default:
        cmp = 0;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

/** Wording used when no tool of a kind is configured. */
const KIND_LABELS: Record<ToolKind, string> = {
  editor: 'editor',
  terminal: 'terminal',
  'file-manager': 'file manager',
};

/** The three tool-backed actions offered on a project. */
const TOOL_ACTIONS: {
  kind: ToolKind;
  action: string;
  actionId: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { kind: 'editor', action: 'editor', actionId: 'openInEditor', icon: Code2 },
  { kind: 'terminal', action: 'terminal', actionId: 'openInTerminal', icon: Terminal },
  {
    kind: 'file-manager',
    action: 'explorer',
    actionId: 'openInExplorer',
    icon: FolderOpen,
  },
];

function clampContextMenuPos(clientX: number, clientY: number) {
  if (typeof window === 'undefined') return { x: clientX, y: clientY };
  const menuWidth = 240;
  const menuHeight = 360;
  const x = Math.max(10, Math.min(clientX, window.innerWidth - menuWidth - 16));
  const y = Math.max(10, Math.min(clientY, window.innerHeight - menuHeight - 16));
  return { x, y };
}

// ── Projects View ──────────────────────────────────────────

export function ProjectsView() {
  const { toast } = useToast();

  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Every configurable terminal, editor, tool, and command. Commands are
  // generated from this rather than from anything hardcoded here.
  const [toolContext, setToolContext] = useState<ToolContext | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [launchSetModalOpen, setLaunchSetModalOpen] = useState(false);
  const [batchCommandModalOpen, setBatchCommandModalOpen] = useState(false);

  // Project awaiting a one-time "Open with" choice.
  const [openWithFor, setOpenWithFor] = useState<Project | null>(null);
  // Projects pending a delete confirmation.
  const [confirmDelete, setConfirmDelete] = useState<Project[] | null>(null);
  // Shown when the clipboard is unavailable, so the text is never lost.
  const [manualCopy, setManualCopy] = useState<{ title: string; lines: string[] } | null>(
    null
  );
  // Live key bindings, so menus show the user's actual shortcuts.
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'project' | 'page';
    project?: Project;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // ── Load Data ──────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [loadedProjects, loadedSettings, context, loadedShortcuts] =
        await Promise.all([
          getAllProjects(),
          getSettings(),
          loadToolContext(),
          getAllShortcuts(),
        ]);
      setProjects(loadedProjects);
      setSettings(loadedSettings);
      setToolContext(context);
      setShortcuts(loadedShortcuts);
      setViewMode(loadedSettings.defaultView);
      setSortField(loadedSettings.sortField);
      setSortDirection(loadedSettings.sortDirection);
    } catch {
      toast('Could not load your projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useLoadOnMount(loadData);

  // ── Filtering & Sorting ────────────────────────────────

  const filtered = useMemo(() => {
    let result = projects;

    if (search.trim()) {
      const q = search.toLowerCase();
      // Every field a project can be recognised by, so searching a path
      // fragment, a repo URL, or a status all work.
      result = result.filter((p) =>
        [
          p.name,
          p.description,
          p.localPath,
          p.githubUrl,
          p.hostedUrl,
          p.status,
          p.tech,
          p.language,
          p.notes,
          ...p.tags,
        ].some((field) => field?.toLowerCase().includes(q))
      );
    }

    result = applyFilters(result, filters);

    return sortProjects(result, sortField, sortDirection);
  }, [projects, search, filters, sortField, sortDirection]);

  // ── Selection Logic ────────────────────────────────────

  const handleSelect = useCallback(
    (id: string, multi: boolean, shift?: boolean) => {
      setSelectedIds((prev) => {
        if (shift && lastSelectedId) {
          const idx1 = filtered.findIndex((p) => p.id === lastSelectedId);
          const idx2 = filtered.findIndex((p) => p.id === id);
          if (idx1 !== -1 && idx2 !== -1) {
            const start = Math.min(idx1, idx2);
            const end = Math.max(idx1, idx2);
            const next = new Set(prev);
            for (let i = start; i <= end; i++) {
              next.add(filtered[i].id);
            }
            return next;
          }
        }

        const next = new Set(multi ? prev : []);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastSelectedId(id);
    },
    [filtered, lastSelectedId]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  /** The user's current key for an action, formatted for display. */
  const shortcutFor = useCallback(
    (actionId: string) => {
      const combo = shortcuts.find((s) => s.actionId === actionId)?.keyCombo;
      return combo ? formatKeyCombo(combo) : '';
    },
    [shortcuts]
  );

  // ── CRUD ───────────────────────────────────────────────

  const handleSaveProject = useCallback(
    async (project: Project) => {
      try {
        const existing = projects.find((p) => p.id === project.id);
        if (existing) {
          await updateProject(project);
          toast('Project updated', 'success');
          playSound('save');
        } else {
          await addProject(project);
          toast('Project added', 'success');
          playSound('added');
        }
        await loadData();
      } catch {
        toast('Failed to save project', 'error');
        playSound('error');
      }
    },
    [projects, loadData, toast]
  );

  const handleRenameProject = useCallback(
    async (id: string, name: string) => {
      const project = projects.find((p) => p.id === id);
      if (!project || project.name === name) return;
      try {
        await updateProject({ ...project, name, updatedAt: Date.now() });
        toast('Project renamed', 'success');
        await loadData();
      } catch {
        toast('Could not rename project', 'error');
      }
    },
    [projects, loadData, toast]
  );

  /** Remove projects for real. Callers decide whether to confirm first. */
  const performDelete = useCallback(
    async (targets: Project[]) => {
      if (targets.length === 0) return;
      try {
        await deleteProjects(targets.map((p) => p.id));
        toast(
          targets.length === 1
            ? `Deleted ${targets[0].name}`
            : `Deleted ${targets.length} projects`,
          'success'
        );
        playSound('removed');
        clearSelection();
        await loadData();
      } catch {
        toast('Could not delete', 'error');
        playSound('error');
      }
    },
    [clearSelection, loadData, toast]
  );

  /** Ask first when the user has confirmations switched on. */
  const requestDelete = useCallback(
    (targets: Project[]) => {
      if (targets.length === 0) return;
      if (settings?.confirmDestructive) setConfirmDelete(targets);
      else performDelete(targets);
    },
    [settings, performDelete]
  );

  const handleDeleteSelected = useCallback(() => {
    requestDelete(projects.filter((p) => selectedIds.has(p.id)));
  }, [projects, selectedIds, requestDelete]);

  const handleOpenProject = useCallback((project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  }, []);

  const handleCreateProject = useCallback(() => {
    setEditingProject(null);
    setModalOpen(true);
  }, []);

  // Keep the shell informed so the command palette can enable or disable
  // selection actions.
  useEffect(() => {
    emitAppEvent(APP_EVENTS.selectionChanged, selectedIds.size);
  }, [selectedIds]);

  // ── Quick Actions ──────────────────────────────────────

  // ── Quick Actions ──────────────────────────────────────
  // Everything here is generated from the user's configuration. No command
  // text is hardcoded, so editing a terminal or command in settings changes
  // what these produce.

  const runToolAction = useCallback(
    (kind: ToolKind, project: Project, oneTimeToolId?: string) => {
      if (!toolContext) return;

      if (!project.localPath) {
        toast(`${project.name} has no local path saved`, 'error');
        return;
      }

      const built = buildCommandForProject(kind, toolContext, project, oneTimeToolId);
      if (!built) {
        toast(`No ${KIND_LABELS[kind]} is configured. Add one in Settings.`, 'error');
        return;
      }

      // Where the tool registers a URL scheme, hand the project straight over.
      const protocolUrl =
        kind === 'editor' ? protocolUrlFor(built.toolId, project) : null;
      if (protocolUrl) window.open(protocolUrl);

      copyText(built.text).then((copied) => {
        if (copied) {
          toast(
            protocolUrl
              ? `Opening ${project.name} in ${built.toolName}. Command copied as a fallback.`
              : `Copied ${built.toolName} command: ${built.text}`,
            'success'
          );
        } else {
          // Clipboard refused: show the command so it can still be used.
          setManualCopy({ title: `${built.toolName} command`, lines: [built.text] });
        }
      });
    },
    [toolContext, toast]
  );

  const handleQuickAction = useCallback(
    (action: string, project: Project) => {
      if (action === 'editor' || action === 'terminal' || action === 'explorer') {
        runToolAction(action === 'explorer' ? 'file-manager' : action, project);
        return;
      }

      if (action === 'github') {
        if (project.githubUrl) {
          window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast('No repository link saved for this project', 'info');
        }
        return;
      }

      if (action === 'hosted') {
        if (project.hostedUrl) {
          window.open(project.hostedUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast('No hosted link saved for this project', 'info');
        }
      }
    },
    [runToolAction, toast]
  );

  const selectedProjects = useMemo(
    () => projects.filter((p) => selectedIds.has(p.id)),
    [projects, selectedIds]
  );

  const handleCopyPaths = useCallback(() => {
    const paths = selectedProjects.map((p) => p.localPath).filter(Boolean);
    if (paths.length === 0) {
      toast('None of the selected projects have a local path saved', 'error');
      return;
    }
    copyText(paths.join('\n')).then((copied) => {
      if (copied) {
        toast(`Copied ${paths.length} path${paths.length === 1 ? '' : 's'}`, 'success');
      } else {
        setManualCopy({ title: 'Project paths', lines: paths });
      }
    });
  }, [selectedProjects, toast]);

  /** Generate one command per selected project, using configured tools. */
  const runSelectionAction = useCallback(
    (kind: ToolKind, oneTimeToolId?: string) => {
      if (!toolContext) return;

      const withPaths = selectedProjects.filter((p) => p.localPath);
      if (withPaths.length === 0) {
        toast('None of the selected projects have a local path saved', 'error');
        return;
      }

      const built = buildCommandsForSelection(kind, toolContext, withPaths, oneTimeToolId);
      if (!built) {
        toast(`No ${KIND_LABELS[kind]} is configured. Add one in Settings.`, 'error');
        return;
      }

      copyText(built.lines.join('\n')).then((copied) => {
        if (copied) {
          toast(
            `Copied ${built.toolName} commands for ${built.lines.length} project${
              built.lines.length === 1 ? '' : 's'
            }`,
            'success'
          );
        } else {
          // Clipboard refused: show the text so it is never lost.
          setManualCopy({ title: `${built.toolName} commands`, lines: built.lines });
        }
      });
    },
    [toolContext, selectedProjects, toast]
  );

  const handleOpenSelectedInEditor = useCallback(
    (oneTimeToolId?: string) => runSelectionAction('editor', oneTimeToolId),
    [runSelectionAction]
  );

  const handleOpenSelectedInTerminal = useCallback(
    (oneTimeToolId?: string) => runSelectionAction('terminal', oneTimeToolId),
    [runSelectionAction]
  );

  const handleOpenSelectedInExplorer = useCallback(
    (oneTimeToolId?: string) => runSelectionAction('file-manager', oneTimeToolId),
    [runSelectionAction]
  );

  const handleApplyBulkStatus = useCallback(
    async (status: ProjectStatus) => {
      const ids = Array.from(selectedIds);
      try {
        await Promise.all(
          ids.map(async (id) => {
            const p = projects.find((proj) => proj.id === id);
            if (p) {
              await updateProject({ ...p, status, updatedAt: Date.now() });
            }
          })
        );
        toast(`Updated status to "${status}" for ${ids.length} project(s)`, 'success');
        clearSelection();
        await loadData();
      } catch {
        toast('Failed to update project status', 'error');
      }
    },
    [selectedIds, projects, clearSelection, loadData, toast]
  );

  const handleSaveLaunchSet = useCallback(
    async (set: LaunchSet) => {
      try {
        await addLaunchSet(set);
        toast(`Launch set "${set.name}" created!`, 'success');
        setLaunchSetModalOpen(false);
        clearSelection();
      } catch {
        toast('Failed to create launch set', 'error');
      }
    },
    [clearSelection, toast]
  );

  // ── Sort Change ────────────────────────────────────────

  const handleSortChange = useCallback(
    async (field: SortField, direction: SortDirection) => {
      setSortField(field);
      setSortDirection(direction);
      await updateSettings({ sortField: field, sortDirection: direction });
    },
    []
  );

  const handleViewModeChange = useCallback(
    async (mode: ViewMode) => {
      setViewMode(mode);
      await updateSettings({ defaultView: mode });
    },
    []
  );

  // ── Context Menu Actions ───────────────────────────────

  const handleProjectContextMenu = useCallback((e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = clampContextMenuPos(e.clientX, e.clientY);
    setContextMenu({ ...pos, type: 'project', project });
  }, []);

  const handlePageContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, button')) return;
    e.preventDefault();
    const pos = clampContextMenuPos(e.clientX, e.clientY);
    setContextMenu({ ...pos, type: 'page' });
  }, []);

  const handleTogglePin = useCallback(
    async (project: Project) => {
      try {
        const updated = { ...project, isPinned: !project.isPinned, updatedAt: Date.now() };
        await updateProject(updated);
        toast(updated.isPinned ? `Pinned "${project.name}"` : `Unpinned "${project.name}"`, 'info');
        await loadData();
      } catch {
        toast('Failed to update pin status', 'error');
      }
    },
    [loadData, toast]
  );

  const handleDuplicateProject = useCallback(
    async (project: Project) => {
      try {
        const clone: Project = {
          ...project,
          id: crypto.randomUUID(),
          name: `${project.name} (Copy)`,
          isPinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await addProject(clone);
        toast(`Duplicated "${project.name}"`, 'success');
        await loadData();
      } catch {
        toast('Failed to duplicate project', 'error');
      }
    },
    [loadData, toast]
  );

  const handleDeleteSingleProject = useCallback(
    (project: Project) => requestDelete([project]),
    [requestDelete]
  );

  const handleCopySinglePath = useCallback(
    (project: Project) => {
      if (!project.localPath) {
        toast('No local path configured', 'error');
        return;
      }
      copyText(project.localPath).then((copied) => {
        if (copied) toast(`Copied ${project.localPath}`, 'success');
        else setManualCopy({ title: 'Project path', lines: [project.localPath] });
      });
    },
    [toast]
  );

  const handleTagClick = useCallback((tag: string) => {
    setSearch((prev) => (prev.toLowerCase() === tag.toLowerCase() ? '' : tag));
  }, []);

  // ── Global Action Events ───────────────────────────────
  // Shortcuts and the command palette reach the selection through these,
  // so a key binding and a toolbar button run identical code.

  // The handler map is rebuilt on every render but kept behind a ref, so the
  // document listeners are attached exactly once for the component's lifetime.
  // Re-attaching them on every dependency change was losing events.
  const eventHandlersRef = useRef<Record<string, (e: Event) => void>>({});

  const eventHandlers: Record<string, (e: Event) => void> = {
    [APP_EVENTS.createProject]: handleCreateProject,
    [APP_EVENTS.selectAll]: () => setSelectedIds(new Set(filtered.map((p) => p.id))),
    [APP_EVENTS.clearSelection]: clearSelection,
    [APP_EVENTS.deleteSelected]: handleDeleteSelected,
    [APP_EVENTS.openInEditor]: () => handleOpenSelectedInEditor(),
    [APP_EVENTS.openInTerminal]: () => handleOpenSelectedInTerminal(),
    [APP_EVENTS.openInExplorer]: () => handleOpenSelectedInExplorer(),
    [APP_EVENTS.copyPaths]: handleCopyPaths,
    [APP_EVENTS.copyCommands]: () => {
      if (selectedIds.size === 0) {
        toast('Select at least one project first', 'info');
        return;
      }
      setBatchCommandModalOpen(true);
    },
    [APP_EVENTS.createLaunchSet]: () => {
      if (selectedIds.size === 0) {
        toast('Select at least one project first', 'info');
        return;
      }
      setLaunchSetModalOpen(true);
    },
    [APP_EVENTS.toggleView]: () => {
      handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid');
    },
    [APP_EVENTS.filterStatus]: (e: Event) => {
      const detail = (e as CustomEvent<ProjectStatus>).detail;
      if (detail) setFilters({ ...EMPTY_FILTERS, statuses: [detail] });
    },
  };

  // Refreshed after every render so the listeners always call current closures.
  useEffect(() => {
    eventHandlersRef.current = eventHandlers;
  });

  useEffect(() => {
    const names = Object.values(APP_EVENTS);
    const dispatch = (e: Event) => eventHandlersRef.current[e.type]?.(e);

    for (const name of names) {
      document.addEventListener(name, dispatch);
    }
    return () => {
      for (const name of names) {
        document.removeEventListener(name, dispatch);
      }
    };
  }, []);

  // Close context menu on Escape or click outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu]);

  // Focus first button when menu opens
  useEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const first = contextMenuRef.current.querySelector<HTMLButtonElement>('button:not(:disabled)');
      first?.focus();
    }
  }, [contextMenu]);

  const handleContextMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!contextMenuRef.current) return;
    const buttons = Array.from(
      contextMenuRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    );
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
      buttons[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
      buttons[prev]?.focus();
    }
  }, []);

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading projects...</p>
      </div>
    );
  }

  return (
    <div
      onContextMenu={handlePageContextMenu}
      style={{ minHeight: '100%', position: 'relative' }}
    >
      <ProjectToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        filters={filters}
        onFiltersChange={setFilters}
        allProjects={projects}
        totalCount={projects.length}
        filteredCount={filtered.length}
        onCreateProject={handleCreateProject}
      />

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <FolderArchive size={48} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>
            {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
          </h2>
          <p className={styles.emptyDescription}>
            {projects.length === 0
              ? 'A name and a folder path is enough to start. Everything else can come later.'
              : search.trim() || hasActiveFilters(filters)
                ? 'Nothing matches the current search and filters.'
                : 'No projects to show.'}
          </p>
          {projects.length === 0 ? (
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={handleCreateProject}
            >
              Add your first project
            </Button>
          ) : (
            (search.trim() || hasActiveFilters(filters)) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFilters(EMPTY_FILTERS);
                }}
              >
                Clear search and filters
              </Button>
            )
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.projectGrid} role="listbox" aria-multiselectable="true">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              selected={selectedIds.has(project.id)}
              onSelect={handleSelect}
              onOpen={handleOpenProject}
              onContextMenu={handleProjectContextMenu}
              onQuickAction={handleQuickAction}
              onTagClick={handleTagClick}
              onRename={handleRenameProject}
            />
          ))}
        </div>
      ) : (
        <ProjectVirtualList
          projects={filtered}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onOpen={handleOpenProject}
          onContextMenu={handleProjectContextMenu}
          onQuickAction={handleQuickAction}
          onTagClick={handleTagClick}
          onRename={handleRenameProject}
        />
      )}

      <SelectionToolbar
        count={selectedIds.size}
        onClear={clearSelection}
        onOpenInEditor={handleOpenSelectedInEditor}
        onOpenInTerminal={handleOpenSelectedInTerminal}
        onOpenInExplorer={handleOpenSelectedInExplorer}
        onCopyPaths={handleCopyPaths}
        onCreateLaunchSet={() => setLaunchSetModalOpen(true)}
        onBulkStatus={() => setBulkStatusOpen(true)}
        onBatchCommands={() => setBatchCommandModalOpen(true)}
        onDelete={handleDeleteSelected}
      />

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />

      <BulkStatusModal
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        count={selectedIds.size}
        onApply={handleApplyBulkStatus}
      />

      <LaunchSetModal
        open={launchSetModalOpen}
        onClose={() => setLaunchSetModalOpen(false)}
        onSave={handleSaveLaunchSet}
        projects={projects}
        defaultProjectIds={Array.from(selectedIds)}
      />

      <BatchCommandModal
        open={batchCommandModalOpen}
        onClose={() => setBatchCommandModalOpen(false)}
        projects={selectedProjects}
      />

      {/* Deleting is not reversible, so it confirms unless the user has
          turned confirmations off in Settings. */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={
          confirmDelete?.length === 1
            ? `Delete ${confirmDelete[0].name}?`
            : `Delete ${confirmDelete?.length ?? 0} projects?`
        }
        description="This removes them from ProjectShelf. Nothing on your drive is touched."
        size="narrow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) performDelete(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {confirmDelete && confirmDelete.length > 1 && (
          <ul className={styles.confirmList}>
            {confirmDelete.slice(0, 8).map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
            {confirmDelete.length > 8 && (
              <li>and {confirmDelete.length - 8} more</li>
            )}
          </ul>
        )}
      </Modal>

      {/* Clipboard fallback. The generated text is the product here, so it
          is shown for manual selection rather than reported as a failure. */}
      <Modal
        open={manualCopy !== null}
        onClose={() => setManualCopy(null)}
        title={manualCopy?.title ?? 'Generated command'}
        description="Your browser blocked the clipboard. Select the text below to copy it."
        size="default"
      >
        {manualCopy && (
          <CommandPreview
            title={manualCopy.title}
            commands={manualCopy.lines}
            meta={`${manualCopy.lines.length} line${manualCopy.lines.length === 1 ? '' : 's'}`}
          />
        )}
      </Modal>

      {/* One-time override. Picking here does not change the project's
          preference or the global default. */}
      <Modal
        open={openWithFor !== null && toolContext !== null}
        onClose={() => setOpenWithFor(null)}
        title={openWithFor ? `Open ${openWithFor.name} with` : 'Open with'}
        description="Runs this once. Your saved defaults are unchanged."
        size="default"
      >
        {openWithFor && toolContext && (
          <div className={styles.openWithGroups}>
            {TOOL_ACTIONS.map(({ kind }) => {
              const choices = toolChoices(kind, toolContext);
              const activeId = resolveToolId(kind, toolContext, openWithFor);

              return (
                <div key={kind} className={styles.openWithGroup}>
                  <h4 className={styles.openWithGroupTitle}>
                    {KIND_LABELS[kind] === 'file manager'
                      ? 'File managers'
                      : `${KIND_LABELS[kind]}s`}
                  </h4>

                  {choices.length === 0 ? (
                    <p className={styles.openWithEmpty}>
                      None configured. Add one in Settings.
                    </p>
                  ) : (
                    <div className={styles.openWithList}>
                      {choices.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          className={styles.openWithItem}
                          onClick={() => {
                            runToolAction(kind, openWithFor, choice.id);
                            setOpenWithFor(null);
                          }}
                        >
                          <span className={styles.openWithItemName}>{choice.name}</span>
                          {choice.id === activeId && (
                            <span className={styles.openWithItemBadge}>Current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Floating Context Menu */}
      {contextMenu && (
        <>
          <div
            className={menuStyles.menuOverlay}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            ref={contextMenuRef}
            className={menuStyles.menu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
            onKeyDown={handleContextMenuKeyDown}
          >
            {contextMenu.type === 'project' && contextMenu.project ? (
              <>
                <div className={menuStyles.menuLabel} role="presentation">
                  {contextMenu.project.name}
                </div>

                {TOOL_ACTIONS.map(({ kind, action, actionId, icon: Icon }) => {
                  const resolvedName = toolContext
                    ? findToolName(
                        kind,
                        toolContext,
                        resolveToolId(kind, toolContext, contextMenu.project) ?? ''
                      )
                    : null;

                  return (
                    <button
                      key={kind}
                      type="button"
                      className={menuStyles.menuItem}
                      role="menuitem"
                      onClick={() => {
                        handleQuickAction(action, contextMenu.project!);
                        setContextMenu(null);
                      }}
                    >
                      <span className={menuStyles.menuItemIcon}>
                        <Icon size={15} />
                      </span>
                      <span className={menuStyles.menuItemLabel}>
                        {resolvedName ? `Open in ${resolvedName}` : `Open in ${KIND_LABELS[kind]}`}
                      </span>
                      <span className={menuStyles.menuItemShortcut}>
                        {shortcutFor(actionId)}
                      </span>
                    </button>
                  );
                })}

                {/* One-time override: use a different tool without changing
                    the project's preference or the global default. */}
                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  aria-haspopup="true"
                  onClick={() => setOpenWithFor(contextMenu.project!)}
                >
                  <span className={menuStyles.menuItemIcon}>
                    <ArrowUpRight size={15} />
                  </span>
                  <span className={menuStyles.menuItemLabel}>Open with</span>
                  <span className={menuStyles.menuItemShortcut}>
                    <ChevronRight size={13} />
                  </span>
                </button>

                {contextMenu.project.githubUrl && (
                  <button
                    type="button"
                    className={menuStyles.menuItem}
                    role="menuitem"
                    onClick={() => {
                      handleQuickAction('github', contextMenu.project!);
                      setContextMenu(null);
                    }}
                  >
                    <span className={menuStyles.menuItemIcon}><ExternalLink size={15} /></span>
                    <span className={menuStyles.menuItemLabel}>Open GitHub</span>
                  </button>
                )}

                {contextMenu.project.hostedUrl && (
                  <button
                    type="button"
                    className={menuStyles.menuItem}
                    role="menuitem"
                    onClick={() => {
                      handleQuickAction('hosted', contextMenu.project!);
                      setContextMenu(null);
                    }}
                  >
                    <span className={menuStyles.menuItemIcon}><ExternalLink size={15} /></span>
                    <span className={menuStyles.menuItemLabel}>Open Live Site</span>
                  </button>
                )}

                <div className={menuStyles.menuSeparator} role="separator" />

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleOpenProject(contextMenu.project!);
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Pencil size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Edit Project</span>
                  <span className={menuStyles.menuItemShortcut}>Enter</span>
                </button>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleTogglePin(contextMenu.project!);
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Pin size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>
                    {contextMenu.project.isPinned ? 'Unpin Project' : 'Pin to Top'}
                  </span>
                </button>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleDuplicateProject(contextMenu.project!);
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><CopyPlus size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Duplicate</span>
                </button>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleCopySinglePath(contextMenu.project!);
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Copy size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Copy Local Path</span>
                </button>

                <div className={menuStyles.menuSeparator} role="separator" />

                <button
                  type="button"
                  className={`${menuStyles.menuItem} ${menuStyles.menuItemDanger}`}
                  role="menuitem"
                  onClick={() => {
                    handleDeleteSingleProject(contextMenu.project!);
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Trash2 size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Delete Project</span>
                  <span className={menuStyles.menuItemShortcut}>Del</span>
                </button>
              </>
            ) : (
              <>
                <div className={menuStyles.menuLabel} role="presentation">
                  Workspace Actions
                </div>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleCreateProject();
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Plus size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>New Project</span>
                  <span className={menuStyles.menuItemShortcut}>Ctrl+N</span>
                </button>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    window.dispatchEvent(
                      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
                    );
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Keyboard size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Command Palette</span>
                  <span className={menuStyles.menuItemShortcut}>Ctrl+K</span>
                </button>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid');
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}>
                    {viewMode === 'grid' ? <List size={15} /> : <LayoutGrid size={15} />}
                  </span>
                  <span className={menuStyles.menuItemLabel}>
                    Switch to {viewMode === 'grid' ? 'List' : 'Grid'} View
                  </span>
                  <span className={menuStyles.menuItemShortcut}>Ctrl+Shift+V</span>
                </button>

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    const searchInput = document.querySelector<HTMLInputElement>(
                      'input[role="searchbox"], input[type="text"][placeholder*="Search"]'
                    );
                    searchInput?.focus();
                    searchInput?.select();
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><Search size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Focus Search</span>
                  <span className={menuStyles.menuItemShortcut}>/</span>
                </button>

                <div className={menuStyles.menuSeparator} role="separator" />

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    setSelectedIds(new Set(projects.map((p) => p.id)));
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><CheckSquare size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Select All</span>
                  <span className={menuStyles.menuItemShortcut}>Ctrl+A</span>
                </button>

                {selectedIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      className={menuStyles.menuItem}
                      role="menuitem"
                      onClick={() => {
                        setBatchCommandModalOpen(true);
                        setContextMenu(null);
                      }}
                    >
                      <span className={menuStyles.menuItemIcon}><Terminal size={15} /></span>
                      <span className={menuStyles.menuItemLabel}>
                        Batch Commands ({selectedIds.size})
                      </span>
                    </button>

                    <button
                      type="button"
                      className={menuStyles.menuItem}
                      role="menuitem"
                      onClick={() => {
                        setBulkStatusOpen(true);
                        setContextMenu(null);
                      }}
                    >
                      <span className={menuStyles.menuItemIcon}><FolderArchive size={15} /></span>
                      <span className={menuStyles.menuItemLabel}>
                        Change Status ({selectedIds.size})
                      </span>
                    </button>

                    <button
                      type="button"
                      className={menuStyles.menuItem}
                      role="menuitem"
                      onClick={() => {
                        clearSelection();
                        setContextMenu(null);
                      }}
                    >
                      <span className={menuStyles.menuItemIcon}><X size={15} /></span>
                      <span className={menuStyles.menuItemLabel}>Clear Selection</span>
                      <span className={menuStyles.menuItemShortcut}>Esc</span>
                    </button>
                  </>
                )}

                <div className={menuStyles.menuSeparator} role="separator" />

                <button
                  type="button"
                  className={menuStyles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    loadData();
                    toast('Projects refreshed', 'info');
                    setContextMenu(null);
                  }}
                >
                  <span className={menuStyles.menuItemIcon}><RefreshCw size={15} /></span>
                  <span className={menuStyles.menuItemLabel}>Refresh</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Virtualized List ───────────────────────────────────────

interface ProjectVirtualListProps {
  projects: Project[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean, shift?: boolean) => void;
  onOpen: (project: Project) => void;
  onContextMenu?: (e: React.MouseEvent, project: Project) => void;
  onQuickAction?: (action: string, project: Project) => void;
  onTagClick?: (tag: string) => void;
  onRename?: (id: string, name: string) => void;
}

const PROJECT_ROW_HEIGHT = 64;

/**
 * Renders the list view with row virtualization so that hundreds of
 * projects stay responsive. Uses the nearest scrollable ancestor as the
 * scroll element (the app shell's main content area).
 */
function ProjectVirtualList({
  projects,
  selectedIds,
  onSelect,
  onOpen,
  onContextMenu,
  onQuickAction,
  onTagClick,
  onRename,
}: ProjectVirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const getScrollElement = useCallback(() => {
    const el = parentRef.current;
    if (!el) return null;
    let node = el.parentElement;
    while (node) {
      const style = getComputedStyle(node);
      if (/(auto|scroll|overlay)/.test(style.overflowY)) {
        return node;
      }
      node = node.parentElement;
    }
    return document.documentElement;
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement,
    estimateSize: () => PROJECT_ROW_HEIGHT,
    overscan: 12,
  });

  return (
    <div
      ref={parentRef}
      className={styles.projectList}
      role="listbox"
      aria-multiselectable="true"
      style={{ contain: 'layout paint' }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: 'relative',
          width: '100%',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const project = projects[virtualRow.index];
          return (
            <div
              key={project.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ProjectRow
                project={project}
                selected={selectedIds.has(project.id)}
                onSelect={onSelect}
                onOpen={onOpen}
                onContextMenu={onContextMenu}
                onQuickAction={onQuickAction}
                onTagClick={onTagClick}
                onRename={onRename}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
