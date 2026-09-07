/* ============================================================
   Guide Registry

   One place that knows every guide, so routes, the index page,
   the sitemap, and cross-links all stay in agreement.
   ============================================================ */

import type { Guide, GuideCategory } from './types';
import { MACOS_GUIDE, LINUX_GUIDE, WINDOWS_GUIDE } from './setup';
import { COMMAND_TEMPLATES_GUIDE, SHORTCUTS_GUIDE } from './configuration';
import { LAUNCH_SETS_GUIDE, BACKUP_GUIDE } from './workflows';
import { DESIGNERS_GUIDE, RESEARCHERS_GUIDE } from './audiences';

export * from './types';

export const GUIDES: Guide[] = [
  WINDOWS_GUIDE,
  MACOS_GUIDE,
  LINUX_GUIDE,
  COMMAND_TEMPLATES_GUIDE,
  SHORTCUTS_GUIDE,
  LAUNCH_SETS_GUIDE,
  DESIGNERS_GUIDE,
  RESEARCHERS_GUIDE,
  BACKUP_GUIDE,
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function guidesByCategory(category: GuideCategory): Guide[] {
  return GUIDES.filter((guide) => guide.category === category);
}

export function relatedGuides(guide: Guide): Guide[] {
  return (guide.related ?? [])
    .map(getGuide)
    .filter((related): related is Guide => Boolean(related));
}
