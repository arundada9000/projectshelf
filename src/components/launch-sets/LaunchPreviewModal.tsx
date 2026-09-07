'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Project, LaunchSet } from '@/lib/db/schema';
import {
  buildCommandsForSelection,
  toolChoices,
  resolveToolId,
  type ToolContext,
  type ToolKind,
} from '@/lib/commands/resolver';
import { copyText } from '@/lib/clipboard';
import { Modal, Button, Select, CommandPreview, SegmentedControl } from '@/components/ui';
import styles from './LaunchSets.module.css';

// ── Targets ────────────────────────────────────────────────

const TARGETS: { value: ToolKind; label: string }[] = [
  { value: 'editor', label: 'Editor' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'file-manager', label: 'Files' },
];

// ── Launch Preview ─────────────────────────────────────────

export interface LaunchPreviewModalProps {
  set: LaunchSet;
  projects: Project[];
  toolContext: ToolContext;
  onClose: () => void;
}

/**
 * Shows exactly what a launch set will produce before anything is copied:
 * which projects, which tool, and the generated commands.
 */
export function LaunchPreviewModal({
  set,
  projects,
  toolContext,
  onClose,
}: LaunchPreviewModalProps) {
  const [kind, setKind] = useState<ToolKind>('terminal');
  const [toolId, setToolId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const choices = useMemo(() => toolChoices(kind, toolContext), [kind, toolContext]);

  // Empty means "use whatever the precedence chain resolves to".
  const effectiveToolId =
    toolId && choices.some((c) => c.id === toolId)
      ? toolId
      : (resolveToolId(kind, toolContext, projects[0]) ?? '');

  const built = useMemo(
    () => buildCommandsForSelection(kind, toolContext, projects, effectiveToolId),
    [kind, toolContext, projects, effectiveToolId]
  );

  const handleCopy = async () => {
    if (!built) return;
    const ok = await copyText(built.lines.join('\n'));
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const projectLabel = `${projects.length} project${projects.length === 1 ? '' : 's'}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Launch ${set.name}`}
      description="Review the generated commands, then copy them into your terminal."
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            disabled={!built}
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy all commands'}
          </Button>
        </>
      }
    >
      <div className={styles.launchPreview}>
        <div className={styles.launchPreviewControls}>
          <div className={styles.launchPreviewField}>
            <span className={styles.launchPreviewLabel}>Open in</span>
            <SegmentedControl
              options={TARGETS}
              value={kind}
              onChange={(next) => {
                setKind(next);
                setToolId('');
              }}
            />
          </div>

          <div className={styles.launchPreviewField}>
            <span className={styles.launchPreviewLabel}>Using</span>
            <Select
              value={effectiveToolId}
              onChange={setToolId}
              options={choices.map((choice) => ({
                value: choice.id,
                label: choice.name,
              }))}
              placeholder="No tool configured"
            />
          </div>
        </div>

        <dl className={styles.launchSummary}>
          <div className={styles.launchSummaryRow}>
            <dt>Set</dt>
            <dd>{set.name}</dd>
          </div>
          <div className={styles.launchSummaryRow}>
            <dt>Projects</dt>
            <dd>{projectLabel}</dd>
          </div>
          <div className={styles.launchSummaryRow}>
            <dt>Tool</dt>
            <dd>{built?.toolName ?? 'None configured'}</dd>
          </div>
        </dl>

        {built ? (
          <CommandPreview
            title={`${built.toolName} commands`}
            commands={built.lines}
            meta={`${built.lines.length} line${built.lines.length === 1 ? '' : 's'}`}
          />
        ) : (
          <p className={styles.launchPreviewEmpty}>
            No {kind === 'file-manager' ? 'file manager' : kind} is configured, or the
            projects in this set have no local path saved. Add one in Settings.
          </p>
        )}
      </div>
    </Modal>
  );
}
