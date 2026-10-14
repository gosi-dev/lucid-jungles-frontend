import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

const SILHOUETTE_ORDER = ['Titan', 'Bear', 'Everyday', 'Runner', 'Athlete', 'Lifter'];
const XP_PER_LEVEL = 500;

const RESONANCE_COLOUR = {
    pulse:  '#ABD49E',
    dream:  '#9EC4D4',
    shadow: '#A89EC4',
    style:  '#D4C29E',
};

const calcLevel    = xp => Math.floor((xp || 0) / XP_PER_LEVEL) + 1;
const xpInLevel    = xp => (xp || 0) % XP_PER_LEVEL;
const xpPct        = xp => (xpInLevel(xp) / XP_PER_LEVEL) * 100;

const S = {
    label: {
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#ABD49E',
        fontWeight: 500,
        fontFamily: 'system-ui, sans-serif',
    },
    value: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 600,
        letterSpacing: '0.02em',
        fontFamily: 'system-ui, sans-serif',
    },
    panel: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(171,212,158,0.15)',
        borderRadius: 2,
        padding: '22px 24px',
        marginBottom: 14,
    },
};

export default function Status() {
    const router = useRouter();
    const { isLoggedIn } = useSelector(state => state.registerSlice);

    const [membership, setMembership] = useState(null);
    const [kura,       setKura]       = useState(null);
    const [xpDisplay,  setXpDisplay]  = useState(0);
    const [visible,    setVisible]    = useState(false);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);

    useEffect(() => {
        if (!isLoggedIn) { router.replace('/signin'); return; }

        Promise.all([
            fetch('/api/fanbase/my-dojo',       { credentials: 'include' }).then(r => r.json()),
            fetch('/api/kura/daily-state',       { credentials: 'include' }).then(r => r.json()),
        ])
            .then(([dojoData, kuraData]) => {
                if (dojoData.membership) setMembership(dojoData.membership);
                if (kuraData.resonance)  setKura(kuraData);        // kura returns state directly
                setLoading(false);
                setTimeout(() => setVisible(true), 80);
            })
            .catch(err => {
                setError('Could not load status.');
                setLoading(false);
            });
    }, [isLoggedIn]);

    // XP count-up
    useEffect(() => {
        if (!membership || !visible) return;
        const target = membership.dojoXp || 0;
        if (target === 0) return;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setXpDisplay(current);
            if (current >= target) clearInterval(timer);
        }, 25);
        return () => clearInterval(timer);
    }, [membership, visible]);

    const shapeIdx = SILHOUETTE_ORDER.indexOf(membership?.currentBodyShape);
    const goalIdx  = SILHOUETTE_ORDER.indexOf(membership?.goalBodyShape);
    const level    = calcLevel(membership?.dojoXp);
    const progress = xpPct(membership?.dojoXp);
    const rColour  = RESONANCE_COLOUR[kura?.resonance] || '#ABD49E';
    const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ background: '#0A0A09', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...S.label, opacity: 0.35, animation: 'pulse 1.5s infinite' }}>
                    INITIALISING SYSTEM
                </span>
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={{
            background: '#0A0A09',
            minHeight: '100vh',
            padding: '36px 20px 60px',
            fontFamily: 'system-ui, sans-serif',
            opacity:    visible ? 1 : 0,
            transform:  visible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>

                {/* ── Header ────────────────────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <div style={{ ...S.label, opacity: 0.5, marginBottom: 6 }}>Lucid Jungles · System</div>
                        <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                            STATUS
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ ...S.label, opacity: 0.4, marginBottom: 4 }}>{today}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ ...S.label, opacity: 0.5 }}>LVL</span>
                            <span style={{ fontSize: 38, fontWeight: 800, color: '#ABD49E', lineHeight: 1 }}>
                                {level}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Resonance + Beast ─────────────────────────────────────── */}
                <div style={{ ...S.panel, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <div style={{ ...S.label, marginBottom: 8 }}>Resonance</div>
                        <div style={{ ...S.value, color: rColour, textTransform: 'capitalize' }}>
                            {kura?.resonance || '—'}
                        </div>
                    </div>
                    <div>
                        <div style={{ ...S.label, marginBottom: 8 }}>Beast</div>
                        <div style={{ ...S.value }}>{kura?.beast || '—'}</div>
                    </div>
                </div>

                {/* ── Shape + XP ────────────────────────────────────────────── */}
                <div style={{ ...S.panel }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
                        <div>
                            <div style={{ ...S.label, marginBottom: 8 }}>Shape Rank</div>
                            <div style={{ ...S.value }}>{membership?.currentBodyShape || '—'}</div>
                        </div>
                        <div>
                            <div style={{ ...S.label, marginBottom: 8 }}>Dojo XP</div>
                            <div style={{ ...S.value, fontVariantNumeric: 'tabular-nums' }}>
                                {xpDisplay.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* XP bar */}
                    <div style={{ ...S.label, marginBottom: 8, opacity: 0.6 }}>
                        Level Progress &nbsp;·&nbsp; {xpInLevel(membership?.dojoXp || 0)} / {XP_PER_LEVEL}
                    </div>
                    <div style={{ height: 3, background: 'rgba(171,212,158,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: visible ? `${progress}%` : '0%',
                            background: 'linear-gradient(90deg, rgba(171,212,158,0.6) 0%, #ABD49E 100%)',
                            borderRadius: 2,
                            transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        }} />
                    </div>
                </div>

                {/* ── Current Directive ─────────────────────────────────────── */}
                {kura && (
                    <div style={{ ...S.panel }}>
                        <div style={{ ...S.label, marginBottom: 14, color: rColour }}>Current Directive</div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>
                            "{kura.message}"
                        </div>
                        {kura.nudge && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div
                                    onClick={() => kura.nudgeRoute && router.push(kura.nudgeRoute)}
                                    style={{
                                        fontSize: 12,
                                        color: 'rgba(171,212,158,0.65)',
                                        cursor: kura.nudgeRoute ? 'pointer' : 'default',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {kura.nudge}
                                </div>
                                <div style={{ ...S.label, opacity: 0.4 }}>— Kṻra</div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Shape Journey ─────────────────────────────────────────── */}
                <div style={{ ...S.panel }}>
                    <div style={{ ...S.label, marginBottom: 20 }}>Shape Journey</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        {SILHOUETTE_ORDER.map((shape, i) => {
                            const isCurrent = i === shapeIdx;
                            const isGoal    = i === goalIdx && i !== shapeIdx;
                            const isPast    = shapeIdx > -1 && i < shapeIdx;

                            return (
                                <div key={shape} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Track line + dot */}
                                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{
                                            flex: 1,
                                            height: 1,
                                            background: isPast || isCurrent ? 'rgba(171,212,158,0.5)' : 'rgba(171,212,158,0.08)',
                                        }} />
                                        <div style={{
                                            width:  isCurrent ? 10 : 6,
                                            height: isCurrent ? 10 : 6,
                                            borderRadius: '50%',
                                            flexShrink: 0,
                                            background: isCurrent ? '#ABD49E'
                                                : isGoal    ? 'transparent'
                                                : isPast    ? 'rgba(171,212,158,0.35)'
                                                :             'rgba(171,212,158,0.08)',
                                            border: isGoal ? '1px solid rgba(171,212,158,0.35)' : 'none',
                                            boxShadow: isCurrent ? '0 0 10px rgba(171,212,158,0.5)' : 'none',
                                        }} />
                                        <div style={{
                                            flex: 1,
                                            height: 1,
                                            background: isPast ? 'rgba(171,212,158,0.5)' : 'rgba(171,212,158,0.08)',
                                        }} />
                                    </div>
                                    {/* Label */}
                                    <div style={{
                                        fontSize: 8,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        textAlign: 'center',
                                        color: isCurrent ? '#ABD49E'
                                            : isGoal    ? 'rgba(171,212,158,0.35)'
                                            : isPast    ? 'rgba(255,255,255,0.25)'
                                            :             'rgba(255,255,255,0.1)',
                                        fontWeight: isCurrent ? 700 : 400,
                                    }}>
                                        {shape}
                                        {isGoal && <div style={{ fontSize: 7, opacity: 0.6 }}>goal</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Body stats ────────────────────────────────────────────── */}
                {(membership?.heightCm || membership?.weightKg || membership?.desiredWeightKg) && (
                    <div style={{ ...S.panel, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        {membership.heightCm && (
                            <div>
                                <div style={{ ...S.label, marginBottom: 6 }}>Height</div>
                                <div style={{ ...S.value, fontSize: 16 }}>
                                    {membership.heightCm}
                                    <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 2 }}>cm</span>
                                </div>
                            </div>
                        )}
                        {membership.weightKg && (
                            <div>
                                <div style={{ ...S.label, marginBottom: 6 }}>Weight</div>
                                <div style={{ ...S.value, fontSize: 16 }}>
                                    {membership.weightKg}
                                    <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 2 }}>kg</span>
                                </div>
                            </div>
                        )}
                        {membership.desiredWeightKg && (
                            <div>
                                <div style={{ ...S.label, marginBottom: 6 }}>Target</div>
                                <div style={{ ...S.value, fontSize: 16 }}>
                                    {membership.desiredWeightKg}
                                    <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 2 }}>kg</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Error ─────────────────────────────────────────────────── */}
                {error && (
                    <div style={{ ...S.label, color: 'rgba(255,80,80,0.6)', textAlign: 'center', padding: '20px 0' }}>
                        {error}
                    </div>
                )}

                {/* ── Navigation ────────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    {[
                        { label: '← Map',  path: '/' },
                        { label: 'Dojo ↗', path: '/dojo' },
                        { label: 'Kṻra ↗', path: '/kura' },
                    ].map(({ label, path }) => (
                        <button
                            key={path}
                            onClick={() => router.push(path)}
                            style={{
                                ...S.label,
                                background: 'transparent',
                                border: '1px solid rgba(171,212,158,0.18)',
                                color: 'rgba(171,212,158,0.7)',
                                padding: '10px 18px',
                                cursor: 'pointer',
                                borderRadius: 2,
                                transition: 'border-color 0.2s, color 0.2s',
                            }}
                            onMouseEnter={e => { e.target.style.borderColor = 'rgba(171,212,158,0.5)'; e.target.style.color = '#ABD49E'; }}
                            onMouseLeave={e => { e.target.style.borderColor = 'rgba(171,212,158,0.18)'; e.target.style.color = 'rgba(171,212,158,0.7)'; }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}
