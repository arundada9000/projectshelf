'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, Check, Minus } from 'lucide-react';
import type { Project, ProjectStatus } from '@/lib/db/schema';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import {
  type ProjectFilters,
  EMPTY_FILTERS,
  countActiveFilters,
  toggleInList,
  cycleTriState,
  collectTags,
  collectTech,
} from '@/lib/filters';
import { Button, Tag } from '@/components/ui';
import styles from './FilterBar.module.css';

// ── Tri-state labels ───────────────────────────────────────

const TRI_STATE_CONDITIONS: {
  key: 'hasGithub' | 'hasHosted' | 'hasLocalPath';
  label: string;
}[] = [
  { key: 'hasLocalPath', label: 'Local path' },
  { key: 'hasGithub', label: 'Repository' },
  { key: 'hasHosted', label: 'Hosted site' },
];

function triStateLabel(value: boolean | null): string {
  if (value === true) return 'Has';
  if (value === false) return 'Missing';
  return 'Any';
}

// ── Filter Bar ─────────────────────────────────────────────

export interface FilterBarProps {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  projects: Project[];
}

/**
 * Composable filters. The active set is always visible as removable
 * chips, so nothing is hidden behind a panel the user forgot they opened.
 */
export function FilterBar({ filters, onChange, projects }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeCount = countActiveFilters(filters);
  const tags = collectTags(projects);
  const tech = collectTech(projects);

  // Close on outside click or Escape, returning focus to the trigger.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const update = (partial: Partial<ProjectFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterTriggerWrap}>
        <button
          ref={triggerRef}
          type="button"
          className={`${styles.filterTrigger} ${activeCount > 0 ? styles.filterTriggerActive : ''}`}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
        </button>

        {open && (
          <div
            ref={panelRef}
            className={styles.filterPanel}
            role="dialog"
            aria-label="Filter projects"
          >
            <section className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Status</h3>
              <div className={styles.filterOptions}>
                {DEFAULT_STATUSES.map((status) => (
                  <Tag
                    key={status.id}
                    active={filters.statuses.includes(status.id)}
                    onClick={() =>
                      update({
                        statuses: toggleInList(
                          filters.statuses,
                          status.id as ProjectStatus
                        ),
                      })
                    }
                  >
                    {status.label}
                  </Tag>
                ))}
              </div>
            </section>

            {tags.length > 0 && (
              <section className={styles.filterGroup}>
                <h3 className={styles.filterGroupTitle}>Tags</h3>
                <div className={styles.filterOptions}>
                  {tags.map((tag) => (
                    <Tag
                      key={tag}
                      active={filters.tags.includes(tag)}
                      onClick={() => update({ tags: toggleInList(filters.tags, tag) })}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              </section>
            )}

            {tech.length > 0 && (
              <section className={styles.filterGroup}>
                <h3 className={styles.filterGroupTitle}>Technology</h3>
                <div className={styles.filterOptions}>
                  {tech.map((item) => (
                    <Tag
                      key={item}
                      active={filters.tech.includes(item)}
                      onClick={() => update({ tech: toggleInList(filters.tech, item) })}
                    >
                      {item}
                    </Tag>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.filterGroup}>
              <h3 className={styles.filterGroupTitle}>Has</h3>
              <div className={styles.filterConditions}>
                {TRI_STATE_CONDITIONS.map((condition) => {
                  const value = filters[condition.key];
                  return (
                    <button
                      key={condition.key}
                      type="button"
                      className={`${styles.condition} ${
                        value !== null ? styles.conditionActive : ''
                      }`}
                      onClick={() => update({ [condition.key]: cycleTriState(value) })}
                      aria-label={`${condition.label}: ${triStateLabel(value)}. Activate to change.`}
                    >
                      <span className={styles.conditionState}>
                        {value === true && <Check size={12} strokeWidth={3} />}
                        {value === false && <X size={12} strokeWidth={3} />}
                        {value === null && <Minus size={12} strokeWidth={3} />}
                      </span>
                      <span className={styles.conditionLabel}>{condition.label}</span>
                      <span className={styles.conditionValue}>{triStateLabel(value)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className={styles.filterPanelFooter}>
              <Button
                variant="ghost"
                size="sm"
                disabled={activeCount === 0}
                onClick={() => onChange(EMPTY_FILTERS)}
              >
                Clear all
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Active filters stay visible outside the panel. */}
      {activeCount > 0 && (
        <div className={styles.activeFilters}>
          {filters.statuses.map((status) => (
            <ActiveChip
              key={`status-${status}`}
              label={DEFAULT_STATUSES.find((s) => s.id === status)?.label ?? status}
              onRemove={() => update({ statuses: toggleInList(filters.statuses, status) })}
            />
          ))}
          {filters.tags.map((tag) => (
            <ActiveChip
              key={`tag-${tag}`}
              label={tag}
              onRemove={() => update({ tags: toggleInList(filters.tags, tag) })}
            />
          ))}
          {filters.tech.map((item) => (
            <ActiveChip
              key={`tech-${item}`}
              label={item}
              onRemove={() => update({ tech: toggleInList(filters.tech, item) })}
            />
          ))}
          {TRI_STATE_CONDITIONS.filter((c) => filters[c.key] !== null).map((c) => (
            <ActiveChip
              key={`cond-${c.key}`}
              label={`${triStateLabel(filters[c.key])} ${c.label.toLowerCase()}`}
              onRemove={() => update({ [c.key]: null })}
            />
          ))}

          <button
            type="button"
            className={styles.clearAll}
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ── Active Chip ────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={styles.activeChip}>
      {label}
      <button
        type="button"
        className={styles.activeChipRemove}
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
      >
        <X size={11} strokeWidth={3} />
      </button>
    </span>
  );
}
