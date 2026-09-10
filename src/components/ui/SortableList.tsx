'use client';

import React, { useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import styles from './SortableList.module.css';

export interface SortableItem<T> {
  id: string;
  data: T;
}

export interface SortableListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** Renders the drag handle plus the rest of the row. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional class applied to each row, e.g. to flag a disabled item. */
  rowClassName?: (item: T, index: number) => string;
  /** Tooltip shown on the drag handle. */
  handleLabel?: (item: T) => string;
}

/**
 * A list whose rows can be reordered by dragging a handle. Native HTML5
 * drag and drop keeps the implementation dependency-free and works with
 * a mouse. The arrow up/down buttons remain available as the keyboard
 * alternative in the parent, so drag and drop is never the only path.
 */
export function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  rowClassName,
  handleLabel,
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', String(index));
      } catch {
        // Some browsers require a drag image; ignore.
      }
      haptic('drag');
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      // dragIndex covers the normal path. The dataTransfer payload is the
      // fallback for browsers that clear React state between the two events;
      // parse it explicitly so that a dragged index of 0 is not mistaken for
      // a missing value.
      let from = dragIndex;
      if (from === null) {
        const payload = Number.parseInt(e.dataTransfer.getData('text/plain'), 10);
        from = Number.isNaN(payload) ? null : payload;
      }

      if (from === null || from < 0 || from >= items.length || from === targetIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }

      const reordered = [...items];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(targetIndex, 0, moved);
      onReorder(reordered);

      setDragIndex(null);
      setOverIndex(null);
      haptic('action');
    },
    [dragIndex, items, onReorder]
  );

  return (
    <div className={styles.list}>
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          className={`${styles.row} ${
            dragIndex === index ? styles.rowDragging : ''
          } ${overIndex === index && dragIndex !== null && dragIndex !== index ? styles.rowOver : ''} ${
            rowClassName ? rowClassName(item, index) : ''
          }`}
          draggable={false}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        >
          {/*
            Presentational on purpose. Dragging is a pointer affordance; the
            keyboard path is the move up/down buttons the parent renders in
            renderItem, so exposing this as a second control would only add a
            focus stop that cannot be activated.
          */}
          <span
            className={styles.handle}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            aria-hidden="true"
            title={handleLabel?.(item) ?? 'Drag to reorder'}
          >
            <GripVertical size={15} />
          </span>
          <div className={styles.content}>{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  );
}
