'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Code2, Terminal, FolderOpen, Copy } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion';
import styles from './Landing.module.css';

/**
 * The multi-selection argument, told rather than described: projects get
 * picked one after another, the toolbar appears, and the generated commands
 * write themselves out.
 *
 * The sequence starts when the component scrolls into view and runs once.
 * With reduced motion it jumps straight to the finished state.
 */

const PROJECTS = [
  { name: 'aurora-dashboard', path: 'D:\\work\\aurora-dashboard' },
  { name: 'beacon-cli', path: 'D:\\work\\beacon-cli' },
  { name: 'cinder-site', path: 'D:\\personal\\cinder-site' },
  { name: 'dover-api', path: 'D:\\work\\dover-api' },
  { name: 'ember-notes', path: 'D:\\personal\\ember-notes' },
  { name: 'fathom-viz', path: 'D:\\lab\\fathom-viz' },
  { name: 'glint-ui', path: 'D:\\lab\\glint-ui' },
  { name: 'harbor-docs', path: 'D:\\work\\harbor-docs' },
];

/** Projects join the selection in this order, one step at a time. */
const SELECTION_ORDER = [0, 3, 1, 5, 2, 7, 4, 6];

const STEP_MS = 260;

export function SelectionDemo() {
  const reduced = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    // Reduced motion shows the finished state, decided during render.
    if (reduced || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setStarted(true);
          observer.disconnect();
        }
      },
      // Any part on screen counts: the grid can be taller than the viewport.
      { threshold: 0, rootMargin: '0px 0px -15% 0px' }
    );

    observer.observe(node);

    // Safety net: IntersectionObserver callbacks are tied to the rendering
    // lifecycle, so a tab that is never painted would leave this hidden for
    // good. Reveal regardless after a short wait.
    const fallback = setTimeout(() => {
      setStarted(true);
      observer.disconnect();
    }, 2500);

    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, [reduced]);

  // Add one project per tick until the whole set is selected.
  useEffect(() => {
    if (reduced || !started || selectedCount >= SELECTION_ORDER.length) return;
    const timer = setTimeout(() => setSelectedCount((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [reduced, started, selectedCount]);

  // Without motion the sequence conveys nothing, so show its result.
  const shownCount = reduced ? SELECTION_ORDER.length : selectedCount;
  const selectedIndexes = new Set(SELECTION_ORDER.slice(0, shownCount));
  const selectedProjects = SELECTION_ORDER.slice(0, shownCount).map((i) => PROJECTS[i]);
  const complete = shownCount === SELECTION_ORDER.length;

  return (
    <div ref={containerRef} className={styles.demo}>
      <div className={styles.demoGrid} aria-hidden="true">
        {PROJECTS.map((project, index) => {
          const isSelected = selectedIndexes.has(index);
          return (
            <div
              key={project.name}
              className={`${styles.demoCard} ${isSelected ? styles.demoCardSelected : ''}`}
            >
              <span
                className={`${styles.demoCheck} ${isSelected ? styles.demoCheckOn : ''}`}
              >
                {isSelected && <Check size={11} strokeWidth={3.5} />}
              </span>
              <span className={styles.demoCardBody}>
                <span className={styles.demoCardName}>{project.name}</span>
                <span className={styles.demoCardPath}>{project.path}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Selection toolbar, exactly as it appears in the application. */}
      <div
        className={`${styles.demoToolbar} ${shownCount > 0 ? styles.demoToolbarShown : ''}`}
        aria-hidden="true"
      >
        <span className={styles.demoToolbarCount}>
          {shownCount} selected
        </span>
        <span className={styles.demoToolbarActions}>
          <span className={styles.demoToolbarAction}>
            <Code2 size={14} />
          </span>
          <span className={styles.demoToolbarAction}>
            <Terminal size={14} />
          </span>
          <span className={styles.demoToolbarAction}>
            <FolderOpen size={14} />
          </span>
          <span className={styles.demoToolbarAction}>
            <Copy size={14} />
          </span>
        </span>
      </div>

      {/* The output, which is the point of the whole exercise. */}
      <div
        className={`${styles.demoOutput} ${complete ? styles.demoOutputShown : ''}`}
        aria-hidden="true"
      >
        <div className={styles.demoOutputHeader}>
          <span>Generated for {shownCount} projects</span>
          <span className={styles.demoOutputTool}>Windows Terminal</span>
        </div>
        <pre className={styles.demoOutputBody}>
          <code>
            {selectedProjects
              .map((project) => `wt -d "${project.path}"`)
              .join('\n')}
          </code>
        </pre>
      </div>

      {/* What the animation conveys, for anyone not seeing it. */}
      <p className={styles.visuallyHidden}>
        Eight projects are selected one after another. A toolbar appears with
        actions for the whole selection, and one terminal command is generated per
        project, ready to copy as a single block.
      </p>
    </div>
  );
}
