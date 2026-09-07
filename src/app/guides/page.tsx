import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  GUIDES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  guidesByCategory,
} from '@/lib/guides';
import { SITE, absoluteUrl } from '@/lib/site';
import { LandingNav } from '@/components/landing/LandingNav';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { ScrollToTop } from '@/components/landing/ScrollToTop';
import styles from '@/components/guides/Guides.module.css';

export const metadata: Metadata = {
  title: 'Guides: setting up and configuring ProjectShelf',
  description:
    'Platform setup for Windows, macOS, and Linux, writing command templates, rebinding shortcuts, and using ProjectShelf for design and research work.',
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'ProjectShelf guides',
    description:
      'Platform setup, command templates, keyboard shortcuts, and workflows for design and research projects.',
    url: absoluteUrl('/guides'),
    type: 'website',
  },
};

/** An ItemList so the collection is legible to crawlers and assistants. */
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'ProjectShelf guides',
  description: metadata.description,
  itemListElement: GUIDES.map((guide, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: guide.title,
    url: absoluteUrl(`/guides/${guide.slug}`),
  })),
};

export default function GuidesIndexPage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />

      <LandingNav />

      <main className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>
            {SITE.name}
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          <span>Guides</span>
        </nav>

        <header className={styles.indexHeader}>
          <h1 className={styles.indexTitle}>Guides</h1>
          <p className={styles.indexLead}>
            How to make ProjectShelf match the machine you actually work on, and how
            people use it for work that is not source code.
          </p>
        </header>

        {CATEGORY_ORDER.map((category) => {
          const guides = guidesByCategory(category);
          if (guides.length === 0) return null;

          return (
            <section key={category} className={styles.category}>
              <h2 className={styles.categoryTitle}>{CATEGORY_LABELS[category]}</h2>
              <div className={styles.cardGrid}>
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className={styles.card}
                  >
                    <h3 className={styles.cardTitle}>{guide.title}</h3>
                    <p className={styles.cardDescription}>{guide.description}</p>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardAudience}>{guide.audience[0]}</span>
                      <span>{guide.readingMinutes} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <div className={styles.cta}>
          <p className={styles.ctaText}>
            Nothing here needs reading first. The application works out of the box and
            these are for when you want it to fit your setup exactly.
          </p>
          <Link href="/app/projects" className={styles.ctaButton}>
            Open ProjectShelf
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
