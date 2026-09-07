/* ============================================================
   ProjectShelf Command Resolver
   Turns "what the user wants to do" into "the text to run",
   using only configuration held in IndexedDB.

   Precedence, as specified:
       Global default -> Project override -> One-time override
   ============================================================ */

import type {
  Project,
  UserSettings,
  TerminalDefinition,
  EditorDefinition,
  ToolDefinition,
  CommandDefinition,
} from '@/lib/db/schema';
import {
  getAllTerminals,
  getAllEditors,
  getAllTools,
  getAllCommands,
  getSettings,
} from '@/lib/db';
import { substituteVariables, projectToVariables } from './engine';

// ── Action Kinds ───────────────────────────────────────────

export type ToolKind = 'editor' | 'terminal' | 'file-manager';

/** A tool of any kind, reduced to what command building needs. */
export interface ResolvedTool {
  id: string;
  name: string;
  kind: ToolKind;
  enabled: boolean;
}

// ── Tool Context ───────────────────────────────────────────

export interface ToolContext {
  terminals: TerminalDefinition[];
  editors: EditorDefinition[];
  tools: ToolDefinition[];
  commands: CommandDefinition[];
  settings: UserSettings;
}

/**
 * Load every configurable collection at once. Callers keep this in state
 * and pass it to the pure functions below.
 */
export async function loadToolContext(): Promise<ToolContext> {
  const [terminals, editors, tools, commands, settings] = await Promise.all([
    getAllTerminals(),
    getAllEditors(),
    getAllTools(),
    getAllCommands(),
    getSettings(),
  ]);
  return { terminals, editors, tools, commands, settings };
}

// ── Choices ────────────────────────────────────────────────

/**
 * Every enabled tool of a kind, in configured order. This is what the
 * "Open with" menu offers.
 */
export function toolChoices(kind: ToolKind, ctx: ToolContext): ResolvedTool[] {
  const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

  if (kind === 'editor') {
    return [...ctx.editors]
      .sort(byOrder)
      .filter((e) => e.enabled)
      .map((e) => ({ id: e.id, name: e.name, kind, enabled: e.enabled }));
  }
  if (kind === 'terminal') {
    return [...ctx.terminals]
      .sort(byOrder)
      .filter((t) => t.enabled)
      .map((t) => ({ id: t.id, name: t.name, kind, enabled: t.enabled }));
  }
  return [...ctx.tools]
    .sort(byOrder)
    .filter((t) => t.enabled && t.category === 'file-manager')
    .map((t) => ({ id: t.id, name: t.name, kind, enabled: t.enabled }));
}

// ── Resolution ─────────────────────────────────────────────

/**
 * Decide which tool id to use for an action, honouring the precedence chain.
 * `oneTimeId` wins when supplied, then the project's own override, then the
 * global default, then the first enabled tool of that kind.
 */
export function resolveToolId(
  kind: ToolKind,
  ctx: ToolContext,
  project?: Project,
  oneTimeId?: string
): string | null {
  const choices = toolChoices(kind, ctx);
  const isUsable = (id: string | undefined): id is string =>
    Boolean(id) && choices.some((choice) => choice.id === id);

  if (isUsable(oneTimeId)) return oneTimeId;

  const projectOverride =
    kind === 'editor'
      ? project?.editorOverride
      : kind === 'terminal'
        ? project?.terminalOverride
        : undefined;
  if (isUsable(projectOverride)) return projectOverride;

  const globalDefault =
    kind === 'editor'
      ? ctx.settings.defaultEditorId
      : kind === 'terminal'
        ? ctx.settings.defaultTerminalId
        : ctx.settings.defaultFileManagerId;
  if (isUsable(globalDefault)) return globalDefault;

  return choices[0]?.id ?? null;
}

export function findToolName(kind: ToolKind, ctx: ToolContext, id: string): string {
  return toolChoices(kind, ctx).find((choice) => choice.id === id)?.name ?? id;
}

// ── Command Templates ──────────────────────────────────────

/**
 * The template for a tool. A user-defined command in the commands store
 * wins, so editing a command in settings changes what the app generates.
 * Falls back to the tool's own launch template.
 */
function templateForTool(kind: ToolKind, ctx: ToolContext, toolId: string): string | null {
  const custom = [...ctx.commands]
    .filter((command) => command.enabled && command.toolId === toolId)
    .sort((a, b) => a.order - b.order)[0];
  if (custom) return custom.template;

  if (kind === 'editor') {
    const editor = ctx.editors.find((e) => e.id === toolId);
    return editor?.openCommandTemplate || null;
  }
  if (kind === 'terminal') {
    const terminal = ctx.terminals.find((t) => t.id === toolId);
    if (!terminal) return null;
    // No command configured: change directory using this shell's own syntax.
    const prefix = terminal.commandPrefix?.trim() || 'cd';
    return `${prefix} "{path}"`;
  }
  const tool = ctx.tools.find((t) => t.id === toolId);
  return tool?.commandTemplate || null;
}

// ── Building ───────────────────────────────────────────────

export interface BuiltCommand {
  toolId: string;
  toolName: string;
  /** Fully substituted, ready to copy. */
  text: string;
}

/**
 * Build the command for one project. Returns null when nothing is
 * configured for that kind, or the project has no local path.
 */
export function buildCommandForProject(
  kind: ToolKind,
  ctx: ToolContext,
  project: Project,
  oneTimeId?: string
): BuiltCommand | null {
  const toolId = resolveToolId(kind, ctx, project, oneTimeId);
  if (!toolId) return null;

  const template = templateForTool(kind, ctx, toolId);
  if (!template) return null;

  return {
    toolId,
    toolName: findToolName(kind, ctx, toolId),
    text: substituteVariables(template, projectToVariables(project)),
  };
}

/**
 * Build one command per project, sharing a single tool across the selection.
 * The tool is resolved from the first project so a mixed selection produces
 * one coherent script rather than a mixture of shells.
 */
export function buildCommandsForSelection(
  kind: ToolKind,
  ctx: ToolContext,
  projects: Project[],
  oneTimeId?: string
): { toolId: string; toolName: string; lines: string[] } | null {
  if (projects.length === 0) return null;

  const toolId = resolveToolId(kind, ctx, projects[0], oneTimeId);
  if (!toolId) return null;

  const template = templateForTool(kind, ctx, toolId);
  if (!template) return null;

  const lines = projects.map((project) =>
    substituteVariables(template, projectToVariables(project))
  );

  return { toolId, toolName: findToolName(kind, ctx, toolId), lines };
}

// ── Protocol Launch ────────────────────────────────────────

/**
 * Some editors register a URL scheme, which lets the browser hand the
 * project straight over instead of only offering text to copy. Returns
 * null when the tool has no known scheme.
 */
export function protocolUrlFor(toolId: string, project: Project): string | null {
  if (!project.localPath) return null;

  const schemes: Record<string, string> = {
    'editor-vscode': 'vscode',
    'editor-cursor': 'cursor',
    'editor-zed': 'zed',
  };
  const scheme = schemes[toolId];
  if (!scheme) return null;

  const normalised = project.localPath.replace(/\\/g, '/');
  return `${scheme}://file/${encodeURI(normalised)}`;
}
