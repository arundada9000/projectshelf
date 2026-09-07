import type { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
import { absoluteUrl } from '@/lib/site';

/**
 * Only the public pages are listed. The application itself is behind
 * /app, renders from local data, and has nothing for a crawler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: absoluteUrl('/guides'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...GUIDES.map((guide) => ({
      url: absoluteUrl(`/guides/${guide.slug}`),
      lastModified: new Date(guide.updated),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ];
}
