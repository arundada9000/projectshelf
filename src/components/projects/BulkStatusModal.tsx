'use client';

import React, { useState } from 'react';
import type { ProjectStatus } from '@/lib/db/schema';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import { Modal, Button, Badge } from '@/components/ui';

export interface BulkStatusModalProps {
  open: boolean;
  onClose: () => void;
  count: number;
  onApply: (status: ProjectStatus) => Promise<void>;
}

const statusVariantMap: Record<ProjectStatus, 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'default'> = {
  active: 'success',
  paused: 'warning',
  finished: 'accent',
  archived: 'default',
  experiment: 'info',
  abandoned: 'danger',
};

export function BulkStatusModal({
  open,
  onClose,
  count,
  onApply,
}: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>('active');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onApply(selectedStatus);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Status for ${count} Project${count !== 1 ? 's' : ''}`}
      size="narrow"
      footer={
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Applying...' : `Apply Status`}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
          Choose a new status to apply to all {count} selected projects:
        </p>

        {DEFAULT_STATUSES.map((status) => {
          const isSelected = selectedStatus === status.id;
          const variant = statusVariantMap[status.id] ?? 'default';

          return (
            <div
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => setSelectedStatus(status.id)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <Badge variant={variant}>{status.label}</Badge>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {status.id}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
