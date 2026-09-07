/* ============================================================
   Site Constants

   The canonical origin is read from the environment so previews
   and production do not advertise each other's URLs in metadata,
   structured data, or the sitemap.
   ============================================================ */

const FALLBACK_ORIGIN = 'https://sideprojectshelf.vercel.app';

function readOrigin(): string {
  // Explicitly configured wins; lets a custom domain be substituted later.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Named preview URLs must resolve to the deployment they belong to.
  const namedPreview = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (namedPreview) return `https://${namedPreview.replace(/\/$/, '')}`;

  // On production, VERCEL_URL is the immutable per-deployment URL, which is
  // wrong for canonicals. The project's stable production URL is its alias
  // (sideprojectshelf.vercel.app or a custom domain later).
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl) return `https://${productionUrl.replace(/\/$/, '')}`;

  // Previews fall through to the deployment URL they are served from.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return FALLBACK_ORIGIN;
}

export const SITE = {
  name: 'ProjectShelf',
  origin: readOrigin(),
  description:
    'A local-first inventory for developers with many projects. Search everything you have built, select several at once, and generate the exact commands to open them in your own tools.',
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.origin}${path.startsWith('/') ? path : `/${path}`}`;
}
