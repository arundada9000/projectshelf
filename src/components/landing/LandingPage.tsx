import React from 'react';
import Link from 'next/link';
import {
  Terminal,
  Keyboard,
  Layers,
  HardDrive,
  SlidersHorizontal,
  Palette,
  ArrowRight,
} from 'lucide-react';
import { ProductPreview } from './ProductPreview';
import { ChaosField } from './ChaosField';
import { SelectionDemo } from './SelectionDemo';
import { CommandFlow } from './CommandFlow';
import { LandingNav } from './LandingNav';
import { SiteFooter } from './SiteFooter';
import { ScrollReveal } from './ScrollReveal';
import { Parallax } from './Parallax';
import { ScrollToTop } from './ScrollToTop';
import styles from './Landing.module.css';

// ── Content ────────────────────────────────────────────────

const CAPABILITIES = [
  {
    icon: <SlidersHorizontal size={17} />,
    title: 'Your tools, not a fixed list',
    body: 'Terminals, editors, and applications are entries you can add, edit, reorder, or delete. The Windows presets are a starting point, not a limit.',
  },
  {
    icon: <Keyboard size={17} />,
    title: 'Bindings you choose',
    body: 'Every action is in the command palette and bindable to any key. Rebind anything, and conflicts are flagged while you record them.',
  },
  {
    icon: <Layers size={17} />,
    title: 'Launch sets',
    body: 'Group the projects you open together. Launching a set generates commands for all of them, with the same defaults and overrides as a manual selection.',
  },
  {
    icon: <HardDrive size={17} />,
    title: 'Local, and staying that way',
    body: 'Everything lives in IndexedDB in your browser. No account, no server, no telemetry. Export a JSON backup whenever you want one.',
  },
  {
    icon: <Palette size={17} />,
    title: 'Twelve themes',
    body: 'Light and dark, plus ten more built on the same semantic tokens, so every one keeps its contrast and interaction states intact.',
  },
  {
    icon: <Terminal size={17} />,
    title: 'Nothing runs itself',
    body: 'A web page cannot execute anything on your machine, and this one does not pretend to. It writes the text and copies it. You decide when it runs.',
  },
];

const FAQ = [
  {
    q: 'Does ProjectShelf run commands on my machine?',
    a: 'No. A web page cannot, and it does not pretend otherwise. It generates the exact text for the tools you have configured and copies it, ready to paste into your terminal.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In your browser, using IndexedDB. There is no account and no server component. You can export everything to a JSON file and import it again later.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. Once loaded, the application and all your project data are available without a network connection. Only external links, like a repository or a hosted site, need one.',
  },
  {
    q: 'Is it Windows only?',
    a: 'The built-in presets are Windows-oriented, but every terminal, editor, and application is an editable entry. Add your own for macOS or Linux, or delete the presets entirely.',
  },
];

// ── Landing Page ───────────────────────────────────────────

export function LandingPage() {
  return (
    <div className={styles.landing}>
      <LandingNav />

      <main id="main">
        {/* ── 1. The mess ─────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroLayout}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Local-first project inventory</p>
              <h1 className={styles.largeTitle}>
                Your projects have been everywhere.
              </h1>
              <p className={styles.heroLead}>
                Across drives, repositories, hosts, and folders you named at two in
                the morning. ProjectShelf puts them somewhere, and gives you the
                command to open any of them again.
              </p>
              <div className={styles.heroActions}>
                <Link href="/app/projects" className={styles.primaryCta}>
                  Open ProjectShelf
                  <ArrowRight size={16} />
                </Link>
                <span className={styles.heroNote}>
                  No account. Nothing leaves your browser.
                </span>
              </div>
            </div>

            <ChaosField />
          </div>
        </section>

        {/* ── 2. Now they are somewhere ───────────────── */}
        <section className={styles.section}>
          <ScrollReveal>
            <div className={styles.sectionNarrow}>
              <p className={styles.sectionKicker}>Organised</p>
              <h2 className={styles.sectionTitle}>Now they are somewhere.</h2>
              <p className={styles.sectionLead}>
                One list, searchable across names, paths, repositories, tags, and
                anything else you wrote down. Filter it, sort it, and stop opening
                folders to find out what is inside them.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal order={1} className={styles.sectionFigure}>
            <Parallax distance={46} fromScale={0.97}>
              <ProductPreview />
            </Parallax>
          </ScrollReveal>
        </section>

        {/* ── 3. Select more than one ─────────────────── */}
        <section className={styles.section}>
          <ScrollReveal>
            <div className={styles.sectionNarrow}>
              <p className={styles.sectionKicker}>Selected</p>
              <h2 className={styles.sectionTitle}>
                Projects do not need opening one at a time.
              </h2>
              <p className={styles.sectionLead}>
                Click, shift-click, or select the lot. Every action then applies to
                the whole selection, and produces one command per project.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal order={1} className={styles.sectionFigure}>
            <Parallax distance={34}>
              <SelectionDemo />
            </Parallax>
          </ScrollReveal>
        </section>

        {/* ── 4. The command engine ───────────────────── */}
        <section className={styles.section}>
          <ScrollReveal>
            <div className={styles.sectionNarrow}>
              <p className={styles.sectionKicker}>Generated</p>
              <h2 className={styles.sectionTitle}>
                Do not launch projects. Launch workflows.
              </h2>
              <p className={styles.sectionLead}>
                A selection meets your configuration and comes out as text. Which
                tool gets used is decided by a global default, overridden by a
                project, overridden again by a one-time choice, and never by
                accident.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal order={1} className={styles.sectionFigure}>
            <Parallax distance={28}>
              <CommandFlow />
            </Parallax>
          </ScrollReveal>
        </section>

        {/* ── 5. Everything else ──────────────────────── */}
        <section className={styles.section}>
          <ScrollReveal>
            <h2 className={styles.sectionTitle}>The rest of it</h2>
          </ScrollReveal>

          <ul className={styles.insetGroup}>
            {CAPABILITIES.map((item, index) => (
              <ScrollReveal
                as="li"
                key={item.title}
                order={index}
                className={styles.insetRow}
              >
                <span className={styles.insetIcon}>{item.icon}</span>
                <div className={styles.insetBody}>
                  <h3 className={styles.insetTitle}>{item.title}</h3>
                  <p className={styles.insetText}>{item.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </ul>
        </section>

        {/* ── 6. Questions ────────────────────────────── */}
        <section className={styles.section}>
          <ScrollReveal>
            <h2 className={styles.sectionTitle}>Questions</h2>
          </ScrollReveal>

          <dl className={styles.insetGroup}>
            {FAQ.map((item, index) => (
              <ScrollReveal key={item.q} order={index} className={styles.faqRow}>
                <dt className={styles.faqQuestion}>{item.q}</dt>
                <dd className={styles.faqAnswer}>{item.a}</dd>
              </ScrollReveal>
            ))}
          </dl>
        </section>

        {/* ── 7. Closing ──────────────────────────────── */}
        <ScrollReveal as="section" className={styles.closing}>
          <h2 className={styles.closingTitle}>Start with one project.</h2>
          <p className={styles.closingBody}>
            A name and a folder path is enough. Everything else is optional, and it
            is useful from the first entry.
          </p>
          <Link href="/app/projects" className={styles.primaryCta}>
            Open ProjectShelf
            <ArrowRight size={16} />
          </Link>
        </ScrollReveal>
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
}
