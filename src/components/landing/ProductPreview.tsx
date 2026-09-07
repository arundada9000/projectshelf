import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Search,
  Check,
} from 'lucide-react';
import styles from './Landing.module.css';

/**
 * A static composition of the real interface, built from the same design
 * tokens as the application itself. It is markup rather than a screenshot,
 * so it stays sharp, respects the visitor's theme, and never drifts from
 * the product's actual visual language.
 */

const PREVIEW_PROJECTS = [
  {
    name: 'aurora-dashboard',
    path: 'D:\\work\\aurora-dashboard',
    tags: ['next.js', 'client'],
    status: 'Active',
    selected: true,
  },
  {
    name: 'beacon-cli',
    path: 'D:\\work\\beacon-cli',
    tags: ['rust', 'tool'],
    status: 'Active',
    selected: true,
  },
  {
    name: 'cinder-site',
    path: 'D:\\personal\\cinder-site',
    tags: ['astro'],
    status: 'Paused',
    selected: false,
  },
];

export function ProductPreview() {
  return (
    <div className={styles.preview} role="img" aria-label="The ProjectShelf projects view with two of three projects selected and the generated terminal commands shown below">
      <div className={styles.previewChrome}>
        <span className={styles.previewDot} />
        <span className={styles.previewDot} />
        <span className={styles.previewDot} />
      </div>

      <div className={styles.previewBody}>
        {/* Sidebar */}
        <div className={styles.previewSidebar} aria-hidden="true">
          <div className={styles.previewBrand}>
            <span className={styles.previewLogo}>PS</span>
            ProjectShelf
          </div>
          <div className={styles.previewNav}>
            <span className={styles.previewNavItem}>
              <LayoutDashboard size={14} /> Dashboard
            </span>
            <span
              className={`${styles.previewNavItem} ${styles.previewNavItemActive}`}
            >
              <FolderKanban size={14} /> Projects
            </span>
            <span className={styles.previewNavItem}>
              <Layers size={14} /> Launch Sets
            </span>
          </div>
        </div>

        {/* Main */}
        <div className={styles.previewMain}>
          <div className={styles.previewToolbar} aria-hidden="true">
            <span className={styles.previewSearch}>
              <Search size={13} />
              aurora
            </span>
            <span className={styles.previewChip}>Active</span>
            <span className={styles.previewChip}>Paused</span>
          </div>

          <div className={styles.previewList} aria-hidden="true">
            {PREVIEW_PROJECTS.map((project) => (
              <div
                key={project.name}
                className={`${styles.previewRow} ${
                  project.selected ? styles.previewRowSelected : ''
                }`}
              >
                <span
                  className={`${styles.previewCheck} ${
                    project.selected ? styles.previewCheckOn : ''
                  }`}
                >
                  {project.selected && <Check size={11} strokeWidth={3} />}
                </span>
                <span className={styles.previewRowMain}>
                  <span className={styles.previewRowName}>{project.name}</span>
                  <span className={styles.previewRowPath}>{project.path}</span>
                </span>
                <span className={styles.previewTags}>
                  {project.tags.map((tag) => (
                    <span key={tag} className={styles.previewTag}>
                      {tag}
                    </span>
                  ))}
                </span>
                <span className={styles.previewStatus}>{project.status}</span>
              </div>
            ))}
          </div>

          {/* Generated output */}
          <div className={styles.previewCommand} aria-hidden="true">
            <div className={styles.previewCommandHeader}>
              <span>2 projects selected</span>
              <span className={styles.previewCommandTool}>Windows Terminal</span>
            </div>
            <pre className={styles.previewCommandBody}>
              <code>
                {'wt -d "D:\\work\\aurora-dashboard"\n'}
                {'wt -d "D:\\work\\beacon-cli"'}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
