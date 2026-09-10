'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, Globe, GitBranch, X } from 'lucide-react';
import type {
  Project,
  ProjectStatus,
  TerminalDefinition,
  EditorDefinition,
} from '@/lib/db/schema';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import { generateId, getAllTerminals, getAllEditors } from '@/lib/db';
import {
  Modal,
  Input,
  Textarea,
  Select,
  Button,
} from '@/components/ui';
import styles from './ProjectModal.module.css';

// ── Project Modal ──────────────────────────────────────────

export interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project?: Project | null;
}

function createEmptyProject(): Project {
  const now = Date.now();
  return {
    id: generateId(),
    name: '',
    localPath: '',
    githubUrl: '',
    hostedUrl: '',
    description: '',
    tags: [],
    status: 'active',
    tech: '',
    language: '',
    packageManager: '',
    devCommand: '',
    branch: '',
    notes: '',
    isPinned: false,
    icon: '',
    editorOverride: '',
    terminalOverride: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function ProjectModal(props: ProjectModalProps) {
  // Remounting on open (and when switching project) gives the form its
  // initial values without synchronising state from an effect.
  if (!props.open) return null;
  return <ProjectModalBody key={props.project?.id ?? 'new'} {...props} />;
}

function ProjectModalBody({
  open,
  onClose,
  onSave,
  project,
}: ProjectModalProps) {
  const isEditing = !!project;
  const [form, setForm] = useState<Project>(() =>
    project ? { ...project } : createEmptyProject()
  );
  const [showAdvanced, setShowAdvanced] = useState(
    () =>
      !!project &&
      Boolean(
        project.tech ||
          project.language ||
          project.packageManager ||
          project.devCommand ||
          project.branch ||
          project.notes
      )
  );
  const [tagInput, setTagInput] = useState('');

  // Override choices come from the user's configured tools, so anything
  // they add in Settings is selectable here.
  const [terminals, setTerminals] = useState<TerminalDefinition[]>([]);
  const [editors, setEditors] = useState<EditorDefinition[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([getAllTerminals(), getAllEditors()])
      .then(([t, e]) => {
        setTerminals(t.filter((x) => x.enabled).sort((a, b) => a.order - b.order));
        setEditors(e.filter((x) => x.enabled).sort((a, b) => a.order - b.order));
      })
      .catch(() => {
        setTerminals([]);
        setEditors([]);
      });
  }, [open]);

  const updateField = <K extends keyof Project>(key: K, value: Project[K]) => {
    setForm((prev) => ({ ...prev, [key]: value, updatedAt: Date.now() }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      updateField('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateField('tags', form.tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.localPath.trim()) return;
    onSave(form);
    onClose();
  };

  const statusOptions = DEFAULT_STATUSES.map((s) => ({
    value: s.id,
    label: s.label,
  }));

  const isValid = form.name.trim().length > 0 && form.localPath.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Add Project'}
      description={isEditing ? 'Update project details' : 'Add a new project to your shelf'}
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? 'Save Changes' : 'Add Project'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Name */}
        <Input
          label="Project Name"
          placeholder="My Awesome Project"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
          autoFocus
        />

        {/* Local Path */}
        <Input
          label="Local Path"
          placeholder="D:\Projects\my-project"
          value={form.localPath}
          onChange={(e) => updateField('localPath', e.target.value)}
          startIcon={<FolderOpen size={14} />}
          required
          helpText="Full path to the project folder on your machine"
        />

        {/* Status */}
        <Select
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(val) => updateField('status', val as ProjectStatus)}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="What is this project about?"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={2}
        />

        {/* GitHub URL */}
        <Input
          label="GitHub URL"
          placeholder="https://github.com/user/repo"
          value={form.githubUrl}
          onChange={(e) => updateField('githubUrl', e.target.value)}
          startIcon={<GitBranch size={14} />}
        />

        {/* Hosted URL */}
        <Input
          label="Hosted URL"
          placeholder="https://myproject.vercel.app"
          value={form.hostedUrl}
          onChange={(e) => updateField('hostedUrl', e.target.value)}
          startIcon={<Globe size={14} />}
        />

        {/* Tags */}
        <div>
          <Input
            label="Tags"
            placeholder="Type a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            helpText="Press Enter to add. Click tag to remove."
          />
          {form.tags.length > 0 && (
            <div className={styles.tagList}>
              {form.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.tagChip}
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  {tag}
                  <X size={11} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={styles.advancedToggle}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}
        </button>

        {showAdvanced && (
          <>
            <Input
              label="Tech Stack"
              placeholder="Next.js, TypeScript, PostgreSQL"
              value={form.tech}
              onChange={(e) => updateField('tech', e.target.value)}
            />
            <Input
              label="Language"
              placeholder="TypeScript"
              value={form.language}
              onChange={(e) => updateField('language', e.target.value)}
            />
            <Input
              label="Package Manager"
              placeholder="pnpm"
              value={form.packageManager}
              onChange={(e) => updateField('packageManager', e.target.value)}
            />
            <Input
              label="Dev Command"
              placeholder="pnpm dev"
              value={form.devCommand}
              onChange={(e) => updateField('devCommand', e.target.value)}
              helpText="Command to start the dev server"
            />
            <Input
              label="Primary branch"
              placeholder="main"
              value={form.branch}
              onChange={(e) => updateField('branch', e.target.value)}
              helpText="Available to commands as {branch}"
            />
            <Select
              label="Editor for this project"
              options={[
                { value: '', label: 'Use the default' },
                ...editors.map((e) => ({ value: e.id, label: e.name })),
              ]}
              value={form.editorOverride || ''}
              onChange={(val) => updateField('editorOverride', val)}
            />
            <Select
              label="Terminal for this project"
              options={[
                { value: '', label: 'Use the default' },
                ...terminals.map((t) => ({ value: t.id, label: t.name })),
              ]}
              value={form.terminalOverride || ''}
              onChange={(val) => updateField('terminalOverride', val)}
            />
            <Textarea
              label="Notes"
              placeholder="Internal notes, reminders, or context"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
            />
          </>
        )}
      </form>
    </Modal>
  );
}
