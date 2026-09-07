import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import type { GuideBlock } from '@/lib/guides';
import styles from './Guides.module.css';

/**
 * Renders a guide from its structured blocks. One renderer means every
 * guide is typeset identically, and the same source produces both the
 * page and its structured data.
 */
export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className={styles.body}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 id={block.id} className={styles.heading}>
          {block.text}
        </h2>
      );

    case 'paragraph':
      return <p className={styles.paragraph}>{block.text}</p>;

    case 'list':
      return block.ordered ? (
        <ol className={styles.orderedList}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className={styles.list}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case 'code':
      return (
        <figure className={styles.codeBlock}>
          {block.caption && (
            <figcaption className={styles.codeCaption}>{block.caption}</figcaption>
          )}
          <pre className={styles.code}>
            <code>{block.code}</code>
          </pre>
        </figure>
      );

    case 'note':
      return (
        <aside
          className={`${styles.note} ${
            block.tone === 'warning' ? styles.noteWarning : ''
          }`}
        >
          <span className={styles.noteIcon}>
            {block.tone === 'warning' ? (
              <AlertTriangle size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <p className={styles.noteText}>{block.text}</p>
        </aside>
      );

    case 'fields':
      return (
        <figure className={styles.fields}>
          {block.caption && (
            <figcaption className={styles.fieldsCaption}>{block.caption}</figcaption>
          )}
          <dl className={styles.fieldsList}>
            {block.rows.map((row) => (
              <div key={row.field} className={styles.fieldRow}>
                <dt className={styles.fieldName}>{row.field}</dt>
                <dd className={styles.fieldValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </figure>
      );

    case 'steps':
      return (
        <ol className={styles.steps}>
          {block.steps.map((step, i) => (
            <li key={step.name} className={styles.step}>
              <span className={styles.stepIndex} aria-hidden="true">
                {i + 1}
              </span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepName}>{step.name}</h3>
                <p className={styles.stepText}>{step.text}</p>
                {step.code && (
                  <pre className={styles.code}>
                    <code>{step.code}</code>
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ol>
      );

    default:
      return null;
  }
}
