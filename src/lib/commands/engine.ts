/* ============================================================
   ProjectShelf Command Engine
   Variable substitution, command generation, and execution
   preview for the command system.
   ============================================================ */

import type { Project, CommandDefinition } from '@/lib/db/schema';

// ── Variable Map ───────────────────────────────────────────

export interface CommandVariables {
  path: string;
  name: string;
  github: string;
  url: string;
  tech: string;
  language: string;
  packageManager: string;
  devCommand: string;
  branch: string;
}

/**
 * Extract variable map from a project
 */
export function projectToVariables(project: Project): CommandVariables {
  return {
    path: project.localPath,
    name: project.name,
    github: project.githubUrl,
    url: project.hostedUrl,
    tech: project.tech,
    language: project.language,
    packageManager: project.packageManager || 'npm',
    devCommand: project.devCommand || 'npm run dev',
    branch: project.branch || 'main',
  };
}

/**
 * Substitute variables in a command template.
 * Supports {path}, {name}, {github}, {url}, {tech}, {language},
 * {packageManager}, {devCommand}, {branch}.
 */
export function substituteVariables(
  template: string,
  vars: CommandVariables
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key as keyof CommandVariables];
    return value !== undefined ? value : match;
  });
}

/**
 * Generate a resolved command string for a project + command definition.
 */
export function resolveCommand(
  command: CommandDefinition,
  project: Project
): string {
  const vars = projectToVariables(project);
  return substituteVariables(command.template, vars);
}

/**
 * Generate resolved commands for multiple projects (batch).
 */
export function resolveCommandsBatch(
  command: CommandDefinition,
  projects: Project[]
): { project: Project; resolved: string }[] {
  return projects.map((project) => ({
    project,
    resolved: resolveCommand(command, project),
  }));
}

/**
 * Validate that a command template has no unresolved variables
 * for a given project.
 */
export function validateCommand(
  template: string,
  project: Project
): { valid: boolean; unresolved: string[] } {
  const vars = projectToVariables(project);
  const unresolved: string[] = [];

  template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key as keyof CommandVariables];
    if (!value) {
      unresolved.push(key);
    }
    return match;
  });

  return { valid: unresolved.length === 0, unresolved };
}

/**
 * Get all available template variables with descriptions.
 */
export function getAvailableVariables(): { key: string; description: string }[] {
  return [
    { key: '{path}', description: 'Project local path' },
    { key: '{name}', description: 'Project name' },
    { key: '{github}', description: 'GitHub repository URL' },
    { key: '{url}', description: 'Hosted website URL' },
    { key: '{tech}', description: 'Tech stack' },
    { key: '{language}', description: 'Primary language' },
    { key: '{packageManager}', description: 'Package manager (npm, pnpm, yarn)' },
    { key: '{devCommand}', description: 'Dev server command' },
    { key: '{branch}', description: 'Primary git branch' },
  ];
}
