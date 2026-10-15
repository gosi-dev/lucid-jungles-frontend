// components/MockAvatar.jsx
//
// A base's face.
//
// A base is somebody's home, and a home with no face reads as an empty room.
// Until now the base drew an empty tile until its owner uploaded a picture — and
// nobody has. So every base has a face:
//
//   - the real picture when the owner has one (`profile_picture`, which
//     GET /api/homes/u/:username already exposes on its public allow-list), and
//   - otherwise a mock avatar derived from the username.
//
// The mock is deterministic on purpose: FNV-1a over the name picks the tone and
// the monogram, so the same base draws the same face on every machine, after
// every reload, and in every screenshot scripts/ takes. A random one would be a
// different person every time you walked in.
//
// Nothing is copied and nothing is fetched: one letter from the name, one tone
// from the palette the rest of the app already uses.
import { useMemo } from 'react';

// One tone per avatar, all already in the design language.
const TONES = [
  { field: 'rgba(171,212,158,0.14)', ink: '#ABD49E' }, // sage — the house colour
  { field: 'rgba(212,184,150,0.16)', ink: '#D4B896' }, // sand
  { field: 'rgba(143,199,232,0.16)', ink: '#8FC7E8' }, // water
  { field: 'rgba(139,92,246,0.20)',  ink: '#B79CF7' }, // violet — communities
  { field: 'rgba(233,4,12,0.16)',    ink: '#E9040C' }, // flare
  { field: 'rgba(227,227,227,0.12)', ink: '#E3E3E3' }, // bone
];

export const AVATAR_TONES = TONES;

// FNV-1a, 32-bit. Dependency-free, and — unlike a sum of char codes — two names
// that differ by a single letter land in different buckets far more often.
export function toneIndexForName(name) {
  const key = String(name == null ? '' : name).trim().toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % TONES.length;
}

// One letter, always: the first character of the handle. A rule with no
// exceptions is a rule that cannot disagree with itself between two screens.
export function monogramForName(name) {
  const key = String(name == null ? '' : name).trim().replace(/[^a-zA-Z0-9]/g, '');
  return key ? key[0].toUpperCase() : '?';
}

// `size` is a number of pixels or any CSS length ("100%" when the wrapper owns
// the box). `data-avatar="photo" | "mock"` lets a test tell the two apart.
export default function MockAvatar({ username, src, size = 44, radius = 0, fontSize, style, label }) {
  const toneIndex = useMemo(() => toneIndexForName(username), [username]);
  const letter = useMemo(() => monogramForName(username), [username]);
  const tone = TONES[toneIndex];
  const sizePx = typeof size === 'number' ? size : null;

  const box = { width: size, height: size, borderRadius: radius, flexShrink: 0 };

  if (src) {
    return (
      <div data-avatar="photo" style={{ ...box, overflow: 'hidden', background: '#101010', ...style }}>
        <img
          src={src}
          alt={label || `${username || 'user'} avatar`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label || `${username || 'user'} avatar`}
      data-avatar="mock"
      data-avatar-name={String(username || '').toLowerCase()}
      data-avatar-tone={toneIndex}
      style={{
        ...box,
        background: tone.field,
        border: `1px solid ${tone.ink}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.02em',
        color: tone.ink, lineHeight: 1, overflow: 'hidden', userSelect: 'none',
        fontSize: fontSize || (sizePx ? Math.round(sizePx * 0.42) : 20),
        ...style,
      }}
    >
      {letter}
    </div>
  );
}
