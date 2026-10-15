// components/MvpShell.jsx
// Shared dark shell for the MVP contract routes (World / Home / Feed / Chat /
// Quests / commerce). Matches the app's emerald-on-charcoal theme.
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useIsDesktop } from '../hooks/useIsDesktop';

const GREEN = '#ABD49E';
const LINE = 'rgba(171,212,158,0.15)';
// The same content width the event and entity pages use, so every desktop surface in the
// app lines up on one grid instead of each page picking its own.
export const CONTENT_MAX = 1180;

export default function MvpShell({ title, subtitle, children, showBack = true, actions = null }) {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  return (
    <>
      <Head>
        <title>{title} — Lucid Jungles</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#151413',
          color: GREEN,
          // The 75px tab bar sits at the bottom of the window at every width, so its space
          // is reserved at every width too (BottomNav).
          paddingBottom: 100,
          fontFamily: 'CodeSaver, monospace',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#151413',
            borderBottom: `1px solid ${LINE}`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              height: 54,
              maxWidth: isDesktop ? CONTENT_MAX : undefined,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isDesktop ? '0 32px' : '0 16px',
            }}
          >
            <button
              type="button"
              onClick={() => (showBack ? router.back() : null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: GREEN,
                cursor: 'pointer',
                fontSize: 18,
                visibility: showBack ? 'visible' : 'hidden',
              }}
              aria-label="Back"
            >
              ←
            </button>
            <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
              {subtitle ? (
                <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1 }}>{subtitle}</div>
              ) : null}
            </div>
            <div style={{ minWidth: 18, textAlign: 'right' }}>{actions}</div>
          </div>
        </div>
        <div
          style={{
            maxWidth: isDesktop ? CONTENT_MAX : undefined,
            margin: '0 auto',
            padding: isDesktop ? '28px 32px 0' : 16,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export const MVP_GREEN = GREEN;
export const MVP_LINE = LINE;
export const mvpCard = {
  border: `1px solid ${LINE}`,
  padding: 16,
  marginBottom: 12,
};
export const mvpInput = {
  width: '100%',
  background: 'transparent',
  border: `1px solid ${LINE}`,
  color: GREEN,
  padding: '10px 12px',
  fontFamily: 'CodeSaver, monospace',
  fontSize: 13,
  marginBottom: 10,
  boxSizing: 'border-box',
};
export const mvpButton = (disabled = false) => ({
  background: disabled ? 'transparent' : GREEN,
  color: disabled ? GREEN : '#151413',
  border: `1px solid ${GREEN}`,
  padding: '10px 16px',
  fontFamily: 'CodeSaver, monospace',
  fontSize: 12,
  letterSpacing: 1,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});
