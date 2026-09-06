'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FolderArchive } from 'lucide-react';
import type { Project, ViewMode, SortField, SortDirection, ProjectStatus } from '@/lib/db/schema';
import {
  getAllProjects,
  addProject,
  updateProject,
  deleteProjects,
  getSettings,
  updateSettings,
} from '@/lib/db';
import { useToast } from '@/components/ui';
import { ProjectCard, ProjectRow } from './ProjectCard';
import { ProjectToolbar, SelectionToolbar } from './ProjectToolbar';
import { ProjectModal } from './ProjectModal';
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

// ── Projects View ──────────────────────────────────────────

export function ProjectsView() {
  const { toast } = useToast();

  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // ── Load Data ──────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [loadedProjects, settings] = await Promise.all([
        getAllProjects(),
        getSettings(),
      ]);
      setProjects(loadedProjects);
      setViewMode(settings.defaultView);
      setSortField(settings.sortField);
      setSortDirection(settings.sortDirection);
    } catch (err) {
      toast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtering & Sorting ────────────────────────────────

  const filtered = useMemo(() => {
    let result = projects;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.localPath.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.tech.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }

    return sortProjects(result, sortField, sortDirection);
  }, [projects, search, statusFilter, sortField, sortDirection]);

  // ── Selection Logic ────────────────────────────────────

  const handleSelect = useCallback(
    (id: string, multi: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(multi ? prev : []);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    []
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── CRUD ───────────────────────────────────────────────

  const handleSaveProject = useCallback(
    async (project: Project) => {
      try {
        const existing = projects.find((p) => p.id === project.id);
        if (existing) {
          await updateProject(project);
          toast('Project updated', 'success');
        } else {
          await addProject(project);
          toast('Project added', 'success');
        }
        await loadData();
      } catch {
        toast('Failed to save project', 'error');
      }
    },
    [projects, loadData, toast]
  );

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await deleteProjects(ids);
      toast(`Deleted ${ids.length} project(s)`, 'success');
      clearSelection();
      await loadData();
    } catch {
      toast('Failed to delete projects', 'error');
    }
  }, [selectedIds, clearSelection, loadData, toast]);

  const handleOpenProject = useCallback((project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  }, []);

  const handleCreateProject = useCallback(() => {
    setEditingProject(null);
    setModalOpen(true);
  }, []);

  // ── Quick Actions ──────────────────────────────────────

  const handleQuickAction = useCallback(
    (action: string, project: Project) => {
      toast(`${action}: ${project.name} (integration coming soon)`, 'info');
    },
    [toast]
  );

  const handleCopyPaths = useCallback(() => {
    const paths = projects
      .filter((p) => selectedIds.has(p.id))
      .map((p) => p.localPath)
      .join('\n');
    navigator.clipboard.writeText(paths);
    toast(`Copied ${selectedIds.size} path(s) to clipboard`, 'success');
  }, [projects, selectedIds, toast]);

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

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading projects...</p>
      </div>
    );
  }

  return (
    <>
      <ProjectToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
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
              ? 'Add your first project to get started. Click "New Project" or press Ctrl+N.'
              : 'Try adjusting your search or filters.'}
          </p>
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
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      ) : (
        <div className={styles.projectList} role="listbox" aria-multiselectable="true">
          {filtered.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              selected={selectedIds.has(project.id)}
              onSelect={handleSelect}
              onOpen={handleOpenProject}
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      )}

      <SelectionToolbar
        count={selectedIds.size}
        onClear={clearSelection}
        onOpenInEditor={() => toast('Open in editor (coming soon)', 'info')}
        onOpenInTerminal={() => toast('Open terminal (coming soon)', 'info')}
        onOpenInExplorer={() => toast('Open explorer (coming soon)', 'info')}
        onCopyPaths={handleCopyPaths}
        onCreateLaunchSet={() => toast('Launch sets (coming soon)', 'info')}
        onBulkStatus={() => toast('Bulk status change (coming soon)', 'info')}
        onDelete={handleDeleteSelected}
      />

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />
    </>
  );
}
