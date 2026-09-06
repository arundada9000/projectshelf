import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Plus_Jakarta_Sans,
  Outfit,
  JetBrains_Mono,
  Geist,
} from 'next/font/google';
import '@/styles/globals.css';

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
  title: 'ProjectShelf: Your Developer Command Center',
  description:
    'Organize, search, and launch all your software projects from one place. Offline-first, keyboard-driven, and fully configurable.',
  keywords: [
    'developer tools',
    'project manager',
    'command center',
    'offline-first',
    'PWA',
    'project organizer',
  ],
  authors: [{ name: 'Arun' }],
  openGraph: {
    title: 'ProjectShelf: Your Developer Command Center',
    description:
      'Organize, search, and launch all your software projects from one place.',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
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
      <body>{children}</body>
    </html>
  );
}
