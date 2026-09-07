import type { Guide } from './types';

/* ============================================================
   Guides about configuring the application itself.
   ============================================================ */

export const COMMAND_TEMPLATES_GUIDE: Guide = {
  slug: 'command-templates',
  title: 'Writing command templates',
  description:
    'Every placeholder ProjectShelf substitutes, how templates attach to a tool, and worked examples for development servers, git operations, and multi-line workflows.',
  category: 'configuration',
  updated: '2026-09-07',
  readingMinutes: 8,
  audience: ['All users', 'Anyone customising commands'],
  blocks: [
    {
      type: 'paragraph',
      text: 'A command template is a line of text with placeholders in it. When you act on a project, the placeholders are replaced with that project’s values and the result is copied to your clipboard. That is the whole mechanism, and understanding it is enough to make ProjectShelf do almost anything.',
    },

    { type: 'heading', id: 'placeholders', text: 'The placeholders' },
    {
      type: 'fields',
      caption: 'Every value you can substitute',
      rows: [
        { field: '{path}', value: 'The local folder path' },
        { field: '{name}', value: 'The project name' },
        { field: '{github}', value: 'The repository URL' },
        { field: '{url}', value: 'The hosted URL' },
        { field: '{branch}', value: 'The primary branch, defaulting to main' },
        { field: '{devCommand}', value: 'The development command, defaulting to npm run dev' },
        { field: '{packageManager}', value: 'The package manager, defaulting to npm' },
        { field: '{tech}', value: 'The technology or framework' },
        { field: '{language}', value: 'The primary language' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The command editor lists all of these and inserts them at the cursor, so there is nothing to memorise. A placeholder for a field you left empty is substituted with an empty string rather than being left as literal text, except where a sensible default exists, as with the branch and package manager.',
    },
    {
      type: 'note',
      tone: 'info',
      text: 'Placeholders are named after the field they read, not after what you use the field for. If you keep a Figma URL in the repository field, {github} gives you that Figma URL.',
    },

    { type: 'heading', id: 'quoting', text: 'Quote your paths' },
    {
      type: 'paragraph',
      text: 'Paths contain spaces more often than not. Every built-in template wraps the path placeholder in double quotes, and yours should too. Without them the shell reads the path as several arguments and the command fails in a confusing way.',
    },
    {
      type: 'code',
      caption: 'The difference',
      code: 'code "{path}"\ncode {path}',
    },
    {
      type: 'paragraph',
      text: 'The first survives a folder called My Client Work. The second does not.',
    },

    { type: 'heading', id: 'multi-line', text: 'Multi-line templates' },
    {
      type: 'paragraph',
      text: 'A template can be several lines. They are copied together as one block, which is the point: you should never have to paste twice to accomplish one thing.',
    },
    {
      type: 'code',
      caption: 'Change directory, install, and start',
      code: 'cd "{path}"\n{packageManager} install\n{devCommand}',
    },
    {
      type: 'paragraph',
      text: 'Select six projects and this produces eighteen lines in the right order, ready to paste into one terminal.',
    },

    { type: 'heading', id: 'attaching', text: 'Attaching a template to a tool' },
    {
      type: 'paragraph',
      text: 'Each command has a "Belongs to" field naming a terminal, editor, or application. That connection is what makes the command system configurable rather than decorative: when you use the Open in terminal action, ProjectShelf looks for an enabled command attached to the terminal it resolved, and uses it. Only if there is none does it fall back to a plain directory change built from that terminal’s prefix.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'A command attached to the resolved tool, if one is enabled.',
        'The tool’s own launch template, for editors and applications.',
        'A directory change built from the terminal’s configured prefix.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Set "Belongs to" to Any tool for commands you only want to reach through the generate-commands dialog, such as a build or a deploy.',
    },

    { type: 'heading', id: 'examples', text: 'Worked examples' },
    {
      type: 'code',
      caption: 'Check what changed across several repositories',
      code: 'cd "{path}" && git status --short',
    },
    {
      type: 'code',
      caption: 'Bring every project up to date',
      code: 'cd "{path}" && git pull --ff-only origin {branch}',
    },
    {
      type: 'code',
      caption: 'Open the repository and the live site together',
      code: 'start "{github}"\nstart "{url}"',
    },
    {
      type: 'code',
      caption: 'Create a branch named after the project',
      code: 'cd "{path}"\ngit switch -c chore/{name}-cleanup',
    },
    {
      type: 'code',
      caption: 'Open a folder in a container',
      code: 'cd "{path}" && devcontainer open .',
    },

    { type: 'heading', id: 'ordering', text: 'Order and enablement' },
    {
      type: 'paragraph',
      text: 'Commands can be reordered and disabled. Order matters when several commands are attached to the same tool, because the first enabled one wins. Disabling is the reversible alternative to deleting, and it is the right choice for a preset you might want back.',
    },

    { type: 'heading', id: 'safety', text: 'What this cannot do' },
    {
      type: 'paragraph',
      text: 'ProjectShelf produces text. It does not execute it, cannot execute it, and does not check whether the command is sensible. That is a deliberate boundary: the tool is useful precisely because nothing happens on your machine until you decide it should. Read what lands in your clipboard before you run it, exactly as you would with anything copied from a web page.',
    },
  ],
  related: ['keyboard-shortcuts', 'launch-sets', 'macos-setup'],
};

export const SHORTCUTS_GUIDE: Guide = {
  slug: 'keyboard-shortcuts',
  title: 'Rebinding keyboard shortcuts',
  description:
    'Record any key combination against any action, understand shortcut scopes, resolve conflicts, and reach every command from the palette when no key is bound.',
  category: 'configuration',
  updated: '2026-09-07',
  readingMinutes: 5,
  audience: ['Keyboard users', 'All platforms'],
  blocks: [
    {
      type: 'paragraph',
      text: 'Shortcuts are bindings between a key combination and a named action, stored as data like everything else. Rebinding one takes effect immediately, everywhere: the key itself, the command palette hint, the context menus, and the reference sheet all read from the same place.',
    },

    { type: 'heading', id: 'recording', text: 'Recording a shortcut' },
    {
      type: 'steps',
      steps: [
        {
          name: 'Open the shortcut settings',
          text: 'Go to Settings, then Shortcuts. Every action the application knows about is listed, grouped by when it applies.',
        },
        {
          name: 'Select the field you want to change',
          text: 'The field switches to recording and reads "Press keys". It captures the whole document while recording, so the combination you press cannot trigger the shortcut it is about to replace.',
        },
        {
          name: 'Press the combination',
          text: 'It is captured and saved immediately. Press Escape instead to cancel without changing anything.',
        },
      ],
    },
    {
      type: 'paragraph',
      text: 'Two small controls sit beside each field: one clears the binding, leaving the action reachable only from the palette, and one restores the original where you have changed it. Anything you have changed is marked so you can see at a glance what has drifted from the defaults.',
    },

    { type: 'heading', id: 'scopes', text: 'Scopes' },
    {
      type: 'paragraph',
      text: 'Every binding has a scope, which is the situation it applies in. Scopes are why the same key can mean different things without ambiguity.',
    },
    {
      type: 'fields',
      caption: 'What each scope means',
      rows: [
        { field: 'Global', value: 'Anywhere in the application' },
        { field: 'Navigation', value: 'Moving between the main areas' },
        { field: 'Projects view', value: 'While the projects list is open' },
        { field: 'With a selection', value: 'Actions that operate on selected projects' },
        { field: 'Command palette', value: 'While the palette is open' },
      ],
    },

    { type: 'heading', id: 'conflicts', text: 'Conflicts' },
    {
      type: 'paragraph',
      text: 'Two bindings conflict when they share a key combination and their scopes can be active at once. Global overlaps everything; every other scope only overlaps itself. Conflicts are detected as you record and marked on both bindings, with a note at the top of the page saying how many there are. Nothing stops you saving one, because sometimes you know what you are doing, but only one of them will fire.',
    },

    { type: 'heading', id: 'platform', text: 'Control and Command' },
    {
      type: 'paragraph',
      text: 'A binding recorded with Control also responds to Command, and the reverse, so the defaults work on macOS without changes. If you prefer to see Command written explicitly, record it that way and it will match either key.',
    },

    { type: 'heading', id: 'text-fields', text: 'Typing is never hijacked' },
    {
      type: 'paragraph',
      text: 'While the cursor is in a text field, the standard editing combinations for select all, copy, cut, paste, undo, and redo are left to the browser even when they are also bound to an action. Select all in the search box selects the text, not every project.',
    },

    { type: 'heading', id: 'palette', text: 'When no key is bound' },
    {
      type: 'paragraph',
      text: 'Clearing a binding does not remove the action. Everything remains in the command palette, which is a complete list of what the application can do in the current context. Actions that need a selection stay visible with the reason shown rather than disappearing, so the palette is also a reliable way to find out why something is unavailable.',
    },
    {
      type: 'note',
      tone: 'info',
      text: 'The reference sheet, opened with the question mark key by default, always shows your current bindings rather than the shipped defaults.',
    },
  ],
  related: ['command-templates', 'launch-sets', 'linux-setup'],
};
