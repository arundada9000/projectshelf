import type { ReactElement } from 'react';

export const OG_SIZE = {
  width: 1200,
  height: 630,
} as const;

const CARD_BACKGROUND = '#0B1120';
const CARD_INK = '#FFFFFF';
const CARD_MUTED = '#94A3B8';
const CARD_ACCENT = '#3B82F6';

const STACK = [
  { top: 210, width: 240, opacity: 0.45 },
  { top: 260, width: 240, opacity: 0.72 },
  { top: 310, width: 240, opacity: 1 },
] as const;

/** Renders the ProjectShelf brand mark: three shelves, like the app icon. */
function ShelfMark({ scale = 1 }: { scale?: number }) {
  return (
    <svg
      width={120 * scale}
      height={120 * scale}
      viewBox="0 0 512 512"
      role="img"
      aria-label="ProjectShelf"
    >
      <rect width="512" height="512" rx="112" fill={CARD_INK} />
      <rect x="120" y="136" width="272" height="46" rx="16" fill={CARD_ACCENT} opacity="0.45" />
      <rect x="120" y="233" width="272" height="46" rx="16" fill={CARD_ACCENT} opacity="0.72" />
      <rect x="120" y="330" width="272" height="46" rx="16" fill={CARD_ACCENT} />
    </svg>
  );
}

/**
 * The reader-safe description repeated on social cards, keeping a single
 * canonical sentence across Open Graph and Twitter.
 */
export const CARD_TAGLINE =
  'A local-first inventory for developers with many projects. Search everything you have built, select several at once, and generate the exact commands to open them in your own tools.';

interface SocialCardProps {
  title?: string;
  description?: string;
}

/** Shared 1200x630 social card used by opengraph-image and twitter-image. */
export function SocialCard({
  title = 'ProjectShelf',
  description = CARD_TAGLINE,
}: SocialCardProps): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: CARD_BACKGROUND,
        color: CARD_INK,
        fontFamily: '"SF Pro Display", "Segoe UI", system-ui, sans-serif',
        padding: 64,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <ShelfMark scale={1.6} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.4,
                color: CARD_MUTED,
                display: 'flex',
                flexWrap: 'wrap',
                maxWidth: 900,
              }}
            >
              {description}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 24,
            color: CARD_MUTED,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
              height: 44,
            }}
          >
            {STACK.map((shelf) => (
              <div
                key={shelf.top}
                style={{
                  width: shelf.width,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: CARD_ACCENT,
                  opacity: shelf.opacity,
                  marginBottom: shelf.top - 210,
                }}
              />
            ))}
          </div>
          <span>Local-first · Offline · No account required</span>
        </div>
      </div>
    </div>
  );
}