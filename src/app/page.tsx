import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import { SITE, absoluteUrl } from '@/lib/site';

// The landing page is a server component so its content is in the HTML
// for crawlers and for readers on a slow connection. The application
// itself lives under /app and is client-rendered.

export const metadata: Metadata = {
  title: 'ProjectShelf: find and launch your software projects',
  description:
    'A local-first inventory for developers with many projects. Search everything you have built, select several at once, and generate the exact commands to open them in your own tools.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ProjectShelf: find and launch your software projects',
    description:
      'A local-first inventory for developers with many projects. Search everything you have built, select several at once, and generate the exact commands to open them in your own tools.',
    url: absoluteUrl('/'),
    type: 'website',
  },
};

const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does ProjectShelf run commands on my machine?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. It generates the exact text for the tools you have configured and copies it, ready to paste into your terminal.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where is my data stored?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In your browser, using IndexedDB. There is no account and no server component. You can export everything to a JSON file and import it again later.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Once loaded, the application and all your project data are available without a network connection.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it Windows only?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The built-in presets are Windows-oriented, but every terminal, editor, and application is an editable entry you can replace with your own.',
      },
    },
  ],
};

const PRODUCT_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: SITE.name,
      url: SITE.origin,
      description:
        'A local-first inventory for developers with many projects. Search everything you have built, select several at once, and generate the exact commands to open them in your own tools.',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      softwareVersion: '1.0',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Person',
        name: 'Arun Neupane',
        url: 'https://arunneupane.vercel.app',
      },
    },
    {
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.origin,
      description: SITE.description,
      inLanguage: 'en',
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_STRUCTURED_DATA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_STRUCTURED_DATA) }}
      />
      <LandingPage />
    </>
  );
}
