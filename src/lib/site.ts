/* ============================================================
   Site Constants

   The canonical origin is read from the environment so previews
   and production do not advertise each other's URLs in metadata,
   structured data, or the sitemap.
   ============================================================ */

const FALLBACK_ORIGIN = 'https://projectshelf.app';

function readOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Vercel exposes the deployment host without a scheme.
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
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
