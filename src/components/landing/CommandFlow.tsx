'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion';
import styles from './Landing.module.css';

/**
 * How a selection becomes text: the stages of the command engine, then the
 * result typing itself out. The typing is the one flourish on the page and
 * it earns its place, because the generated command is the product.
 */

const STAGES = [
  { label: 'Selection', detail: '6 projects' },
  { label: 'Configuration', detail: 'Your terminal, editor, and templates' },
  { label: 'Precedence', detail: 'Global, project, then one-time' },
];

const OUTPUT = `cd "D:\\work\\aurora-dashboard"
pnpm dev`;

export function CommandFlow() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Reduced motion shows the finished command, decided during render.
    if (reduced || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setStarted(true);
          observer.disconnect();
        }
      },
      // Any part on screen counts: this block can be taller than the viewport.
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

  useEffect(() => {
    if (reduced || !started || typed.length >= OUTPUT.length) return;
    const timer = setTimeout(() => setTyped(OUTPUT.slice(0, typed.length + 1)), 22);
    return () => clearTimeout(timer);
  }, [reduced, started, typed]);

  const shownText = reduced ? OUTPUT : typed;
  const complete = shownText.length >= OUTPUT.length;

  return (
    <div ref={ref} className={styles.flow}>
      <ol className={styles.flowStages}>
        {STAGES.map((stage, index) => (
          <li key={stage.label} className={styles.flowStage}>
            <span className={styles.flowStageLabel}>{stage.label}</span>
            <span className={styles.flowStageDetail}>{stage.detail}</span>
            {index < STAGES.length - 1 && (
              <ChevronDown
                size={15}
                className={styles.flowStageArrow}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>

      <div className={styles.flowOutput}>
        <div className={styles.flowOutputHeader}>
          <span>Ready to paste</span>
        </div>
        <pre className={styles.flowOutputBody}>
          <code>{shownText}</code>
          {!complete && <span className={styles.caret} aria-hidden="true" />}
        </pre>
      </div>
    </div>
  );
}
