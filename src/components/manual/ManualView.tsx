'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FolderKanban,
  Search,
  Layers,
  Settings,
  Terminal,
  Code2,
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
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui';
import type { ShortcutDefinition, ShortcutScope } from '@/lib/db/schema';
import { getAllShortcuts } from '@/lib/db';
import { APP_ACTION_MAP } from '@/lib/actions';
import { formatKeyCombo } from '@/lib/hooks/useHotkeys';
import styles from './Manual.module.css';

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: 'Anywhere',
  navigation: 'Navigation',
  projects: 'Projects view',
  selection: 'With a selection',
  'command-palette': 'Command palette',
};

// ── Manual Sections ────────────────────────────────────────

interface ManualSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

function buildSections(shortcuts: ShortcutDefinition[]): ManualSection[] {
  return [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <>
          <p className={styles.manualParagraph}>
            ProjectShelf is a local-first developer command center. All data is stored in your
            browser&apos;s IndexedDB. No accounts, no cloud sync, no tracking, and everything works offline.
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
                  Click &quot;New Project&quot; or press Ctrl+N. Provide the local path, status, description, tags, and more.
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
            These are your current bindings. Change any of them in Settings, under
            Shortcuts. Press <kbd>?</kbd> at any time for a quick reference.
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
              {shortcuts.filter((s) => s.keyCombo).map((shortcut) => (
                <tr key={shortcut.id}>
                  <td>
                    <span className={styles.manualKbd}>
                      {formatKeyCombo(shortcut.keyCombo).split(' + ').map((k, i) => (
                        <kbd key={i}>{k}</kbd>
                      ))}
                    </span>
                  </td>
                  <td>{APP_ACTION_MAP[shortcut.actionId]?.label ?? shortcut.description}</td>
                  <td>{SCOPE_LABELS[shortcut.scope] ?? shortcut.scope}</td>
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
            and clicking &quot;Create Launch Set&quot; in the floating toolbar.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Layers size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Batch Launch</div>
                <div className={styles.manualListDesc}>
                  Launching a set opens a preview showing the commands generated for every
                  project in it. Choose a target and tool, review the output, then copy it
                  all with one action.
                </div>
              </div>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'commands',
      title: 'Commands and Tools',
      content: (
        <>
          <p className={styles.manualParagraph}>
            ProjectShelf never runs anything on your machine. It generates the exact text
            for you to paste into a terminal. What it generates comes entirely from the
            terminals, editors, applications, and command templates you configure.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Terminal size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Terminals, editors, applications</div>
                <div className={styles.manualListDesc}>
                  Each has its own section in Settings. Add, edit, duplicate, reorder,
                  disable, or delete any of them, including the built-in presets. The
                  presets assume Windows, so add your own on macOS or Linux.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Code2 size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Command templates</div>
                <div className={styles.manualListDesc}>
                  Settings, under Commands. Templates use placeholders that are filled in
                  per project: <code>{'{path}'}</code>, <code>{'{name}'}</code>,{' '}
                  <code>{'{github}'}</code>, <code>{'{url}'}</code>,{' '}
                  <code>{'{branch}'}</code>, <code>{'{devCommand}'}</code> and more. The
                  editor lets you insert them without typing.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Settings size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Which tool gets used</div>
                <div className={styles.manualListDesc}>
                  A global default applies unless a project overrides it, and a project
                  override applies unless you pick something else for a single action.
                  Set the global default in Settings, under General. Set a project
                  override in the project&apos;s advanced fields. For a one-time choice,
                  right-click a project and use Open with. A one-time choice never
                  changes your saved defaults.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Copy size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Many projects at once</div>
                <div className={styles.manualListDesc}>
                  Select several projects and the same actions generate one command per
                  project, copied together as a single block. If your browser blocks the
                  clipboard, the text is shown so you can select it manually.
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
            All data is stored locally in your browser&apos;s IndexedDB. No data leaves your machine.
          </p>
          <ul className={styles.manualList}>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Download size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Export</div>
                <div className={styles.manualListDesc}>
                  Export all data as a JSON file from Settings, under Data. The file includes
                  projects, settings, commands, shortcuts, and launch sets.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Upload size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Import</div>
                <div className={styles.manualListDesc}>
                  Import a previously exported JSON backup from Settings, under Data.
                  Imported data is validated before being applied.
                </div>
              </div>
            </li>
            <li className={styles.manualListItem}>
              <div className={styles.manualListIcon}><Trash2 size={14} /></div>
              <div className={styles.manualListContent}>
                <div className={styles.manualListTitle}>Clear Data</div>
                <div className={styles.manualListDesc}>
                  Reset everything to defaults from Settings, under Data.
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

  // The manual documents the user's real bindings, not the presets.
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);
  useEffect(() => {
    getAllShortcuts()
      .then(setShortcuts)
      .catch(() => setShortcuts([]));
  }, []);

  const allSections = useMemo(() => buildSections(shortcuts), [shortcuts]);

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

      {/* Longer, platform-specific material lives outside the app. */}
      <Link href="/guides" className={styles.manualGuidesLink}>
        <BookOpen size={15} />
        <span>
          <strong>Guides</strong>
          <span className={styles.manualGuidesLinkDesc}>
            Setup for macOS and Linux, writing command templates, and workflows for
            design and research projects.
          </span>
        </span>
        <ArrowUpRight size={14} className={styles.manualGuidesLinkArrow} />
      </Link>

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
        <p className={styles.manualNoResults}>
          No sections match &quot;{search}&quot;
        </p>
      )}
    </div>
  );
}
