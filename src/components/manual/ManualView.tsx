'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FolderKanban,
  Keyboard,
  Search,
  Layers,
  Settings,
  Terminal,
  Code2,
  FolderOpen,
  Download,
  Upload,
  Palette,
  Type,
  Info,
  MousePointer,
  Command,
  Pin,
  Filter,
  Copy,
  Trash2,
  Eye,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { DEFAULT_SHORTCUTS } from '@/lib/db/presets';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import styles from './Manual.module.css';

// ── Manual Sections ────────────────────────────────────────

interface ManualSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

function buildSections(): ManualSection[] {
  return [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <>
          <p className={styles.manualParagraph}>
            ProjectShelf is a local-first developer command center. All data is stored in your
            browser's IndexedDB — no accounts, no cloud sync, no tracking. Everything works offline.
          </p>
          <div className={styles.manualCallout}>
            <Info size={16} className={styles.manualCalloutIcon} />
            <span>
              First time? Press <kbd>Ctrl</kbd>+<kbd>N</kbd> to add your first project.
              All you need is the project name and local folder path.
            </span>
          </div>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><FolderKanban size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Add Projects</div>
                <div className={styles.manualListDesc}>
                  Click "New Project" or press Ctrl+N. Provide the local path, status, description, tags, and more.
                  Advanced fields (tech stack, package manager, dev command) are hidden by default.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Search size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Search & Filter</div>
                <div className={styles.manualListDesc}>
                  Press <kbd>/</kbd> to focus the search bar. Filter by status using the chips above the project list.
                  Sort by name, date, status, or path.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Eye size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Grid & List Views</div>
                <div className={styles.manualListDesc}>
                  Toggle between grid and list views using the segmented control in the toolbar.
                  Your preference is saved automatically.
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'projects',
      title: 'Managing Projects',
      content: (
        <>
          <p className={styles.manualParagraph}>
            Projects are the core entity in ProjectShelf. Each project has a name, local path,
            status, tags, and optional metadata like GitHub URL, tech stack, and dev command.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><MousePointer size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Quick Actions</div>
                <div className={styles.manualListDesc}>
                  Hover any project card to see quick action buttons: open in editor, launch terminal,
                  or open in file explorer.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Pin size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Pin Projects</div>
                <div className={styles.manualListDesc}>
                  Pinned projects always appear at the top of the list, regardless of sort order.
                  Toggle pin via the context menu (right-click).
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Filter size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Multi-Select</div>
                <div className={styles.manualListDesc}>
                  Hold Ctrl and click to select multiple projects. A floating toolbar appears with
                  batch actions: open in editor, copy paths, delete, change status, or create a launch set.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Copy size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Context Menu</div>
                <div className={styles.manualListDesc}>
                  Right-click any project card for a context menu with all available actions
                  including edit, duplicate, pin/unpin, open, and delete.
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      content: (
        <>
          <p className={styles.manualParagraph}>
            Every action in ProjectShelf has a keyboard shortcut. Press <kbd>?</kbd> anytime
            to see the full cheat sheet.
          </p>
          <table className={styles.manualTable}>
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_SHORTCUTS.map((shortcut) => (
                <tr key={shortcut.id}>
                  <td>
                    <span className={styles.manualKbd}>
                      {formatKeyCombo(shortcut.keyCombo).split(' + ').map((k, i) => (
                        <kbd key={i}>{k}</kbd>
                      ))}
                    </span>
                  </td>
                  <td>{shortcut.description}</td>
                  <td>{shortcut.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ),
    },
    {
      id: 'command-palette',
      title: 'Command Palette',
      content: (
        <>
          <p className={styles.manualParagraph}>
            Press <kbd>Ctrl</kbd>+<kbd>K</kbd> to open the command palette. Type to search for
            any command, then use arrow keys and Enter to execute.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Command size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Fuzzy Search</div>
                <div className={styles.manualListDesc}>
                  Type any part of a command name to find it. Results are grouped by category
                  (Navigation, Actions, Tools, Data).
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'launch-sets',
      title: 'Launch Sets',
      content: (
        <>
          <p className={styles.manualParagraph}>
            Launch sets let you group projects together and open them all at once.
            Create a launch set from the Launch Sets page or by multi-selecting projects
            and clicking "Create Launch Set" in the floating toolbar.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Layers size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Batch Launch</div>
                <div className={styles.manualListDesc}>
                  Clicking "Launch" on a set opens all member projects in your configured editor,
                  terminal, and browser simultaneously.
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'appearance',
      title: 'Themes & Appearance',
      content: (
        <>
          <p className={styles.manualParagraph}>
            Navigate to Settings (<kbd>Ctrl</kbd>+<kbd>,</kbd>) to customize the interface.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Palette size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>12 Themes</div>
                <div className={styles.manualListDesc}>
                  Light, Dark, Midnight, Graphite, Slate, Paper, Nordic, Forest, Ocean, Plum, Amber, Monochrome.
                  Each theme is carefully tuned for readability.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Type size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>5 Font Families</div>
                <div className={styles.manualListDesc}>
                  Inter, Plus Jakarta Sans, Geist, Outfit, JetBrains Mono.
                  Code blocks always use JetBrains Mono.
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'data',
      title: 'Data & Backups',
      content: (
        <>
          <p className={styles.manualParagraph}>
            All data is stored locally in your browser's IndexedDB. No data leaves your machine.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Download size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Export</div>
                <div className={styles.manualListDesc}>
                  Export all data as a JSON file from Settings → Data → Export. The file includes
                  projects, settings, commands, shortcuts, and launch sets.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Upload size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Import</div>
                <div className={styles.manualListDesc}>
                  Import a previously exported JSON backup from Settings → Data → Import.
                  Imported data is validated before being applied.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Trash2 size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Clear Data</div>
                <div className={styles.manualListDesc}>
                  Reset everything to defaults from Settings → Data → Danger Zone.
                  This permanently deletes all projects and configurations.
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
  ];
}

// ── Manual View ────────────────────────────────────────────

export function ManualView() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const containerRef = useRef<HTMLDivElement>(null);

  const allSections = useMemo(() => buildSections(), []);

  const sections = useMemo(() => {
    if (!search.trim()) return allSections;
    const q = search.toLowerCase();
    return allSections.filter((s) => s.title.toLowerCase().includes(q));
  }, [allSections, search]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`manual-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.manual} ref={containerRef}>
      <SearchInput
        value={search}
        onValueChange={setSearch}
        className={styles.manualSearch}
        placeholder="Search manual..."
      />

      {/* Table of Contents */}
      <div className={styles.manualToc}>
        {allSections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`${styles.manualTocLink} ${activeSection === section.id ? styles.manualTocLinkActive : ''}`}
            onClick={() => scrollToSection(section.id)}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section.id}
          id={`manual-${section.id}`}
          className={styles.manualSection}
        >
          <h2 className={styles.manualSectionTitle}>{section.title}</h2>
          {section.content}
        </div>
      ))}

      {sections.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', padding: 'var(--space-10)', textAlign: 'center' }}>
          No sections match "{search}"
        </p>
      )}
    </div>
  );
}
