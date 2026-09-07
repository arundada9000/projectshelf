/* ============================================================
   ProjectShelf Filters
   Composable conditions applied on top of the search query.
   ============================================================ */

import type { Project, ProjectStatus } from '@/lib/db/schema';

// ── Filter State ───────────────────────────────────────────

export interface ProjectFilters {
  statuses: ProjectStatus[];
  tags: string[];
  /** null means "do not care". */
  hasGithub: boolean | null;
  hasHosted: boolean | null;
  hasLocalPath: boolean | null;
  tech: string[];
}

export const EMPTY_FILTERS: ProjectFilters = {
  statuses: [],
  tags: [],
  hasGithub: null,
  hasHosted: null,
  hasLocalPath: null,
  tech: [],
};

export function countActiveFilters(filters: ProjectFilters): number {
  return (
    filters.statuses.length +
    filters.tags.length +
    filters.tech.length +
    (filters.hasGithub === null ? 0 : 1) +
    (filters.hasHosted === null ? 0 : 1) +
    (filters.hasLocalPath === null ? 0 : 1)
  );
}

export function hasActiveFilters(filters: ProjectFilters): boolean {
  return countActiveFilters(filters) > 0;
}

// ── Application ────────────────────────────────────────────

/**
 * All conditions must hold. Within a single condition, any of the chosen
 * values counts, so picking two statuses widens rather than narrows.
 */
export function applyFilters(projects: Project[], filters: ProjectFilters): Project[] {
  return projects.filter((project) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(project.status)) {
      return false;
    }

    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) =>
        project.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      )
    ) {
      return false;
    }

    if (
      filters.tech.length > 0 &&
      !filters.tech.some((tech) => project.tech.toLowerCase() === tech.toLowerCase())
    ) {
      return false;
    }

    if (filters.hasGithub !== null && Boolean(project.githubUrl) !== filters.hasGithub) {
      return false;
    }

    if (filters.hasHosted !== null && Boolean(project.hostedUrl) !== filters.hasHosted) {
      return false;
    }

    if (
      filters.hasLocalPath !== null &&
      Boolean(project.localPath) !== filters.hasLocalPath
    ) {
      return false;
    }

    return true;
  });
}

// ── Toggles ────────────────────────────────────────────────

export function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Cycles a three-state condition: any, yes, no. */
export function cycleTriState(value: boolean | null): boolean | null {
  if (value === null) return true;
  if (value === true) return false;
  return null;
}

// ── Derived Options ────────────────────────────────────────

export function collectTags(projects: Project[]): string[] {
  const seen = new Map<string, string>();
  for (const project of projects) {
    for (const tag of project.tags) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) seen.set(key, tag);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function collectTech(projects: Project[]): string[] {
  const seen = new Map<string, string>();
  for (const project of projects) {
    if (!project.tech) continue;
    const key = project.tech.toLowerCase();
    if (!seen.has(key)) seen.set(key, project.tech);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
