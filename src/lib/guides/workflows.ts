import type { Guide } from './types';

/* ============================================================
   Guides about using the application day to day.
   ============================================================ */

export const LAUNCH_SETS_GUIDE: Guide = {
  slug: 'launch-sets',
  title: 'Launch sets: opening a whole context at once',
  description:
    'Group the projects you work on together, generate the commands for all of them in one action, and build sets around a client, a service, or a time of day.',
  category: 'workflows',
  updated: '2026-09-07',
  readingMinutes: 5,
  audience: ['All users', 'Anyone juggling several projects'],
  blocks: [
    {
      type: 'paragraph',
      text: 'Most work is not one project. A feature touches the API and the web client. A client day means four repositories. A launch set is a saved name for that group, so you stop reassembling it by hand every morning.',
    },

    { type: 'heading', id: 'creating', text: 'Creating a set' },
    {
      type: 'paragraph',
      text: 'There are two routes, and the first is usually faster.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Select the projects in the projects view, then choose Create launch set from the selection toolbar. The set is prefilled with exactly what you had selected.',
        'Go to Launch sets and choose New launch set, then tick the projects you want.',
      ],
    },
    {
      type: 'note',
      tone: 'info',
      text: 'A set holds references, not copies. Editing a project updates it everywhere, and a project can belong to as many sets as you like.',
    },

    { type: 'heading', id: 'launching', text: 'What launching does' },
    {
      type: 'paragraph',
      text: 'Launching opens a preview showing what the set will produce before anything is copied: which set, how many projects, which tool, and the generated commands. You pick a target, editor, terminal, or file manager, and optionally a specific tool, then copy the lot with one action.',
    },
    {
      type: 'paragraph',
      text: 'The tool is resolved exactly as it is for a manual selection, so your global default applies unless a project overrides it. Nothing about a set bypasses your configuration.',
    },
    {
      type: 'code',
      caption: 'A four-project set, opened in Windows Terminal',
      code: 'wt -d "D:\\work\\api"\nwt -d "D:\\work\\web"\nwt -d "D:\\work\\admin"\nwt -d "D:\\work\\docs"',
    },

    { type: 'heading', id: 'organising', text: 'Sets worth having' },
    {
      type: 'list',
      items: [
        'By service: everything one feature touches, so nothing is forgotten mid-change.',
        'By client: all the work belonging to one account, for days blocked out per client.',
        'By ritual: the two or three things you always open first thing.',
        'By state: everything waiting on review, so you can sweep them in one pass.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Sets are sorted by when you last launched them, so the ones you actually use rise to the top and the aspirational ones sink. The last used time is shown on each card.',
    },

    { type: 'heading', id: 'missing', text: 'When a member is gone' },
    {
      type: 'paragraph',
      text: 'Deleting a project does not break the sets it belonged to. The set reports how many members it can no longer find rather than silently shrinking, so you can decide whether to edit it or leave it.',
    },
  ],
  related: ['command-templates', 'for-designers', 'backup-and-restore'],
};

export const BACKUP_GUIDE: Guide = {
  slug: 'backup-and-restore',
  title: 'Backing up, restoring, and moving between machines',
  description:
    'Export every project, command, tool, shortcut, and setting to a single JSON file, understand what import will merge, and move your inventory to another computer.',
  category: 'data',
  updated: '2026-09-07',
  readingMinutes: 5,
  audience: ['All users', 'Anyone with more than one machine'],
  blocks: [
    {
      type: 'paragraph',
      text: 'Everything lives in your browser, in IndexedDB, tied to the site you loaded it from. That is what makes ProjectShelf work without an account. It also means the browser owns your data, so the export is not an optional extra.',
    },
    {
      type: 'note',
      tone: 'warning',
      text: 'Clearing site data for this origin deletes your inventory. So does "Clear browsing data" with site data included. Export before you do either.',
    },

    { type: 'heading', id: 'export', text: 'Exporting' },
    {
      type: 'paragraph',
      text: 'Go to Settings, then Data, and choose Export. You get a single JSON file named with the date. It contains everything, not just projects.',
    },
    {
      type: 'list',
      items: [
        'Projects, with all their fields and overrides',
        'Command templates, including ones you wrote',
        'Terminals, editors, and applications',
        'Launch sets',
        'Keyboard shortcut bindings',
        'Tags and settings, including your theme',
      ],
    },
    {
      type: 'paragraph',
      text: 'The file carries a schema version so a future release can migrate an older backup rather than rejecting it. It is plain JSON, so you can read it, keep it in version control, or diff two of them.',
    },

    { type: 'heading', id: 'import', text: 'Importing' },
    {
      type: 'paragraph',
      text: 'Import is two steps on purpose. Choosing a file validates it and shows you what it holds, record type by record type, along with any warnings. Nothing is written until you confirm.',
    },
    {
      type: 'steps',
      steps: [
        {
          name: 'Choose the file',
          text: 'Settings, then Data, then Import. The file is parsed and checked for shape and version.',
        },
        {
          name: 'Read the summary',
          text: 'You are shown the format version and a count for each kind of record, plus any problems found.',
        },
        {
          name: 'Confirm',
          text: 'Records are merged into what you already have. Anything sharing an identifier with an existing record replaces it; everything else is added.',
        },
      ],
    },
    {
      type: 'note',
      tone: 'info',
      text: 'Merge means an import never empties your inventory. To start clean, clear the data first and then import.',
    },

    { type: 'heading', id: 'moving', text: 'Moving to another machine' },
    {
      type: 'paragraph',
      text: 'Export on the old machine, open ProjectShelf on the new one, and import. Your themes, shortcuts, and tools come with you.',
    },
    {
      type: 'paragraph',
      text: 'One thing worth checking after a move between platforms: the paths. A Windows path means nothing on a Mac. If you genuinely work across both, keep the machine-specific path in the local path field and note the other form in the notes field, which is searchable.',
    },

    { type: 'heading', id: 'habit', text: 'Making it a habit' },
    {
      type: 'paragraph',
      text: 'The inventory changes slowly, so a backup after a session of adding projects is usually enough. Exporting into a folder you already sync or commit means the habit costs nothing beyond the first time.',
    },

    { type: 'heading', id: 'clearing', text: 'Clearing everything' },
    {
      type: 'paragraph',
      text: 'Settings, then Data has a Clear all data action. It deletes every project, set, and customisation in this browser and restores the built-in presets. It asks first, and it cannot be undone, so export beforehand if there is any chance you will want it back.',
    },
  ],
  related: ['launch-sets', 'for-researchers', 'command-templates'],
};
