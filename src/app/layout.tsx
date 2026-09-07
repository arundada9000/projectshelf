import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Plus_Jakarta_Sans,
  Outfit,
  JetBrains_Mono,
  Geist,
} from 'next/font/google';
import '@/styles/globals.css';
import { SITE } from '@/lib/site';
import { APPEARANCE_BOOT_SCRIPT } from '@/lib/appearance';

// ── Font Loading ───────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

// ── Metadata ───────────────────────────────────────────────

export const metadata: Metadata = {
  // Lets every page express canonical and Open Graph URLs as paths.
  metadataBase: new URL(SITE.origin),
  title: {
    default: 'ProjectShelf: find and launch your software projects',
    template: '%s | ProjectShelf',
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'project manager',
    'developer tools',
    'local-first',
    'offline first',
    'PWA',
    'command generator',
    'project inventory',
  ],
  authors: [{ name: 'Arun Neupane', url: 'https://arunneupane.vercel.app' }],
  creator: 'Arun Neupane',
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ProjectShelf',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1120',
};

// ── Root Layout ────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = [
    inter.variable,
    jakarta.variable,
    outfit.variable,
    jetbrainsMono.variable,
    geist.variable,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html
      lang="en"
      className={fontVariables}
      data-theme="dark"
      data-font="inter"
      data-density="comfortable"
      suppressHydrationWarning
    >
      <body>
        {/*
          Restores the saved theme, font, and density before first paint.
          Must stay ahead of {children} so the page never flashes the
          server-rendered default.
        */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
