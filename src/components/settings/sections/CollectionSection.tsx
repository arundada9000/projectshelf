'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Switch,
  Modal,
  useToast,
  SortableList,
} from '@/components/ui';
import { generateId } from '@/lib/db';
import { useLoadOnMount } from '@/lib/hooks/useLoadOnMount';
import styles from '../Settings.module.css';

// ── Record Shape ───────────────────────────────────────────

/**
 * The shape every configurable collection shares. Terminals, editors,
 * and other tools are all edited through this one component rather than
 * three near-identical screens.
 */
export interface ConfigurableRecord {
  id: string;
  name: string;
  enabled: boolean;
  isBuiltIn: boolean;
  isDefault?: boolean;
  order: number;
}

/** Read a collection-specific field that is not part of the shared shape. */
function readField(record: object, key: string): string {
  const value = (record as Record<string, unknown>)[key];
  return value === undefined || value === null ? '' : String(value);
}

export interface CollectionField {
  key: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  multiline?: boolean;
  /** Hidden behind "Show advanced fields" in the editor dialog. */
  advanced?: boolean;
  required?: boolean;
}

export interface CollectionSectionProps<T extends ConfigurableRecord> {
  title: string;
  description: string;
  /** Singular, lowercase, used in buttons and messages. */
  itemNoun: string;
  fields: CollectionField[];
  /** Field shown beneath the name in the list. */
  metaKey: string;
  emptyMessage: string;
  /** Whether one item in the collection can be marked the default. */
  supportsDefault?: boolean;
  load: () => Promise<T[]>;
  create: (item: T) => Promise<void>;
  update: (item: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
  makeBlank: (order: number) => T;
  onDefaultChange?: (id: string) => void | Promise<void>;
  /** Fires after any change so dependent views can refresh. */
  onChanged?: () => void;
}

// ── Collection Section ─────────────────────────────────────

export function CollectionSection<T extends ConfigurableRecord>({
  title,
  description,
  itemNoun,
  fields,
  metaKey,
  emptyMessage,
  supportsDefault = false,
  load,
  create,
  update,
  remove,
  makeBlank,
  onDefaultChange,
  onChanged,
}: CollectionSectionProps<T>) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<T | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);

  const refresh = useCallback(async () => {
    try {
      const loaded = await load();
      setItems([...loaded].sort((a, b) => a.order - b.order));
    } catch {
      toast(`Could not load ${itemNoun}s`, 'error');
    } finally {
      setLoading(false);
    }
  }, [load, toast, itemNoun]);

  useLoadOnMount(refresh);

  const afterChange = useCallback(async () => {
    await refresh();
    onChanged?.();
  }, [refresh, onChanged]);

  // ── Item Actions ─────────────────────────────────────

  const handleToggleEnabled = useCallback(
    async (item: T) => {
      try {
        await update({ ...item, enabled: !item.enabled });
        await afterChange();
      } catch {
        toast(`Could not update the ${itemNoun}`, 'error');
      }
    },
    [update, afterChange, toast, itemNoun]
  );

  const handleSetDefault = useCallback(
    async (item: T) => {
      try {
        // Only one item carries the default flag.
        await Promise.all(
          items.map((other) =>
            update({ ...other, isDefault: other.id === item.id })
          )
        );
        await onDefaultChange?.(item.id);
        await afterChange();
        toast(`${item.name} is now the default ${itemNoun}`, 'success');
      } catch {
        toast('Could not change the default', 'error');
      }
    },
    [items, update, onDefaultChange, afterChange, toast, itemNoun]
  );

  const handleDuplicate = useCallback(
    async (item: T) => {
      try {
        const copy = {
          ...item,
          id: generateId(),
          name: `${item.name} copy`,
          isBuiltIn: false,
          isDefault: false,
          order: items.length,
        } as T;
        await create(copy);
        await afterChange();
        toast(`Duplicated ${item.name}`, 'success');
      } catch {
        toast(`Could not duplicate the ${itemNoun}`, 'error');
      }
    },
    [items.length, create, afterChange, toast, itemNoun]
  );

  const handleMove = useCallback(
    async (item: T, direction: -1 | 1) => {
      const index = items.findIndex((i) => i.id === item.id);
      const target = index + direction;
      if (target < 0 || target >= items.length) return;

      const reordered = [...items];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

      try {
        await Promise.all(
          reordered.map((entry, position) => update({ ...entry, order: position }))
        );
        await afterChange();
      } catch {
        toast('Could not reorder', 'error');
      }
    },
    [items, update, afterChange, toast]
  );

  const reorderByOrder = useCallback(
    (next: T[]) => {
      const reordered = [...next];
      const writes = reordered.map((entry, position) =>
        update({ ...entry, order: position })
      );
      Promise.all(writes)
        .then(afterChange)
        .catch(() => toast('Could not reorder', 'error'));
    },
    [update, afterChange, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await remove(confirmDelete.id);
      setConfirmDelete(null);
      await afterChange();
      toast(`Deleted ${confirmDelete.name}`, 'success');
    } catch {
      toast(`Could not delete the ${itemNoun}`, 'error');
    }
  }, [confirmDelete, remove, afterChange, toast, itemNoun]);

  const handleSave = useCallback(
    async (item: T) => {
      if (!item.name.trim()) {
        toast('A name is required', 'error');
        return;
      }
      try {
        if (isNew) await create(item);
        else await update(item);
        setEditing(null);
        await afterChange();
        toast(isNew ? `Added ${item.name}` : `Saved ${item.name}`, 'success');
      } catch {
        toast(`Could not save the ${itemNoun}`, 'error');
      }
    },
    [isNew, create, update, afterChange, toast, itemNoun]
  );

  if (loading) return null;

  return (
    <div className={styles.settingsSection}>
      <div className={styles.settingsSectionHeader}>
        <div>
          <h3 className={styles.settingsSectionTitle}>{title}</h3>
          <p className={styles.settingsSectionDesc}>{description}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            setEditing(makeBlank(items.length));
            setIsNew(true);
          }}
        >
          Add {itemNoun}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className={styles.collectionEmpty}>{emptyMessage}</div>
      ) : (
        <div className={styles.collectionList}>
          <SortableList
            items={items}
            getKey={(item) => item.id}
            onReorder={reorderByOrder}
            rowClassName={(item) => (item.enabled ? '' : styles.collectionItemDisabled)}
            renderItem={(item, index) => (
              <div className={`${styles.collectionItem} ${styles.collectionItemInRow}`}>
                <div className={styles.collectionItemMain}>
                  <span className={styles.collectionItemName}>
                    {item.name}
                    {item.isDefault && <span className={styles.settingsBadge}>Default</span>}
                    {item.isBuiltIn && (
                      <span className={`${styles.settingsBadge} ${styles.settingsBadgeMuted}`}>
                        Preset
                      </span>
                    )}
                  </span>
                  <span className={styles.collectionItemMeta}>
                    {readField(item, metaKey) || 'Not configured'}
                  </span>
                </div>

                <div className={styles.collectionItemActions}>
                  <IconButton
                    size="sm"
                    label={`Move ${item.name} up`}
                    disabled={index === 0}
                    onClick={() => handleMove(item, -1)}
                  >
                    <ChevronUp size={15} />
                  </IconButton>
                  <IconButton
                    size="sm"
                    label={`Move ${item.name} down`}
                    disabled={index === items.length - 1}
                    onClick={() => handleMove(item, 1)}
                  >
                    <ChevronDown size={15} />
                  </IconButton>

                  {supportsDefault && (
                    <IconButton
                      size="sm"
                      label={
                        item.isDefault
                          ? `${item.name} is the default`
                          : `Make ${item.name} the default`
                      }
                      disabled={item.isDefault || !item.enabled}
                      onClick={() => handleSetDefault(item)}
                    >
                      <Star size={15} />
                    </IconButton>
                  )}

                  <Switch
                    checked={item.enabled}
                    onChange={() => handleToggleEnabled(item)}
                    ariaLabel={`${item.enabled ? 'Disable' : 'Enable'} ${item.name}`}
                  />

                  <IconButton
                    size="sm"
                    label={`Edit ${item.name}`}
                    onClick={() => {
                      setEditing(item);
                      setIsNew(false);
                    }}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    size="sm"
                    label={`Duplicate ${item.name}`}
                    onClick={() => handleDuplicate(item)}
                  >
                    <Copy size={15} />
                  </IconButton>
                  <IconButton
                    size="sm"
                    label={`Delete ${item.name}`}
                    onClick={() => setConfirmDelete(item)}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {editing && (
        <CollectionEditorDialog
          item={editing}
          fields={fields}
          itemNoun={itemNoun}
          isNew={isNew}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.name ?? ''}?`}
        description={
          confirmDelete?.isBuiltIn
            ? `This is one of the built-in presets. You can add it back by hand later, or restore every preset from Settings, Data.`
            : `This ${itemNoun} will be removed. Projects referencing it fall back to the default.`
        }
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
    </div>
  );
}

// ── Editor Dialog ──────────────────────────────────────────

interface CollectionEditorDialogProps<T extends ConfigurableRecord> {
  item: T;
  fields: CollectionField[];
  itemNoun: string;
  isNew: boolean;
  onCancel: () => void;
  onSave: (item: T) => void;
}

function CollectionEditorDialog<T extends ConfigurableRecord>({
  item,
  fields,
  itemNoun,
  isNew,
  onCancel,
  onSave,
}: CollectionEditorDialogProps<T>) {
  const [draft, setDraft] = useState<T>(item);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setField = (key: string, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }) as T);

  const basicFields = fields.filter((f) => !f.advanced);
  const advancedFields = fields.filter((f) => f.advanced);

  return (
    <Modal
      open
      onClose={onCancel}
      title={isNew ? `Add ${itemNoun}` : `Edit ${item.name}`}
      size="default"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(draft)}>
            {isNew ? `Add ${itemNoun}` : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className={styles.collectionList}>
        <Input
          label="Name"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          placeholder={`My ${itemNoun}`}
          required
        />

        {basicFields.map((field) =>
          field.multiline ? (
            <Textarea
              key={field.key}
              label={field.label}
              value={readField(draft, field.key)}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.placeholder}
              helpText={field.helpText}
              rows={3}
            />
          ) : (
            <Input
              key={field.key}
              label={field.label}
              value={readField(draft, field.key)}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.placeholder}
              helpText={field.helpText}
            />
          )
        )}

        {advancedFields.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}
            </Button>

            {showAdvanced &&
              advancedFields.map((field) =>
                field.multiline ? (
                  <Textarea
                    key={field.key}
                    label={field.label}
                    value={readField(draft, field.key)}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    rows={3}
                  />
                ) : (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={readField(draft, field.key)}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                  />
                )
              )}
          </>
        )}
      </div>
    </Modal>
  );
}
