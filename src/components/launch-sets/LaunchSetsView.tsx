'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Layers,
  Play,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Project, LaunchSet } from '@/lib/db/schema';
import {
  getAllProjects,
  getAllLaunchSets,
  addLaunchSet,
  updateLaunchSet,
  deleteLaunchSet,
  generateId,
} from '@/lib/db';
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  Modal,
  useToast,
  InlineEdit,
} from '@/components/ui';
import { loadToolContext, type ToolContext } from '@/lib/commands/resolver';
import { LaunchPreviewModal } from './LaunchPreviewModal';
import { useLoadOnMount } from '@/lib/hooks/useLoadOnMount';
import styles from './LaunchSets.module.css';

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

// ── Launch Sets View ───────────────────────────────────────

export function LaunchSetsView() {
  const { toast } = useToast();
  const [launchSets, setLaunchSets] = useState<LaunchSet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<LaunchSet | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LaunchSet | null>(null);

  // Configuration used to generate the commands for a set.
  const [toolContext, setToolContext] = useState<ToolContext | null>(null);
  const [launchPreview, setLaunchPreview] = useState<{
    set: LaunchSet;
    projects: Project[];
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [sets, projs, context] = await Promise.all([
        getAllLaunchSets(),
        getAllProjects(),
        loadToolContext(),
      ]);
      setLaunchSets([...sets].sort((a, b) => b.lastUsedAt - a.lastUsedAt));
      setProjects(projs);
      setToolContext(context);
    } catch {
      toast('Failed to load launch sets', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useLoadOnMount(loadData);

  const handleCreateSet = useCallback(() => {
    setEditingSet(null);
    setModalOpen(true);
  }, []);

  const handleEditSet = useCallback((set: LaunchSet) => {
    setEditingSet(set);
    setModalOpen(true);
  }, []);

  const handleSaveSet = useCallback(
    async (set: LaunchSet) => {
      try {
        const existing = launchSets.find((s) => s.id === set.id);
        if (existing) {
          await updateLaunchSet(set);
          toast('Launch set updated', 'success');
        } else {
          await addLaunchSet(set);
          toast('Launch set created', 'success');
        }
        setModalOpen(false);
        await loadData();
      } catch {
        toast('Failed to save launch set', 'error');
      }
    },
    [launchSets, loadData, toast]
  );

  const handleDeleteSet = useCallback(
    async (id: string) => {
      try {
        await deleteLaunchSet(id);
        toast('Launch set deleted', 'success');
        await loadData();
      } catch {
        toast('Failed to delete launch set', 'error');
      }
    },
    [loadData, toast]
  );

  const handleRenameSet = useCallback(
    async (id: string, name: string) => {
      const set = launchSets.find((s) => s.id === id);
      if (!set || set.name === name) return;
      try {
        await updateLaunchSet({ ...set, name });
        toast('Launch set renamed', 'success');
        await loadData();
      } catch {
        toast('Could not rename launch set', 'error');
      }
    },
    [launchSets, loadData, toast]
  );

  /**
   * Generate the commands for every project in a set, using the same
   * configuration and precedence as a normal multi-selection.
   */
  const handleLaunchSet = useCallback(
    (set: LaunchSet) => {
      if (!toolContext) return;

      const members = set.projectIds
        .map((id) => projects.find((p) => p.id === id))
        .filter((p): p is Project => Boolean(p));

      if (members.length === 0) {
        toast(`"${set.name}" has no projects in it yet`, 'info');
        return;
      }

      setLaunchPreview({ set, projects: members });

      // Record the launch so sets can be sorted by recent use.
      updateLaunchSet({ ...set, lastUsedAt: Date.now() })
        .then(loadData)
        .catch(() => {
          // Not being able to record this should not block the launch.
        });
    },
    [toolContext, projects, toast, loadData]
  );

  if (loading) return null;

  if (launchSets.length === 0 && projects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Layers size={48} className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>No launch sets yet</h2>
        <p className={styles.emptyDesc}>
          A launch set groups projects you work on together. Launching one generates
          the commands for every project in it at once. Add a project first, then
          create your first set.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.launchSets}>
      <div className={styles.launchSetHeader}>
        <p className={styles.launchSetDesc}>
          Group projects you work on together, then generate the commands for all of
          them in one action.
        </p>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={handleCreateSet}
        >
          New Launch Set
        </Button>
      </div>

      {launchSets.length === 0 ? (
        <div className={styles.emptyState}>
          <Layers size={40} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No launch sets</h2>
          <p className={styles.emptyDesc}>
            Create your first launch set to group projects together.
          </p>
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleCreateSet}>
            Create Launch Set
          </Button>
        </div>
      ) : (
        <div className={styles.setGrid}>
          {launchSets.map((set) => {
            const setProjects = set.projectIds
              .map((id) => projects.find((p) => p.id === id))
              .filter(Boolean) as Project[];

            return (
              <div key={set.id} className={styles.setCard}>
                <div className={styles.setCardHeader}>
                  <div>
                    <div className={styles.setCardTitle}>
                      <InlineEdit
                        value={set.name}
                        onSave={(name) => handleRenameSet(set.id, name)}
                        className={styles.setCardTitleText}
                      />
                    </div>
                    <div className={styles.setCardMeta}>
                      {setProjects.length} project{setProjects.length !== 1 ? 's' : ''}
                      {set.lastUsedAt > 0 && (
                        <> {'·'} last used {formatRelativeTime(set.lastUsedAt)}</>
                      )}
                    </div>
                  </div>
                </div>

                {set.description && (
                  <p className={styles.setCardDesc}>{set.description}</p>
                )}

                <div className={styles.setProjects}>
                  {setProjects.map((project) => (
                    <div key={project.id} className={styles.setProjectItem}>
                      <div className={styles.setProjectIcon}>
                        {project.icon || project.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.setProjectName}>{project.name}</span>
                    </div>
                  ))}
                  {set.projectIds.length > setProjects.length && (
                    <div className={`${styles.setProjectItem} ${styles.setProjectItemMissing}`}>
                      <span className={styles.setProjectName}>
                        {set.projectIds.length - setProjects.length} missing project(s)
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.setActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play size={13} />}
                    onClick={() => handleLaunchSet(set)}
                  >
                    Launch
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Pencil size={13} />}
                    onClick={() => handleEditSet(set)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => setConfirmDelete(set)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LaunchSetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSet}
        launchSet={editingSet}
        projects={projects}
      />

      {launchPreview && toolContext && (
        <LaunchPreviewModal
          set={launchPreview.set}
          projects={launchPreview.projects}
          toolContext={toolContext}
          onClose={() => setLaunchPreview(null)}
        />
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.name ?? ''}?`}
        description="The set is removed. The projects in it are not affected."
        size="narrow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) handleDeleteSet(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}

// ── Launch Set Modal ───────────────────────────────────────

export interface LaunchSetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (set: LaunchSet) => void;
  launchSet?: LaunchSet | null;
  projects: Project[];
  defaultProjectIds?: string[];
}

export function LaunchSetModal(props: LaunchSetModalProps) {
  // Remount per open so the fields start from the set being edited.
  if (!props.open) return null;
  return (
    <LaunchSetModalBody
      key={props.launchSet?.id ?? `new-${(props.defaultProjectIds ?? []).join(',')}`}
      {...props}
    />
  );
}

function LaunchSetModalBody({
  open,
  onClose,
  onSave,
  launchSet,
  projects,
  defaultProjectIds,
}: LaunchSetModalProps) {
  const [name, setName] = useState(() => launchSet?.name ?? '');
  const [description, setDescription] = useState(() => launchSet?.description ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(launchSet ? launchSet.projectIds : (defaultProjectIds ?? []))
  );

  const toggleProject = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!name.trim() || selectedIds.size === 0) return;
    const now = Date.now();
    const set: LaunchSet = {
      id: launchSet?.id ?? generateId(),
      name: name.trim(),
      description: description.trim(),
      projectIds: Array.from(selectedIds),
      createdAt: launchSet?.createdAt ?? now,
      lastUsedAt: launchSet?.lastUsedAt ?? now,
    };
    onSave(set);
  };

  const isValid = name.trim().length > 0 && selectedIds.size > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={launchSet ? 'Edit Launch Set' : 'Create Launch Set'}
      description="Group projects to open together"
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
            {launchSet ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className={styles.setForm}>
        <Input
          label="Name"
          placeholder="My workspace..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <Textarea
          label="Description (optional)"
          placeholder="What this set is for..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div>
          <label className={styles.pickerLabel}>
            Select Projects ({selectedIds.size} selected)
          </label>
          <div className={styles.projectPicker}>
            {projects.length === 0 ? (
              <div className={styles.pickerEmpty}>
                No projects yet. Add projects first.
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`${styles.projectPickerItem} ${selectedIds.has(project.id) ? styles.projectPickerItemSelected : ''}`}
                  onClick={() => toggleProject(project.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(project.id)}
                    onChange={() => toggleProject(project.id)}
                  />
                  <span className={styles.projectPickerName}>{project.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
