import React from 'react';
import Link from 'next/link';
import { GitBranch, Globe, ArrowUpRight } from 'lucide-react';
import { DEVELOPER } from '@/lib/developer';
import { InstallButton } from '@/components/features/InstallButton';
import styles from './Landing.module.css';

const PRODUCT_LINKS = [
  { label: 'Open the app', href: '/app/projects' },
  { label: 'Projects', href: '/app/projects' },
  { label: 'Launch sets', href: '/app/launch-sets' },
  { label: 'Settings', href: '/app/settings' },
  { label: 'User manual', href: '/app/manual' },
];

const GUIDE_LINKS = [
  { label: 'All guides', href: '/guides' },
  { label: 'Windows setup', href: '/guides/windows-setup' },
  { label: 'macOS setup', href: '/guides/macos-setup' },
  { label: 'Linux setup', href: '/guides/linux-setup' },
  { label: 'Command templates', href: '/guides/command-templates' },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrandCol}>
            <span className={styles.footerBrand}>
              <span className={styles.navLogo} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              ProjectShelf
            </span>
            <p className={styles.footerTagline}>
              A local inventory for the projects you have already built, and the
              commands to open them again.
            </p>
            <div className={styles.footerInstall}>
              <InstallButton variant="standalone" />
            </div>
          </div>

          <nav className={styles.footerNav} aria-label="Application">
            <h2 className={styles.footerNavTitle}>Application</h2>
            <ul className={styles.footerLinkList}>
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.footerNav} aria-label="Guides">
            <h2 className={styles.footerNavTitle}>Guides</h2>
            <ul className={styles.footerLinkList}>
              {GUIDE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Developer credit: present and legible, deliberately not the
            loudest thing on the page. */}
        <div className={styles.credit}>
          <div className={styles.creditMain}>
            <span className={styles.creditAvatar} aria-hidden="true">
              {DEVELOPER.initials}
            </span>
            <div className={styles.creditText}>
              <p className={styles.creditName}>
                Designed and built by {DEVELOPER.name}
              </p>
              <p className={styles.creditRole}>
                {DEVELOPER.role} · {DEVELOPER.location}
              </p>
            </div>
          </div>

          <div className={styles.creditLinks}>
            <a
              href={DEVELOPER.website}
              className={styles.creditLink}
              target="_blank"
              rel="noopener noreferrer me"
            >
              <Globe size={14} />
              Portfolio
              <ArrowUpRight size={12} className={styles.creditLinkArrow} />
            </a>
            <a
              href={DEVELOPER.github}
              className={styles.creditLink}
              target="_blank"
              rel="noopener noreferrer me"
            >
              <GitBranch size={14} />
              {DEVELOPER.handle}
              <ArrowUpRight size={12} className={styles.creditLinkArrow} />
            </a>
          </div>
        </div>

        <p className={styles.footerFinePrint}>
          Runs entirely in your browser. No account, no server, no tracking.
        </p>
      </div>
    </footer>
  );
}
