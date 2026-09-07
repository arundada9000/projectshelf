import type { Guide } from './types';

/* ============================================================
   Setup guides, one per platform.
   ============================================================ */

export const MACOS_GUIDE: Guide = {
  slug: 'macos-setup',
  title: 'Setting up ProjectShelf on macOS',
  description:
    'Replace the Windows presets with Terminal, iTerm2, Warp, and Finder, and add the editor command line tools so ProjectShelf generates commands that work on a Mac.',
  category: 'setup',
  updated: '2026-09-07',
  readingMinutes: 6,
  audience: ['macOS users', 'New installs'],
  blocks: [
    {
      type: 'paragraph',
      text: 'ProjectShelf ships with Windows-oriented presets because that is where it was built. Every one of them is an ordinary entry you can edit or delete, so the first thing to do on a Mac is replace them with your own. It takes about five minutes and you only do it once.',
    },
    {
      type: 'note',
      tone: 'info',
      text: 'ProjectShelf never runs anything itself. A web page cannot. It generates the exact text for the tools you configure and copies it, ready to paste into a terminal.',
    },

    { type: 'heading', id: 'terminals', text: 'Add your terminal' },
    {
      type: 'paragraph',
      text: 'Go to Settings, then Terminals. Delete or disable PowerShell, Command Prompt, Git Bash, and Windows Terminal, then add the shell you actually use. The two fields that matter are the executable and the directory change prefix.',
    },
    {
      type: 'fields',
      caption: 'Terminal.app or iTerm2 with zsh',
      rows: [
        { field: 'Name', value: 'Terminal' },
        { field: 'Executable', value: '/bin/zsh' },
        { field: 'Directory change prefix', value: 'cd' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The prefix is how your shell changes directory. On macOS that is plain cd for zsh, bash, and fish alike, which is why the Command Prompt preset with its cd /d is wrong for you. With the prefix set, opening a project in the terminal produces this:',
    },
    { type: 'code', code: 'cd "/Users/you/Projects/aurora"' },
    {
      type: 'paragraph',
      text: 'If you use Warp, Ghostty, Alacritty, or Kitty, add each as its own terminal. They all take the same cd prefix, so the only thing that differs is the name and the executable path.',
    },

    { type: 'heading', id: 'editors', text: 'Add your editor' },
    {
      type: 'paragraph',
      text: 'Editors are configured in Settings, then Editors. Each one has an open command, which is a template with placeholders that get filled in per project. Most macOS editors ship a command line launcher you have to install once.',
    },
    {
      type: 'steps',
      steps: [
        {
          name: 'Install the VS Code command line tool',
          text: 'Open VS Code, press Command and Shift and P together, type "shell command", and choose Install code command in PATH. Cursor and Windsurf have the same option under their own names.',
        },
        {
          name: 'Check it works',
          text: 'In a terminal, run the launcher against any folder. If the editor opens, ProjectShelf can generate the same command.',
          code: 'code ~/Projects',
        },
        {
          name: 'Add the editor in ProjectShelf',
          text: 'In Settings, then Editors, add an entry with the open command below. The {path} placeholder is replaced with each project folder.',
          code: 'code "{path}"',
        },
      ],
    },
    {
      type: 'fields',
      caption: 'Common macOS editor commands',
      rows: [
        { field: 'VS Code', value: 'code "{path}"' },
        { field: 'Cursor', value: 'cursor "{path}"' },
        { field: 'Zed', value: 'zed "{path}"' },
        { field: 'Neovim', value: 'cd "{path}" && nvim .' },
        { field: 'Xcode', value: 'open -a Xcode "{path}"' },
        { field: 'Sublime Text', value: 'subl "{path}"' },
      ],
    },
    {
      type: 'note',
      tone: 'info',
      text: 'Any application in your Applications folder can be launched with open -a followed by its name, even without a dedicated command line tool. That single pattern covers almost everything on macOS.',
    },

    { type: 'heading', id: 'finder', text: 'Replace Explorer with Finder' },
    {
      type: 'paragraph',
      text: 'Under Settings, then Applications, there is a Finder entry that ships disabled and a Windows Explorer entry that ships enabled. Switch them around: enable Finder, disable Explorer, then set Finder as your default file manager under Settings, then General.',
    },
    {
      type: 'fields',
      caption: 'Finder',
      rows: [
        { field: 'Name', value: 'Finder' },
        { field: 'Category', value: 'file-manager' },
        { field: 'Command', value: 'open "{path}"' },
      ],
    },

    { type: 'heading', id: 'paths', text: 'A note about paths' },
    {
      type: 'paragraph',
      text: 'Store full paths starting from the root, such as /Users/you/Projects/aurora. A tilde works in your shell but not in every tool, and ProjectShelf copies the path exactly as you saved it. Paths with spaces are fine because the presets already wrap {path} in quotes; keep those quotes in any template you write yourself.',
    },

    { type: 'heading', id: 'shortcuts', text: 'Shortcuts and the Command key' },
    {
      type: 'paragraph',
      text: 'Shortcuts written with Ctrl also respond to Command on a Mac, so the defaults work without changes. If you would rather record them as Command explicitly, go to Settings, then Shortcuts, select any binding, and press the combination you want. Conflicts are flagged as you record.',
    },

    { type: 'heading', id: 'install', text: 'Install it as an app' },
    {
      type: 'paragraph',
      text: 'In Safari, use Share and then Add to Dock. In Chrome or Edge, use the install icon in the address bar, or the Install app button in the ProjectShelf sidebar when it appears. Installed, it opens in its own window and works without a network connection.',
    },
  ],
  related: ['linux-setup', 'command-templates', 'keyboard-shortcuts'],
};

export const LINUX_GUIDE: Guide = {
  slug: 'linux-setup',
  title: 'Setting up ProjectShelf on Linux',
  description:
    'Configure GNOME Terminal, Konsole, Alacritty, or your shell of choice, wire up xdg-open for file managers, and replace the Windows presets with commands that work on your distribution.',
  category: 'setup',
  updated: '2026-09-07',
  readingMinutes: 6,
  audience: ['Linux users', 'New installs'],
  blocks: [
    {
      type: 'paragraph',
      text: 'The built-in presets assume Windows. On Linux you will replace them, which takes a few minutes and leaves you with commands that match your distribution and desktop exactly. Nothing about ProjectShelf is tied to a platform: terminals, editors, and applications are all editable entries.',
    },

    { type: 'heading', id: 'terminals', text: 'Terminals' },
    {
      type: 'paragraph',
      text: 'In Settings, then Terminals, disable the four Windows presets and add your own. There are already disabled Bash and Zsh entries you can enable instead of starting from scratch.',
    },
    {
      type: 'fields',
      caption: 'Bash',
      rows: [
        { field: 'Name', value: 'Bash' },
        { field: 'Executable', value: '/bin/bash' },
        { field: 'Directory change prefix', value: 'cd' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Every common Linux shell uses plain cd, so the prefix is the same for bash, zsh, fish, and nushell. What differs is the executable, which only matters as a label unless you write templates that invoke it directly.',
    },
    {
      type: 'paragraph',
      text: 'If you want a command that opens a new terminal window at the project rather than a cd line to paste into an existing one, write that as the template instead. Each emulator has its own flag for a starting directory:',
    },
    {
      type: 'fields',
      caption: 'Open a new window at the project',
      rows: [
        { field: 'GNOME Terminal', value: 'gnome-terminal --working-directory="{path}"' },
        { field: 'Konsole', value: 'konsole --workdir "{path}"' },
        { field: 'Alacritty', value: 'alacritty --working-directory "{path}"' },
        { field: 'Kitty', value: 'kitty --directory "{path}"' },
        { field: 'WezTerm', value: 'wezterm start --cwd "{path}"' },
        { field: 'Tilix', value: 'tilix --working-directory="{path}"' },
      ],
    },
    {
      type: 'note',
      tone: 'info',
      text: 'Set these under Settings, then Commands, as a terminal command bound to the terminal entry you created. A command attached to a tool takes precedence over the plain cd line ProjectShelf would otherwise generate.',
    },

    { type: 'heading', id: 'editors', text: 'Editors' },
    {
      type: 'fields',
      caption: 'Common Linux editor commands',
      rows: [
        { field: 'VS Code', value: 'code "{path}"' },
        { field: 'VS Codium', value: 'codium "{path}"' },
        { field: 'Neovim', value: 'cd "{path}" && nvim .' },
        { field: 'Helix', value: 'cd "{path}" && hx .' },
        { field: 'Zed', value: 'zed "{path}"' },
        { field: 'IntelliJ IDEA', value: 'idea "{path}"' },
        { field: 'Emacs', value: 'emacs "{path}"' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Terminal editors need a directory change first, which is why the Neovim and Helix rows chain two commands. That is ordinary shell syntax and ProjectShelf passes it through untouched.',
    },
    {
      type: 'note',
      tone: 'warning',
      text: 'If your editor is installed as a Flatpak or Snap, the plain command may not exist on your PATH. Use the full invocation instead, for example flatpak run com.visualstudio.code "{path}".',
    },

    { type: 'heading', id: 'files', text: 'File managers' },
    {
      type: 'paragraph',
      text: 'The portable answer is xdg-open, which hands the folder to whatever file manager your desktop has configured. Add it under Settings, then Applications.',
    },
    {
      type: 'fields',
      caption: 'Default file manager',
      rows: [
        { field: 'Name', value: 'File manager' },
        { field: 'Category', value: 'file-manager' },
        { field: 'Command', value: 'xdg-open "{path}"' },
      ],
    },
    {
      type: 'paragraph',
      text: 'If you would rather name one explicitly, use nautilus, dolphin, thunar, nemo, or pcmanfm in place of xdg-open. Then set it as the default under Settings, then General.',
    },

    { type: 'heading', id: 'wsl', text: 'If you work in WSL' },
    {
      type: 'paragraph',
      text: 'Running ProjectShelf in a Windows browser while your projects live inside WSL means the paths have two forms. Store the one you will actually paste into. If you work mostly in the WSL shell, store the Linux path and use plain cd. If you work mostly in Windows tools, store the \\\\wsl$ path so Explorer and Windows editors can resolve it.',
    },
    {
      type: 'code',
      caption: 'The same project, two ways',
      code: '/home/you/projects/aurora\n\\\\wsl$\\Ubuntu\\home\\you\\projects\\aurora',
    },
    {
      type: 'paragraph',
      text: 'You can also keep both: store one as the local path and put the other in the notes field, which is searchable.',
    },

    { type: 'heading', id: 'install', text: 'Install it as an app' },
    {
      type: 'paragraph',
      text: 'Chrome, Chromium, Edge, and Brave all offer installation from the address bar, and the ProjectShelf sidebar shows an Install app button when the browser reports it as installable. Firefox does not support installing web apps on the desktop, so use it in a tab or pin it.',
    },
  ],
  related: ['macos-setup', 'command-templates', 'keyboard-shortcuts'],
};

export const WINDOWS_GUIDE: Guide = {
  slug: 'windows-setup',
  title: 'Setting up ProjectShelf on Windows',
  description:
    'Get the most out of the built-in presets: Windows Terminal profiles, PowerShell against Command Prompt, Git Bash path formats, and why Command Prompt needs a different directory change prefix.',
  category: 'setup',
  updated: '2026-09-07',
  readingMinutes: 5,
  audience: ['Windows users', 'New installs'],
  blocks: [
    {
      type: 'paragraph',
      text: 'The presets are already Windows-shaped, so there is less to do here than on other platforms. What is worth knowing is why there are four terminal entries and when each one generates something different.',
    },

    { type: 'heading', id: 'prefixes', text: 'Why cd is not always cd' },
    {
      type: 'paragraph',
      text: 'Command Prompt will not change drive with a bare cd. Moving from C: to D: needs the /d flag, which is why the Command Prompt entry carries a different directory change prefix from PowerShell. Pick the wrong one and the command silently does nothing.',
    },
    {
      type: 'fields',
      caption: 'Directory change prefixes',
      rows: [
        { field: 'PowerShell', value: 'cd' },
        { field: 'Command Prompt', value: 'cd /d' },
        { field: 'Git Bash', value: 'cd' },
      ],
    },
    {
      type: 'code',
      caption: 'The same project, from each shell',
      code: 'cd "D:\\work\\aurora"\ncd /d "D:\\work\\aurora"',
    },

    { type: 'heading', id: 'windows-terminal', text: 'Windows Terminal' },
    {
      type: 'paragraph',
      text: 'Windows Terminal can open directly at a folder, so rather than pasting a cd line you can have ProjectShelf generate a command that opens a new tab already in the project.',
    },
    {
      type: 'code',
      caption: 'Command template',
      code: 'wt -d "{path}"',
    },
    {
      type: 'paragraph',
      text: 'Select several projects and you get one line per project, which opens a tab for each. To use a specific profile, add the profile flag before the directory.',
    },
    {
      type: 'code',
      caption: 'A named profile',
      code: 'wt -p "PowerShell" -d "{path}"',
    },
    {
      type: 'note',
      tone: 'info',
      text: 'To open several projects as tabs in one window rather than separate windows, join them with a semicolon in a single command template. Windows Terminal treats that as one invocation.',
    },

    { type: 'heading', id: 'git-bash', text: 'Git Bash and path formats' },
    {
      type: 'paragraph',
      text: 'Git Bash accepts Windows paths in quotes, so the stored path works without conversion. If you prefer the POSIX form, store it that way instead. What matters is that the path you save is the one you want pasted.',
    },
    {
      type: 'code',
      code: 'cd "D:\\work\\aurora"\ncd /d/work/aurora',
    },

    { type: 'heading', id: 'editors', text: 'Editors' },
    {
      type: 'paragraph',
      text: 'VS Code, Cursor, and WebStorm are configured out of the box. VS Code and Cursor also register a URL scheme, so ProjectShelf can hand the folder straight over and the editor opens without you pasting anything. The command is still copied as a fallback in case the scheme is not registered.',
    },
    {
      type: 'fields',
      caption: 'Adding another editor',
      rows: [
        { field: 'Visual Studio', value: 'devenv "{path}"' },
        { field: 'Notepad++', value: 'notepad++ "{path}"' },
        { field: 'Rider', value: 'rider "{path}"' },
        { field: 'Sublime Text', value: 'subl "{path}"' },
      ],
    },

    { type: 'heading', id: 'install', text: 'Install it as an app' },
    {
      type: 'paragraph',
      text: 'In Edge or Chrome, use the install icon in the address bar, or the Install app button in the ProjectShelf sidebar. Installed, it gets a Start menu entry, opens in its own window, and works offline.',
    },
  ],
  related: ['macos-setup', 'linux-setup', 'command-templates'],
};
