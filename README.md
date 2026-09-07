# ProjectShelf

A local-first developer project command center and project inventory. For developers with many projects scattered across drives, repositories, hosts, and folders, ProjectShelf keeps everything in one searchable place and generates the exact commands to open any of them again.

- **Offline-first.** All data lives in IndexedDB in your browser. No account, no server, no telemetry.
- **Configuration-first.** Terminals, editors, and tools are editable entries, not a hardcoded list. Windows presets are a starting point.
- **Multi-project first.** Select several projects, then generate and copy the command sequence for all of them in one action.
- **Keyboard-friendly.** Every major workflow is in the command palette (`Ctrl+K`) and rebindable to any shortcut.

The browser cannot execute anything on your machine, and ProjectShelf does not pretend otherwise. It writes the exact text for your configured tools and copies it, ready to paste into your own terminal.

## Features

- Project inventory with search, filtering, sorting, grid and list views, and multi-selection
- Configurable commands with variables (`{path}`, `{name}`, `{github}`, `{url}`, `{branch}`)
- Configurable terminals, editors, and custom tools, with global defaults, per-project overrides, and one-time &quot;Open with&quot; choices
- Launch Sets: named groups of projects opened together
- Rebindable keyboard shortcuts with conflict detection, plus a command palette
- JSON backup and restore with validation
- Installable PWA with full offline support
- Twelve themes, five fonts, and density modes, all built on centralized design tokens
- In-app user manual, first-run onboarding, and a shortcuts reference

## Tech

- Next.js 16 (App Router) with TypeScript
- React 19
- IndexedDB via `idb`
- PWA service worker and web manifest
- No backend

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page describes the product; the application lives under `/app`.

Production build:

```bash
pnpm build
pnpm start
```

## Documentation

The rules that define this product live in [`rules/`](rules/):

- [`rules/logic.md`](rules/logic.md): what is being built
- [`rules/design.md`](rules/design.md): how it is designed
- [`rules/rules.md`](rules/rules.md): quality standards (no generic SaaS dashboards, keyboard-first, no emojis or em dashes)

Screenshots of the finished interface are stored in [`docs/screenshots/`](docs/screenshots/) and document the real application, not mockups.

## Credits

Built by [Arun Neupane](https://arunneupane.vercel.app). Deployed at [sideprojectshelf.vercel.app](https://sideprojectshelf.vercel.app).
