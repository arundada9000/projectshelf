import type { Guide } from './types';

/* ============================================================
   Guides for people whose "projects" are not source code.
   ============================================================ */

export const DESIGNERS_GUIDE: Guide = {
  slug: 'for-designers',
  title: 'ProjectShelf for designers: Figma, Canva, and local design files',
  description:
    'Keep Figma files, Canva designs, asset folders, and client work in one searchable place, and open the right file in the right application without hunting through tabs.',
  category: 'workflows',
  updated: '2026-09-07',
  readingMinutes: 7,
  audience: ['Designers', 'Design teams', 'Freelancers'],
  blocks: [
    {
      type: 'paragraph',
      text: 'Design work spreads out the same way code does. A client job has a Figma file, a folder of source assets, an exported deliverables folder, maybe a Canva version for the social cuts, and a shared drive link somewhere. ProjectShelf treats all of that as one project with several addresses.',
    },
    {
      type: 'note',
      tone: 'info',
      text: 'Nothing here is design-specific in the software. You are using the same fields a developer uses, with different values in them. That is the point of a configurable tool.',
    },

    { type: 'heading', id: 'mapping', text: 'Mapping design work onto the fields' },
    {
      type: 'paragraph',
      text: 'Each project has a local path, a repository link, and a hosted link. Read them as three locations rather than three developer concepts.',
    },
    {
      type: 'fields',
      caption: 'A client branding project',
      rows: [
        { field: 'Name', value: 'Northwind rebrand' },
        { field: 'Local path', value: 'D:\\clients\\northwind\\design' },
        { field: 'Repository URL', value: 'The Figma file URL' },
        { field: 'Hosted URL', value: 'The live site or shared prototype' },
        { field: 'Tags', value: 'client, branding, 2026' },
        { field: 'Status', value: 'Active' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The repository field is just a labelled link. Putting a Figma URL there means the Open repository action takes you straight to the file, and searching for part of the URL finds the project.',
    },

    { type: 'heading', id: 'figma', text: 'Opening Figma files' },
    {
      type: 'paragraph',
      text: 'Figma has a desktop application that registers a URL scheme, so a link can open the file in the app rather than a browser tab. Add Figma as an application under Settings, then Applications.',
    },
    {
      type: 'fields',
      caption: 'Figma desktop',
      rows: [
        { field: 'Name', value: 'Figma' },
        { field: 'Category', value: 'design' },
        { field: 'Command', value: 'figma "{github}"' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The placeholder is {github} because that is the field holding the Figma URL. Placeholders are named after the field they read, not after what you use the field for, so use whichever one you filled in.',
    },
    {
      type: 'note',
      tone: 'warning',
      text: 'The desktop application must be installed for a figma:// link to resolve. If you work in the browser, use the plain URL instead and let the Open repository action handle it.',
    },

    { type: 'heading', id: 'canva', text: 'Canva and other browser-first tools' },
    {
      type: 'paragraph',
      text: 'Canva, Framer, Penpot, and most browser-first tools have no desktop launcher, which makes them simpler. Put the design URL in the hosted field and open it with the ordinary link action. If you want several links on one project, keep the main one in the hosted field and list the rest in the notes field, which is searchable.',
    },
    {
      type: 'code',
      caption: 'A notes field that stays findable',
      code: 'Canva social cuts: https://www.canva.com/design/...\nBrand deck: https://www.canva.com/design/...\nStock licences: invoice 4417',
    },

    { type: 'heading', id: 'local-files', text: 'Opening the working folder' },
    {
      type: 'paragraph',
      text: 'The local path opens in your file manager, which is usually what you want for a design project: the folder with the source files, the fonts, the client photographs, and the exports. Configure the file manager once under Settings, then Applications.',
    },
    {
      type: 'fields',
      caption: 'File manager per platform',
      rows: [
        { field: 'Windows', value: 'explorer "{path}"' },
        { field: 'macOS', value: 'open "{path}"' },
        { field: 'Linux', value: 'xdg-open "{path}"' },
      ],
    },
    {
      type: 'paragraph',
      text: 'You can add design applications the same way, so a project opens directly in the tool that owns it.',
    },
    {
      type: 'fields',
      caption: 'Opening a folder in a design application on macOS',
      rows: [
        { field: 'Affinity Designer', value: 'open -a "Affinity Designer" "{path}"' },
        { field: 'Sketch', value: 'open -a Sketch "{path}"' },
        { field: 'Adobe Illustrator', value: 'open -a "Adobe Illustrator" "{path}"' },
      ],
    },

    { type: 'heading', id: 'sets', text: 'Launch sets for client days' },
    {
      type: 'paragraph',
      text: 'If you block out a day per client, a launch set per client is the natural unit. Select every project belonging to that client, create a set, and launching it generates the commands to open all of their folders at once. Sets are also useful per phase: everything in review, everything waiting on client feedback.',
    },

    { type: 'heading', id: 'status', text: 'Using status for a pipeline' },
    {
      type: 'paragraph',
      text: 'The six statuses are generic on purpose. For client work they map onto a pipeline reasonably well: Active for in progress, Paused for waiting on the client, Finished for delivered, Archived for closed out, and Experiment for the concepts you keep meaning to come back to. Filter by status to see only what is actually moving.',
    },
  ],
  related: ['for-researchers', 'command-templates', 'launch-sets'],
};

export const RESEARCHERS_GUIDE: Guide = {
  slug: 'for-researchers',
  title: 'ProjectShelf for researchers and writers',
  description:
    'Track papers, datasets, and long documents alongside the tools that open them, from Obsidian vaults and LaTeX projects to Zotero libraries and reference folders.',
  category: 'workflows',
  updated: '2026-09-07',
  readingMinutes: 7,
  audience: ['Researchers', 'Academic writers', 'Technical writers'],
  blocks: [
    {
      type: 'paragraph',
      text: 'A paper is a project in every sense that matters here. It has a folder, a set of tools that open it, a status, and a habit of disappearing into a directory tree for months at a time. ProjectShelf is a plain inventory, so it does not care whether the folder holds source code or a literature review.',
    },

    { type: 'heading', id: 'shape', text: 'What to record' },
    {
      type: 'fields',
      caption: 'A paper in progress',
      rows: [
        { field: 'Name', value: 'Coastal erosion survey 2026' },
        { field: 'Local path', value: '/home/you/research/coastal-erosion' },
        { field: 'Repository URL', value: 'The preprint, DOI, or shared drive' },
        { field: 'Hosted URL', value: 'The journal submission portal' },
        { field: 'Tags', value: 'paper, fieldwork, coauthored' },
        { field: 'Status', value: 'Active while writing, Paused while under review' },
        { field: 'Notes', value: 'Coauthors, deadlines, and where the raw data lives' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The notes field is searchable, which makes it the right home for the details you will search by later: a collaborator name, a grant number, the conference you are targeting.',
    },

    { type: 'heading', id: 'writing-tools', text: 'Opening writing tools' },
    {
      type: 'paragraph',
      text: 'Most writing tools take a folder or file path exactly like an editor does. Add each one under Settings, then Applications, or as an editor if it is your usual destination for a project.',
    },
    {
      type: 'fields',
      caption: 'Command templates',
      rows: [
        { field: 'Obsidian vault', value: 'obsidian "obsidian://open?path={path}"' },
        { field: 'VS Code with LaTeX', value: 'code "{path}"' },
        { field: 'Typora', value: 'typora "{path}"' },
        { field: 'Zotero', value: 'zotero' },
        { field: 'RStudio project', value: 'rstudio "{path}"' },
        { field: 'Jupyter Lab', value: 'cd "{path}" && jupyter lab' },
      ],
    },
    {
      type: 'note',
      tone: 'info',
      text: 'A command does not have to use a placeholder. Zotero above opens the library regardless of which project you are on, which is usually what you want from a reference manager.',
    },

    { type: 'heading', id: 'latex', text: 'A LaTeX build command' },
    {
      type: 'paragraph',
      text: 'Because commands are templates, you can store the build alongside the project rather than remembering it. Add this under Settings, then Commands, in the build category.',
    },
    {
      type: 'code',
      caption: 'Build the document',
      code: 'cd "{path}"\nlatexmk -pdf -interaction=nonstopmode main.tex',
    },
    {
      type: 'paragraph',
      text: 'Select several papers and this generates the build for each of them as one block, which is handy before a deadline when you want every draft regenerated.',
    },

    { type: 'heading', id: 'datasets', text: 'Datasets and large files' },
    {
      type: 'paragraph',
      text: 'Record the dataset as its own project with its own path and a tag such as dataset. Then the papers that depend on it can name it in their notes, and searching the dataset name surfaces everything connected to it. ProjectShelf stores no file contents, only the location, so a multi-gigabyte dataset costs nothing to track.',
    },
    {
      type: 'note',
      tone: 'warning',
      text: 'A browser cannot check whether a saved path still exists. If you move or rename a folder, update the project. The path is text that ProjectShelf copies faithfully, including when it has gone stale.',
    },

    { type: 'heading', id: 'sets', text: 'Launch sets per working session' },
    {
      type: 'paragraph',
      text: 'Research sessions tend to need several things at once: the manuscript, the analysis folder, the reference library. Put those in a launch set named for the session and launching it generates the commands to open all of them together.',
    },

    { type: 'heading', id: 'backups', text: 'Backups matter more here' },
    {
      type: 'paragraph',
      text: 'Everything lives in your browser, so clearing site data would take the inventory with it. Export a JSON backup from Settings, then Data, and keep it alongside your other research files. It restores on any machine, which also makes it a reasonable way to move between a laptop and a lab workstation.',
    },
  ],
  related: ['for-designers', 'backup-and-restore', 'command-templates'],
};
