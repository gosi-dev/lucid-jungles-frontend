// components/VitalBars.jsx
//
// Compact status bars — LUCID_JUNGLES_COMPETITIVE_ANALYSIS.md §7 #4. The design
// system already called for "compact status bars for energy, XP, mood"; this is
// that component.
//
// It is purely presentational: it renders whatever vitals it is handed, so the
// same component serves your own base and a base you are visiting. Nothing here
// invents a number — see deriveVitals, which only emits bars backed by a field
// that actually exists on the user.

// One accent per vital, in the established palette.
const TONES = {
  xp:     '#ABD49E',
  streak: '#ABD49E',
  mood:   '#C9A227',
  energy: '#8FC7E8',
  visits: '#E3E3E3',
};

// XP resets per level block; the platform has no explicit threshold table yet, so
// the bar reads progress within the current 100-XP block. Both flex sides in the
// profile drawer must stay non-zero, hence the clamp.
export const XP_BLOCK = 100;

export default function VitalBars({ vitals = [], style }) {
  const shown = vitals.filter(Boolean);
  if (!shown.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {shown.map(({ key, label, value, max, display, tone }) => {
        const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
        const color = tone || TONES[key] || '#ABD49E';
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`${label}: ${value}/${max}`}>
            <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.12em', color, width: 42, flexShrink: 0 }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 6, border: '1px solid rgba(171,212,158,0.3)' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color }}/>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#E3E3E3', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
              {display != null ? display : `${value}/${max}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Only the vitals the backend can actually back. Energy and mood exist as
// concepts (Kura's resonance, /api/kura/daily-state) but that reading is private
// to its owner, so a visitor's view shows the public vitals instead of a
// fabricated energy number.
export function deriveVitals(owner, visits) {
  if (!owner) return [];

  const xp = Number(owner.xp) || 0;
  const streak = Number(owner.loginStreak) || 0;
  const visitCount = (visits && Number(visits.total)) || 0;
  // A new base with no visits must still show a bar, so scale the visit bar
  // against a soft target rather than the visitor's own maximum.
  const visitTarget = Math.max(10, visitCount);

  return [
    { key: 'xp',     label: 'XP',     value: xp % XP_BLOCK, max: XP_BLOCK, display: `${xp} XP` },
    { key: 'streak', label: 'STREAK', value: Math.min(streak, 7), max: 7,  display: `${streak}D` },
    { key: 'visits', label: 'VISITS', value: visitCount, max: visitTarget, display: String(visitCount) },
  ];
}
