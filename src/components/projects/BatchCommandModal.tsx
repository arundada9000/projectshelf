'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Project, CommandDefinition } from '@/lib/db/schema';
import { getAllCommands } from '@/lib/db';
import { Modal, Button, CommandPreview, Select } from '@/components/ui';
import { resolveCommandsBatch } from '@/lib/commands/engine';
import { copyText } from '@/lib/clipboard';

export interface BatchCommandModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}

export function BatchCommandModal({ open, onClose, projects }: BatchCommandModalProps) {
  // Read the user's commands rather than the presets, so anything added
  // or edited in Settings shows up here.
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  const [selectedCommandId, setSelectedCommandId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    getAllCommands()
      .then((loaded) => {
        const usable = loaded
          .filter((command) => command.enabled)
          .sort((a, b) => a.order - b.order);
        setCommands(usable);
        setSelectedCommandId((current) =>
          usable.some((command) => command.id === current)
            ? current
            : (usable[0]?.id ?? '')
        );
      })
      .catch(() => setCommands([]));
  }, [open]);

  const selectedCommand = useMemo(
    () => commands.find((command) => command.id === selectedCommandId) ?? null,
    [commands, selectedCommandId]
  );

  const lines = useMemo(() => {
    if (!selectedCommand) return [];
    return resolveCommandsBatch(selectedCommand, projects).map((r) => r.resolved);
  }, [selectedCommand, projects]);

  const handleCopyAll = async () => {
    try {
      await copyText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the text stays visible for manual selection.
    }
  };

  const projectLabel = `${projects.length} project${projects.length === 1 ? '' : 's'}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Generate commands for ${projectLabel}`}
      size="default"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            disabled={lines.length === 0}
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopyAll}
          >
            {copied ? 'Copied' : 'Copy all'}
          </Button>
        </>
      }
    >
      {commands.length === 0 ? (
        <p>
          No commands are enabled. Add one in Settings, under Commands.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <Select
            label="Command"
            value={selectedCommandId}
            onChange={setSelectedCommandId}
            options={commands.map((command) => ({
              value: command.id,
              label: command.name,
            }))}
          />

          <CommandPreview
            title={selectedCommand?.name ?? 'Generated commands'}
            commands={lines}
            meta={`${lines.length} line${lines.length === 1 ? '' : 's'} for ${projectLabel}`}
          />
        </div>
      )}
    </Modal>
  );
}
