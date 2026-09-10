'use client';

import React, { useState } from 'react';
import type { ProjectStatus } from '@/lib/db/schema';
import { DEFAULT_STATUSES } from '@/lib/db/presets';
import { Modal, Button, Badge } from '@/components/ui';
import styles from './BulkStatusModal.module.css';

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
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Applying...' : `Apply Status`}
          </Button>
        </div>
      }
    >
      <div className={styles.options}>
        <p className={styles.intro}>
          Choose a new status to apply to all {count} selected projects:
        </p>

        {DEFAULT_STATUSES.map((status) => {
          const isSelected = selectedStatus === status.id;
          const variant = statusVariantMap[status.id] ?? 'default';

          return (
            <label
              key={status.id}
              className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
            >
              <span className={styles.optionMain}>
                <input
                  type="radio"
                  name="bulk-status"
                  className={styles.radio}
                  value={status.id}
                  checked={isSelected}
                  onChange={() => setSelectedStatus(status.id)}
                />
                <Badge variant={variant}>{status.label}</Badge>
              </span>
              <span className={styles.optionId}>{status.id}</span>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
