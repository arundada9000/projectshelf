import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The application is a client-rendered shell over local data.
      // There is nothing there to index.
      disallow: '/app/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
