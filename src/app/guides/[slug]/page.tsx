import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { GUIDES, getGuide, relatedGuides, CATEGORY_LABELS } from '@/lib/guides';
import { SITE, absoluteUrl } from '@/lib/site';
import { GuideBody } from '@/components/guides/GuideBody';
import { LandingNav } from '@/components/landing/LandingNav';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { ScrollToTop } from '@/components/landing/ScrollToTop';
import styles from '@/components/guides/Guides.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Every guide is known at build time, so all of them are prerendered. */
export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  const url = absoluteUrl(`/guides/${guide.slug}`);

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      type: 'article',
      publishedTime: guide.updated,
      modifiedTime: guide.updated,
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const headings = guide.blocks.filter((block) => block.type === 'heading');
  const related = relatedGuides(guide);
  const url = absoluteUrl(`/guides/${guide.slug}`);

  // The procedures in the guide, described for crawlers and assistants.
  const stepBlocks = guide.blocks.filter((block) => block.type === 'steps');
  const howToSteps = stepBlocks.flatMap((block) =>
    block.steps.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.code ? `${step.text} ${step.code}` : step.text,
    }))
  );

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': howToSteps.length > 0 ? 'HowTo' : 'TechArticle',
      name: guide.title,
      headline: guide.title,
      description: guide.description,
      url,
      dateModified: guide.updated,
      datePublished: guide.updated,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        name: SITE.name,
        url: SITE.origin,
      },
      ...(howToSteps.length > 0 ? { step: howToSteps } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE.name,
          item: SITE.origin,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Guides',
          item: absoluteUrl('/guides'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: guide.title,
          item: url,
        },
      ],
    },
  ];

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
          <Link href="/guides" className={styles.breadcrumbLink}>
            Guides
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          <span>{CATEGORY_LABELS[guide.category]}</span>
        </nav>

        <article className={styles.article}>
          <div className={styles.articleMain}>
            <header className={styles.articleHeader}>
              <h1 className={styles.articleTitle}>{guide.title}</h1>
              <p className={styles.articleLead}>{guide.description}</p>
              <div className={styles.articleMeta}>
                <span>{guide.audience.join(', ')}</span>
                <span className={styles.articleMetaDot} aria-hidden="true">
                  ·
                </span>
                <span>{guide.readingMinutes} min read</span>
                <span className={styles.articleMetaDot} aria-hidden="true">
                  ·
                </span>
                <span>
                  Updated{' '}
                  <time dateTime={guide.updated}>
                    {new Date(guide.updated).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </span>
              </div>
            </header>

            <GuideBody blocks={guide.blocks} />

            {related.length > 0 && (
              <aside className={styles.related}>
                <h2 className={styles.relatedTitle}>Related guides</h2>
                <div className={styles.relatedList}>
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/guides/${item.slug}`}
                      className={styles.relatedLink}
                    >
                      <span className={styles.relatedLinkTitle}>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </aside>
            )}

            <div className={styles.cta}>
              <p className={styles.ctaText}>
                ProjectShelf runs entirely in your browser. There is no account and
                nothing to install before you try it.
              </p>
              <Link href="/app/projects" className={styles.ctaButton}>
                Open ProjectShelf
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {headings.length > 2 && (
            <nav className={styles.contents} aria-label="On this page">
              <h2 className={styles.contentsTitle}>On this page</h2>
              <ul className={styles.contentsList}>
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a href={`#${heading.id}`} className={styles.contentsLink}>
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </article>
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
