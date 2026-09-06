'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/ui';
import styles from './LaunchSets.module.css';

// ── Launch Sets View ───────────────────────────────────────

export function LaunchSetsView() {
  const { toast } = useToast();
  const [launchSets, setLaunchSets] = useState<LaunchSet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<LaunchSet | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [sets, projs] = await Promise.all([
        getAllLaunchSets(),
        getAllProjects(),
      ]);
      setLaunchSets(sets);
      setProjects(projs);
    } catch {
      toast('Failed to load launch sets', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleLaunchSet = useCallback(
    (set: LaunchSet) => {
      toast(`Launching "${set.name}" — opening ${set.projectIds.length} project(s)`, 'info');
      // Future: will actually open editor/terminal/browser per project
    },
    [toast]
  );

  if (loading) return null;

  if (launchSets.length === 0 && projects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Layers size={48} className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>No launch sets yet</h2>
        <p className={styles.emptyDesc}>
          Launch sets let you open groups of projects together — in your editor, terminal,
          and browser — all with one click. Add projects first, then create a launch set.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.launchSets}>
      <div className={styles.launchSetHeader}>
        <p className={styles.launchSetDesc}>
          Group projects and launch them together. Open your editor, terminal, and browser for each project in one action.
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
                    <div className={styles.setCardTitle}>{set.name}</div>
                    <div className={styles.setCardMeta}>
                      {setProjects.length} project{setProjects.length !== 1 ? 's' : ''}
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
                    <div className={styles.setProjectItem} style={{ opacity: 0.5 }}>
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
                    onClick={() => handleDeleteSet(set.id)}
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
    </div>
  );
}

// ── Launch Set Modal ───────────────────────────────────────

interface LaunchSetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (set: LaunchSet) => void;
  launchSet: LaunchSet | null;
  projects: Project[];
}

function LaunchSetModal({
  open,
  onClose,
  onSave,
  launchSet,
  projects,
}: LaunchSetModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      if (launchSet) {
        setName(launchSet.name);
        setDescription(launchSet.description);
        setSelectedIds(new Set(launchSet.projectIds));
      } else {
        setName('');
        setDescription('');
        setSelectedIds(new Set());
      }
    }
  }, [open, launchSet]);

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
          <label style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-3)',
          }}>
            Select Projects ({selectedIds.size} selected)
          </label>
          <div className={styles.projectPicker}>
            {projects.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', color: 'var(--color-text-muted)', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
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
