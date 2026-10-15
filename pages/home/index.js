// pages/home/index.js — HOME BASE (DATA_MODEL.md: HomeBase; API: /api/home/:userId)
//
// Two jobs, and the second one is new:
//
//   1. the base's own settings — theme, decor (as before);
//   2. THE PROPERTY OFFICE — the Lagos housing ladder (ONE ROOM → FACE-ME-I-FACE-YOU
//      → FLAT → DUPLEX → COMPOUND) sold as a listing, each tier with its plan, its
//      rooms, its capacity and its plot. Moving in writes HomeBase.upgradeLevel,
//      which already existed and already persists, and /[username] redraws the base
//      from it (lib/plan.js).
//
// The prices are the demo naira prices in lib/plan.js: checkout is not wired, so the
// move is recorded and the screen says plainly that nothing was charged.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../../components/MvpShell';
import {
  TIERS, tierFor, planBounds, roomsOnFloor, deskRectFor, themePalette, formatNaira, DESK_UNITS,
} from '../../lib/plan';

const THEMES = ['jungle', 'sunset', 'midnight', 'neon'];

// A tier's plan, as a rectangle drawing. It is the same geometry /[username] draws,
// from the same module — a listing that promised rooms the base did not have would
// be worse than no listing at all.
function PlanThumb({ tier, theme, height = 116 }) {
  const palette = themePalette(theme);
  const bounds = planBounds(tier);
  const desk = deskRectFor(tier, 1);
  const ground = roomsOnFloor(tier, 1);
  const upstairs = roomsOnFloor(tier, 2);

  return (
    <svg
      viewBox={`-16 -16 ${bounds.w + 32} ${bounds.h + 32}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`${tier.name} plan: ${tier.rooms.map((r) => r.label).join(', ')}`}
      style={{ display: 'block', background: palette.floor, border: `1px solid ${palette.wall}` }}
    >
      {upstairs.map((room) => (
        <rect
          key={room.id}
          x={room.x}
          y={room.y}
          width={room.w}
          height={room.h}
          fill="none"
          stroke={palette.wall}
          strokeWidth={4}
          strokeDasharray="14 10"
          opacity={0.5}
        />
      ))}
      {ground.map((room) => (
        <rect
          key={room.id}
          x={room.x}
          y={room.y}
          width={room.w}
          height={room.h}
          fill={palette.floor}
          stroke={palette.wall}
          strokeWidth={5}
        />
      ))}
      {desk ? (
        <rect x={desk.x} y={desk.y} width={DESK_UNITS.w} height={DESK_UNITS.h} fill={palette.wall} opacity={0.7} />
      ) : null}
    </svg>
  );
}

export default function HomeBasePage() {
  const router = useRouter();
  const { isLoggedIn, username } = useSelector((state) => state.registerSlice);

  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('jungle');
  const [decorInput, setDecorInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // The tier this base is on: HomeBase.upgradeLevel, which is what /[username] reads
  // to decide which plan to draw.
  const tier = useMemo(() => tierFor(home && home.upgradeLevel), [home]);

  const load = useCallback(async () => {
    try {
      const profileRes = await fetch(`/api/user/u/${username}`, { credentials: 'include' });
      if (!profileRes.ok) throw new Error('Could not load profile');
      const profile = await profileRes.json();
      const id = profile?.data?._id || profile?._id;
      const res = await fetch(`/api/home/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHome(data.data);
        setTheme(data.data?.theme || 'jungle');
      } else {
        setHome(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    load();
  }, [isLoggedIn, load, router]);

  async function saveBase() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/home', {
        method: home ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save base');
      setHome(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addDecor() {
    if (!decorInput.trim()) return;
    const decorItems = [...(home?.decorItems || []), decorInput.trim()];
    setSaving(true);
    try {
      const res = await fetch('/api/home', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, decorItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not update base');
      setHome(data.data);
      setDecorInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Moving in up the ladder. upgradeLevel is the base's own column, so this is a
  // real change to the record (a reload, and somebody else's visit, both see it) —
  // what is *not* real is the money, and the button says so.
  async function moveToTier(level) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/home', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeLevel: level, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not move you in');
      setHome(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MvpShell title="HOME BASE" subtitle={username ? `@${username}` : 'YOUR PERSONAL SPACE'}>
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

          {/* Where you live: the tier's plan, drawn from the same geometry the base
              itself is drawn from. */}
          <div style={mvpCard} data-tier-card={tier.level}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>
              TIER {tier.level} OF {TIERS.length}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
              {tier.name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 14 }}>{tier.tagline}</div>
            <PlanThumb tier={tier} theme={home?.theme || 'jungle'} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, opacity: 0.85, marginTop: 14 }}>
              <span>
                {tier.rooms.length} {tier.rooms.length === 1 ? 'room' : 'rooms'}
                {tier.floors.length > 1 ? ` on ${tier.floors.length} floors` : ''}
              </span>
              <span>{tier.slots} furniture slots</span>
              <span>{tier.plot} plot {tier.plot === 1 ? 'cell' : 'cells'}</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
              {home
                ? `${(home.decorItems || []).length} decor items · ${(home.furniture || []).length} equipped items`
                : 'Claim your base to place furniture and decor.'}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link href={username ? `/${username}` : '/home'} style={{ color: '#ABD49E', fontSize: 12 }}>
                STAND IN YOUR BASE →
              </Link>
            </div>
          </div>

          {/* The property office: the ladder, as a listing. */}
          <div style={mvpCard} data-property-office="">
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 4 }}>
              THE PROPERTY OFFICE
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 14, lineHeight: 1.5 }}>
              ONE ROOM → FACE-ME-I-FACE-YOU → FLAT → DUPLEX → COMPOUND. Each step buys rooms, floor
              space and more of the plot. Moving in records the tier on your base straight away, and
              your base redraws itself around it.
            </div>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {TIERS.map((t) => {
                const here = t.level === tier.level;
                const next = t.level === tier.level + 1;
                const future = t.level > tier.level + 1;
                const claim = !home && t.level === 1;

                return (
                  <div
                    key={t.level}
                    data-listing={t.level}
                    style={{
                      border: `1px solid ${here ? '#ABD49E' : 'rgba(171,212,158,0.35)'}`,
                      background: here ? 'rgba(171,212,158,0.08)' : 'transparent',
                      padding: 12,
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}
                  >
                    <PlanThumb tier={t} theme={home?.theme || 'jungle'} height={92} />
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                      TIER {t.level} · {t.name}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.45 }}>{t.tagline}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {t.rooms.map((room) => room.label).join(' · ')}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {t.slots} slots · plot {t.plot}
                      {t.floors.length > 1 ? ` · ${t.floors.length} floors` : ''}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 'auto' }}>
                      {t.price ? formatNaira(t.price) : 'Starter home'}
                    </div>
                    <button
                      type="button"
                      disabled={saving || (!next && !claim)}
                      onClick={() => (next || claim) && moveToTier(t.level)}
                      style={{
                        ...mvpButton(saving || (!next && !claim)),
                        background: here ? '#ABD49E' : undefined,
                        color: here ? '#151413' : undefined,
                      }}
                    >
                      {here ? 'YOU LIVE HERE' : claim ? 'CLAIM THIS BASE' : next ? `MOVE IN — ${formatNaira(t.price)}` : future ? `LOCKED — ${TIERS[t.level - 2].name} FIRST` : 'PASSED'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, fontSize: 10, opacity: 0.65, lineHeight: 1.5 }}>
              DEMO PRICE — THE MOVE IS RECORDED ON YOUR BASE AND NO PAYMENT IS TAKEN YET. REAL
              CHECKOUT WIRES IN WITH THE STORE, WHICH IS THE SAME PASS THAT MAKES DESK ITEMS
              PURCHASABLE.
            </div>
          </div>
          {/* Theme is no longer a word on a card: it picks the floor, the grid and the
              wall colour of the plan view (lib/plan.js THEME_PALETTES). */}
          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>
              THEME — WHAT YOUR FLOORS AND WALLS ARE MADE OF
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  style={{
                    ...mvpButton(false),
                    background: theme === t ? '#ABD49E' : 'transparent',
                    color: theme === t ? '#151413' : '#ABD49E',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" onClick={saveBase} disabled={saving} style={mvpButton(saving)}>
              {home ? 'UPDATE BASE' : 'CREATE BASE'}
            </button>
          </div>

          {home ? (
            <div style={mvpCard}>
              <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>DECOR</div>
              {(home.decorItems || []).length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>No decor yet.</div>
              ) : (
                <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13 }}>
                  {home.decorItems.map((d, i) => (
                    <li key={`${d}-${i}`}>{d}</li>
                  ))}
                </ul>
              )}
              <input
                value={decorInput}
                onChange={(e) => setDecorInput(e.target.value)}
                placeholder="Add decor item"
                style={mvpInput}
              />
              <button
                type="button"
                onClick={addDecor}
                disabled={saving || !decorInput.trim()}
                style={mvpButton(saving || !decorInput.trim())}
              >
                ADD DECOR
              </button>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Link href="/store" style={{ color: '#ABD49E', fontSize: 12 }}>STORE →</Link>
            <Link href="/events" style={{ color: '#ABD49E', fontSize: 12 }}>EVENTS →</Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}

