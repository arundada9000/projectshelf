'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type {
  CommandDefinition,
  CommandCategory,
  TerminalDefinition,
  EditorDefinition,
  ToolDefinition,
} from '@/lib/db/schema';
import {
  getAllCommands,
  addCommand,
  updateCommand,
  deleteCommand,
  getAllTerminals,
  getAllEditors,
  getAllTools,
  generateId,
} from '@/lib/db';
import { getAvailableVariables } from '@/lib/commands/engine';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Switch,
  Modal,
  useToast,
} from '@/components/ui';
import { useLoadOnMount } from '@/lib/hooks/useLoadOnMount';
import styles from '../Settings.module.css';

// ── Category Labels ────────────────────────────────────────

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  editor: 'Editors',
  terminal: 'Terminals',
  'file-manager': 'File managers',
  git: 'Git',
  build: 'Build and run',
  custom: 'Custom',
};

const CATEGORY_ORDER: CommandCategory[] = [
  'editor',
  'terminal',
  'file-manager',
  'git',
  'build',
  'custom',
];

// ── Commands Section ───────────────────────────────────────

export function CommandsSection({ onChanged }: { onChanged?: () => void }) {
  const { toast } = useToast();
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  const [tools, setTools] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CommandDefinition | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CommandDefinition | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [loadedCommands, terminals, editors, otherTools] = await Promise.all([
        getAllCommands(),
        getAllTerminals(),
        getAllEditors(),
        getAllTools(),
      ]);
      setCommands([...loadedCommands].sort((a, b) => a.order - b.order));
      setTools([
        ...terminals.map((t: TerminalDefinition) => ({ id: t.id, name: t.name })),
        ...editors.map((e: EditorDefinition) => ({ id: e.id, name: e.name })),
        ...otherTools.map((t: ToolDefinition) => ({ id: t.id, name: t.name })),
      ]);
    } catch {
      toast('Could not load commands', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useLoadOnMount(refresh);

  const afterChange = useCallback(async () => {
    await refresh();
    onChanged?.();
  }, [refresh, onChanged]);

  const handleSave = useCallback(
    async (command: CommandDefinition) => {
      if (!command.name.trim()) {
        toast('A name is required', 'error');
        return;
      }
      if (!command.template.trim()) {
        toast('A command template is required', 'error');
        return;
      }
      try {
        if (isNew) await addCommand(command);
        else await updateCommand(command);
        setEditing(null);
        await afterChange();
        toast(isNew ? `Added ${command.name}` : `Saved ${command.name}`, 'success');
      } catch {
        toast('Could not save the command', 'error');
      }
    },
    [isNew, afterChange, toast]
  );

  const handleToggle = useCallback(
    async (command: CommandDefinition) => {
      try {
        await updateCommand({ ...command, enabled: !command.enabled });
        await afterChange();
      } catch {
        toast('Could not update the command', 'error');
      }
    },
    [afterChange, toast]
  );

  const handleDuplicate = useCallback(
    async (command: CommandDefinition) => {
      try {
        await addCommand({
          ...command,
          id: generateId(),
          name: `${command.name} copy`,
          isBuiltIn: false,
          order: commands.length,
        });
        await afterChange();
        toast(`Duplicated ${command.name}`, 'success');
      } catch {
        toast('Could not duplicate the command', 'error');
      }
    },
    [commands.length, afterChange, toast]
  );

  const handleMove = useCallback(
    async (command: CommandDefinition, direction: -1 | 1) => {
      const index = commands.findIndex((c) => c.id === command.id);
      const target = index + direction;
      if (target < 0 || target >= commands.length) return;

      const reordered = [...commands];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

      try {
        await Promise.all(
          reordered.map((entry, position) => updateCommand({ ...entry, order: position }))
        );
        await afterChange();
      } catch {
        toast('Could not reorder', 'error');
      }
    },
    [commands, afterChange, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await deleteCommand(confirmDelete.id);
      setConfirmDelete(null);
      await afterChange();
      toast(`Deleted ${confirmDelete.name}`, 'success');
    } catch {
      toast('Could not delete the command', 'error');
    }
  }, [confirmDelete, afterChange, toast]);

  const makeBlank = (): CommandDefinition => ({
    id: generateId(),
    name: '',
    template: '',
    category: 'custom',
    toolId: '',
    enabled: true,
    order: commands.length,
    description: '',
    isBuiltIn: false,
  });

  if (loading) return null;

  const grouped = new Map<CommandCategory, CommandDefinition[]>();
  for (const command of commands) {
    const list = grouped.get(command.category) ?? [];
    list.push(command);
    grouped.set(command.category, list);
  }

  return (
    <>
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <div>
            <h3 className={styles.settingsSectionTitle}>Commands</h3>
            <p className={styles.settingsSectionDesc}>
              Templates used to generate the text you copy into a terminal. Placeholders are
              filled in from each project.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              setEditing(makeBlank());
              setIsNew(true);
            }}
          >
            Add command
          </Button>
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const list = grouped.get(category);
        if (!list || list.length === 0) return null;

        return (
          <div key={category} className={styles.settingsSection}>
            <h4 className={styles.settingsSubsectionTitle}>{CATEGORY_LABELS[category]}</h4>
            <div className={styles.collectionList}>
              {list.map((command) => {
                const index = commands.findIndex((c) => c.id === command.id);
                return (
                  <div
                    key={command.id}
                    className={`${styles.collectionItem} ${
                      command.enabled ? '' : styles.collectionItemDisabled
                    }`}
                  >
                    <div className={styles.collectionItemMain}>
                      <span className={styles.collectionItemName}>
                        {command.name}
                        {command.isBuiltIn && (
                          <span
                            className={`${styles.settingsBadge} ${styles.settingsBadgeMuted}`}
                          >
                            Preset
                          </span>
                        )}
                      </span>
                      <span className={styles.collectionItemMeta}>{command.template}</span>
                    </div>

                    <div className={styles.collectionItemActions}>
                      <IconButton
                        size="sm"
                        label={`Move ${command.name} up`}
                        disabled={index === 0}
                        onClick={() => handleMove(command, -1)}
                      >
                        <ChevronUp size={15} />
                      </IconButton>
                      <IconButton
                        size="sm"
                        label={`Move ${command.name} down`}
                        disabled={index === commands.length - 1}
                        onClick={() => handleMove(command, 1)}
                      >
                        <ChevronDown size={15} />
                      </IconButton>
                      <Switch
                        checked={command.enabled}
                        onChange={() => handleToggle(command)}
                        ariaLabel={`${command.enabled ? 'Disable' : 'Enable'} ${command.name}`}
                      />
                      <IconButton
                        size="sm"
                        label={`Edit ${command.name}`}
                        onClick={() => {
                          setEditing(command);
                          setIsNew(false);
                        }}
                      >
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton
                        size="sm"
                        label={`Duplicate ${command.name}`}
                        onClick={() => handleDuplicate(command)}
                      >
                        <Copy size={15} />
                      </IconButton>
                      <IconButton
                        size="sm"
                        label={`Delete ${command.name}`}
                        onClick={() => setConfirmDelete(command)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {editing && (
        <CommandEditorDialog
          command={editing}
          tools={tools}
          isNew={isNew}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.name ?? ''}?`}
        description="The command template will be removed. This does not affect your projects."
        size="narrow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <span />
      </Modal>
    </>
  );
}

// ── Command Editor Dialog ──────────────────────────────────

interface CommandEditorDialogProps {
  command: CommandDefinition;
  tools: { id: string; name: string }[];
  isNew: boolean;
  onCancel: () => void;
  onSave: (command: CommandDefinition) => void;
}

function CommandEditorDialog({
  command,
  tools,
  isNew,
  onCancel,
  onSave,
}: CommandEditorDialogProps) {
  const [draft, setDraft] = useState(command);
  const templateRef = useRef<HTMLTextAreaElement>(null);
  const variables = getAvailableVariables();

  /** Insert a placeholder at the caret so nothing has to be memorised. */
  const insertVariable = (token: string) => {
    const field = templateRef.current;
    if (!field) {
      setDraft((prev) => ({ ...prev, template: prev.template + token }));
      return;
    }
    const start = field.selectionStart ?? draft.template.length;
    const end = field.selectionEnd ?? start;
    const next = draft.template.slice(0, start) + token + draft.template.slice(end);
    setDraft((prev) => ({ ...prev, template: next }));

    requestAnimationFrame(() => {
      field.focus();
      const caret = start + token.length;
      field.setSelectionRange(caret, caret);
    });
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={isNew ? 'Add command' : `Edit ${command.name}`}
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(draft)}>
            {isNew ? 'Add command' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className={styles.collectionList}>
        <Input
          label="Name"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Open in editor"
          required
        />

        <Textarea
          ref={templateRef}
          label="Command template"
          value={draft.template}
          onChange={(e) => setDraft((prev) => ({ ...prev, template: e.target.value }))}
          placeholder={'cd "{path}"\ncode .'}
          helpText="Each line is copied as written. Placeholders below are replaced per project."
          rows={4}
          mono
          required
        />

        <div>
          <p className={styles.settingsSectionDesc}>
            Select a placeholder to insert it at the cursor.
          </p>
          <div className={styles.variableGrid}>
            {variables.map((variable) => (
              <button
                key={variable.key}
                type="button"
                className={styles.variableCard}
                onClick={() => insertVariable(variable.key)}
              >
                <code className={styles.variableToken}>{variable.key}</code>
                <span className={styles.variableDesc}>{variable.description}</span>
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Category"
          value={draft.category}
          onChange={(value) =>
            setDraft((prev) => ({ ...prev, category: value as CommandCategory }))
          }
          options={CATEGORY_ORDER.map((category) => ({
            value: category,
            label: CATEGORY_LABELS[category],
          }))}
        />

        <Select
          label="Belongs to"
          value={draft.toolId}
          onChange={(value) => setDraft((prev) => ({ ...prev, toolId: value }))}
          options={[
            { value: '', label: 'Any tool' },
            ...tools.map((tool) => ({ value: tool.id, label: tool.name })),
          ]}
        />

        <Input
          label="Description"
          value={draft.description}
          onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="What this command does"
        />
      </div>
    </Modal>
  );
}
