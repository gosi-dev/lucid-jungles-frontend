/**
 * /pages/dojo/index.js
 * Dojo member dashboard — shows today's workout, XP, and body shape progress.
 * Query params: fanbaseId
 */
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import NavBar from '../../components/NavBar';

const SILHOUETTE_ORDER = ['Titan', 'Bear', 'Everyday', 'Runner', 'Athlete', 'Lifter'];
const DOJO_XP_THRESHOLD = 500;

// How far through the current shape level (0–100)
const shapeProgress = (xp) => {
    const xpInLevel = xp % DOJO_XP_THRESHOLD;
    return Math.round((xpInLevel / DOJO_XP_THRESHOLD) * 100);
};

export default function Dojo() {
    const router  = useRouter();
    const { fanbaseId } = router.query;
    const { isLoggedIn } = useSelector(state => state.registerSlice);

    const [todayWorkout, setTodayWorkout] = useState(null);
    const [membership, setMembership]     = useState(null);
    const [routine, setRoutine]           = useState(null);
    const [logging, setLogging]           = useState(false);
    const [logResult, setLogResult]       = useState(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [shareWorkout, setShareWorkout] = useState(null); // { workout, logResult }
    const shareCardRef                    = useRef(null);

    useEffect(() => {
        if (!isLoggedIn) { router.replace('/signin'); return; }
        if (!fanbaseId) {
            fetch('/api/fanbase/my-dojo', { credentials: 'include' })
                .then(r => r.json())
                .then(async data => {
                    if (!data.status || !data.fanbase) {
                        setError(data.message || data.error || 'dojo_unavailable');
                        setLoading(false);
                        return;
                    }
                    const fid = data.fanbase._id;
                    if (!data.isMember) {
                        await fetch('/api/fanbase/join', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ fanbase_id: fid })
                        });
                        router.replace(`/dojo/onboarding?fanbaseId=${fid}`);
                    } else if (!data.onboardingComplete) {
                        router.replace(`/dojo/onboarding?fanbaseId=${fid}`);
                    } else {
                        router.replace(`/dojo?fanbaseId=${fid}`);
                    }
                })
                .catch(() => { setError('load_failed'); setLoading(false); });
            return;
        }
        loadData();
    }, [isLoggedIn, fanbaseId]);

    const loadData = async () => {
        try {
            const [todayRes, routineRes, dojoRes] = await Promise.all([
                fetch(`/api/routine/today?fanbaseId=${fanbaseId}`, { credentials: 'include' }),
                fetch(`/api/routine/current?fanbaseId=${fanbaseId}`, { credentials: 'include' }),
                fetch('/api/fanbase/my-dojo', { credentials: 'include' })
            ]);

            const routineData    = routineRes.ok ? await routineRes.json() : null;
            const todayData      = todayRes.ok   ? await todayRes.json()   : null;
            const dojoData       = dojoRes.ok    ? await dojoRes.json()    : null;

            setRoutine(routineData);
            setTodayWorkout(todayData);
            if (dojoData?.membership) setMembership(dojoData.membership);

            if (!routineData) setError('no_routine');
        } catch {
            setError('load_failed');
        }
        setLoading(false);
    };

    const generateRoutine = async () => {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/routine/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ fanbaseId })
        });
        if (res.ok) {
            await loadData();
        } else {
            const d = await res.json();
            setError(d.error === 'quota_exceeded' ? 'quota_exceeded' : (d.error || 'Failed to generate'));
            setLoading(false);
        }
    };

    const logWorkout = async () => {
        setLogging(true);
        setLogResult(null);
        const res = await fetch('/api/activity/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ fanbaseId, activityType: 'workout' })
        });
        const data = await res.json();
        setLogResult(data);
        // Refresh membership to show updated XP
        const dojoRes = await fetch('/api/fanbase/my-dojo', { credentials: 'include' });
        const dojoData = dojoRes.ok ? await dojoRes.json() : null;
        if (dojoData?.membership) setMembership(dojoData.membership);
        setLogging(false);
    };

    const exportDojoCard = async () => {
        if (!shareCardRef.current) return;
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(shareCardRef.current, {
            scale: 2,
            backgroundColor: '#0A0A09',
            useCORS: true,
            logging: false,
        });
        const link = document.createElement('a');
        link.download = `dojo-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const getKuraQuote = (workout) => {
        if (!workout || workout.isRest) return "Stillness is also training. The jungle breathes.";
        const name = (workout.name || '').toUpperCase();
        if (name.includes('IGNITION')) return "The jungle is awake. Are you?";
        if (name.includes('SHADOW'))   return "Your shadow knows the moves. Follow it.";
        if (name.includes('SURGE'))    return "You don't build strength by going easy on yourself.";
        if (name.includes('FLOW'))     return "A body that can't bend will eventually break.";
        return "Rise. Strike. Breathe. One more.";
    };

    const currentShapeIndex = membership ? SILHOUETTE_ORDER.indexOf(membership.currentBodyShape) : -1;
    const goalShapeIndex    = membership ? SILHOUETTE_ORDER.indexOf(membership.goalBodyShape)    : -1;
    const dojoXp            = membership?.dojoXp || 0;
    const xpToNext          = DOJO_XP_THRESHOLD - (dojoXp % DOJO_XP_THRESHOLD);

    // Week number for display
    const getWeekNum = () => {
        const d = new Date();
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    };

    return (
        <>
            <Head><title>Bonzo's Dojo | Lucid Jungles</title></Head>
            <div style={{ minHeight: '100vh', background: '#151413', color: '#ABD49E', fontFamily: 'inherit' }}>
                <NavBar />

                {/* Hero header */}
                <div style={{ padding: '24px 16px 0', borderBottom: '1px solid rgba(171,212,158,0.2)', marginBottom: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, marginBottom: 4 }}>WEEK {getWeekNum()} · JUNGLE FIGHT CLUB</p>
                    <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>BONZO'S DOJO</h1>
                    <p style={{ fontSize: 12, opacity: 0.45, fontStyle: 'italic', marginBottom: 16 }}>Don't fight the jungle. Move with it.</p>

                    {/* Shape journey bar */}
                    {membership && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, opacity: 0.6 }}>
                                <span>SHAPE JOURNEY</span>
                                <span>{membership.currentBodyShape} → {membership.goalBodyShape}</span>
                            </div>
                            {/* Progress dots across the silhouette order */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                                {SILHOUETTE_ORDER.map((shape, i) => {
                                    const isPast    = i < currentShapeIndex;
                                    const isCurrent = i === currentShapeIndex;
                                    const isGoal    = i === goalShapeIndex;
                                    const isBeyond  = i > goalShapeIndex;
                                    return (
                                        <div key={shape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                            <div style={{
                                                width: '100%',
                                                height: isCurrent ? 8 : 4,
                                                background: isPast || isCurrent ? '#ABD49E' : 'rgba(171,212,158,0.2)',
                                                border: isGoal ? '1px solid #ABD49E' : 'none',
                                                transition: 'all 0.3s'
                                            }} />
                                            <span style={{
                                                fontSize: 9,
                                                marginTop: 4,
                                                opacity: isCurrent || isGoal ? 1 : 0.35,
                                                fontWeight: isCurrent || isGoal ? 'bold' : 'normal',
                                                letterSpacing: 0.5
                                            }}>
                                                {shape.toUpperCase()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Dojo XP bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, opacity: 0.5 }}>
                                <span>DOJO XP</span>
                                <span>{dojoXp} XP · {xpToNext} to next level</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(171,212,158,0.15)', borderRadius: 2 }}>
                                <div style={{
                                    height: '100%',
                                    width: `${shapeProgress(dojoXp)}%`,
                                    background: '#ABD49E',
                                    borderRadius: 2,
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '0 16px', paddingBottom: 100 }}>

                    {loading && (
                        <div style={{ paddingTop: 60, textAlign: 'center', opacity: 0.5 }}>
                            <p style={{ letterSpacing: 2, fontSize: 12 }}>LOADING...</p>
                        </div>
                    )}

                    {/* No routine */}
                    {!loading && error === 'no_routine' && (
                        <div style={{ textAlign: 'center', paddingTop: 60 }}>
                            <p style={{ opacity: 0.5, marginBottom: 8, fontSize: 12, letterSpacing: 2 }}>NO PROGRAMME THIS WEEK</p>
                            <p style={{ opacity: 0.6, marginBottom: 32, fontSize: 14 }}>
                                {membership ? `Goal: ${membership.fitnessGoal?.replace('_', ' ')} · ${membership.daysPerWeek} days/week` : 'Your programme is ready to generate.'}
                            </p>
                            <button
                                onClick={generateRoutine}
                                style={{
                                    border: 'none',
                                    background: '#ABD49E',
                                    color: '#151413',
                                    padding: '16px 40px',
                                    fontWeight: 'bold',
                                    fontSize: 15,
                                    letterSpacing: 1,
                                    cursor: 'pointer'
                                }}
                            >
                                GENERATE THIS WEEK'S PROGRAMME
                            </button>
                        </div>
                    )}

                    {/* Quota / other errors */}
                    {!loading && error && error !== 'no_routine' && (
                        <div style={{ textAlign: 'center', paddingTop: 60 }}>
                            {error === 'quota_exceeded' ? (
                                <>
                                    <p style={{ fontSize: 28, marginBottom: 12 }}>⚠</p>
                                    <p style={{ fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 }}>PROGRAMME GENERATION UNAVAILABLE</p>
                                    <p style={{ opacity: 0.5, fontSize: 13 }}>The AI service is temporarily over capacity. Try again later.</p>
                                </>
                            ) : (
                                <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
                            )}
                        </div>
                    )}

                    {/* Today's workout */}
                    {!loading && todayWorkout && (
                        <div style={{ marginBottom: 40 }}>
                            <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, marginBottom: 10 }}>TODAY</p>
                            <p style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', marginBottom: 12 }}>
                                &ldquo;{getKuraQuote(todayWorkout.today)}&rdquo; — KṺRA
                            </p>
                            <div style={{ border: '1px solid rgba(171,212,158,0.4)', padding: '20px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <h2 style={{ fontSize: 22, fontWeight: 'bold' }}>
                                        {todayWorkout.today?.name || 'Rest Day'}
                                    </h2>
                                    {todayWorkout.today?.duration > 0 && (
                                        <span style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>~{todayWorkout.today.duration} min</span>
                                    )}
                                </div>

                                {todayWorkout.today?.isRest ? (
                                    <p style={{ opacity: 0.6, fontSize: 14 }}>Stillness is also training. The jungle breathes.</p>
                                ) : (
                                    <div>
                                        {todayWorkout.today?.exercises?.map((ex, i) => (
                                            <div key={i} style={{
                                                padding: '12px 0',
                                                borderBottom: '1px solid rgba(171,212,158,0.12)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <p style={{ fontWeight: 'bold', fontSize: 15 }}>{ex.name}</p>
                                                <p style={{ fontSize: 13, opacity: 0.6, textAlign: 'right' }}>
                                                    {ex.sets} × {ex.reps}
                                                    {ex.rest ? <><br /><span style={{ fontSize: 11 }}>{ex.rest} rest</span></> : ''}
                                                </p>
                                            </div>
                                        ))}

                                        {!logResult ? (
                                            <button
                                                onClick={logWorkout}
                                                disabled={logging}
                                                style={{
                                                    marginTop: 24,
                                                    width: '100%',
                                                    height: 48,
                                                    border: '1px solid #ABD49E',
                                                    background: 'transparent',
                                                    color: '#ABD49E',
                                                    fontWeight: 'bold',
                                                    fontSize: 14,
                                                    letterSpacing: 1,
                                                    cursor: logging ? 'not-allowed' : 'pointer',
                                                    opacity: logging ? 0.5 : 1
                                                }}
                                            >
                                                {logging ? 'LOGGING...' : 'MARK WORKOUT DONE'}
                                            </button>
                                        ) : (
                                            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(171,212,158,0.07)', border: '1px solid rgba(171,212,158,0.3)' }}>
                                                <p style={{ fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 }}>WORKOUT LOGGED</p>
                                                <p style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', marginBottom: 8 }}>The jungle felt that.</p>
                                                <p style={{ fontSize: 13, opacity: 0.8 }}>
                                                    +{logResult.dojoXpGained} Dojo XP &nbsp;·&nbsp; +{logResult.platformXpGained} Platform XP
                                                </p>
                                                {logResult.levelUp && (
                                                    <p style={{ fontWeight: 'bold', marginTop: 8, fontSize: 14 }}>
                                                        ↑ LEVEL UP — {logResult.newLevel}
                                                    </p>
                                                )}
                                                {logResult.silhouetteAdvanced && (
                                                    <p style={{ fontWeight: 'bold', marginTop: 8, fontSize: 14 }}>
                                                        BODY SHAPE ADVANCED — {logResult.newShape}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => setShareWorkout({ workout: todayWorkout.today, logResult })}
                                                    style={{
                                                        marginTop: 16,
                                                        width: '100%',
                                                        height: 40,
                                                        border: '1px solid rgba(171,212,158,0.4)',
                                                        background: 'transparent',
                                                        color: '#ABD49E',
                                                        fontWeight: 'bold',
                                                        fontSize: 12,
                                                        letterSpacing: 2,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    SHARE THIS WORKOUT
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Full week */}
                    {!loading && routine && (
                        <div>
                            <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, marginBottom: 12 }}>THIS WEEK</p>
                            {routine.programme?.map((day, i) => (
                                <div key={i} style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid rgba(171,212,158,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: 13, opacity: 0.6, width: 90 }}>{day.day}</span>
                                    <span style={{ fontSize: 14, flex: 1 }}>{day.name}</span>
                                    <span style={{ fontSize: 12, opacity: 0.4 }}>
                                        {!day.isRest && day.duration ? `${day.duration}min` : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Share card modal */}
            {shareWorkout && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.92)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 24, gap: 20,
                    backdropFilter: 'blur(8px)',
                    overflowY: 'auto',
                }}>
                    {/* Card — 540×720, renders 1080×1440 @2x */}
                    <div
                        ref={shareCardRef}
                        style={{
                            width: 540, minHeight: 720,
                            background: '#0A0A09',
                            border: '6px solid #ABD49E',
                            display: 'flex', flexDirection: 'column',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            flexShrink: 0,
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            color: '#ABD49E',
                        }}
                    >
                        {/* Header band */}
                        <div style={{
                            padding: '18px 28px',
                            background: 'rgba(171,212,158,0.04)',
                            borderBottom: '1px solid rgba(171,212,158,0.15)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            {/* Left: Kura icon + title + date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src="/kura-icon.png" style={{ width: 26, height: 26, objectFit: 'contain' }} alt="Kura" />
                                <div>
                                    <div style={{ fontSize: 9, letterSpacing: '0.22em', opacity: 0.5, marginBottom: 4 }}>
                                        JUNGLE FIGHT CLUB · WEEK {getWeekNum()}
                                    </div>
                                    <div style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: 600 }}>
                                        BONZO'S DOJO
                                    </div>
                                    <div style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.4, marginTop: 3 }}>
                                        {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            {/* Right: Bonzo avatar */}
                            <div style={{
                                width: 64, height: 64, flexShrink: 0,
                                border: '1px solid rgba(171,212,158,0.25)',
                                overflow: 'hidden',
                            }}>
                                <img src="/bonzo-avatar.png"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt="Bonzo" />
                            </div>
                        </div>

                        {/* Workout name + duration */}
                        <div style={{ padding: '28px 28px 16px' }}>
                            <div style={{ fontSize: 9, letterSpacing: '0.2em', opacity: 0.45, marginBottom: 8 }}>
                                TODAY'S SESSION
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>
                                {shareWorkout.workout?.name}
                            </div>
                            {shareWorkout.workout?.duration > 0 && (
                                <div style={{ fontSize: 11, opacity: 0.45, letterSpacing: '0.12em' }}>
                                    ~{shareWorkout.workout.duration} MIN
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: 'rgba(171,212,158,0.12)', margin: '0 28px' }} />

                        {/* Exercise list */}
                        <div style={{ padding: '16px 28px', flex: 1 }}>
                            {shareWorkout.workout?.exercises?.map((ex, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                                    padding: '10px 0',
                                    borderBottom: '1px solid rgba(171,212,158,0.08)',
                                }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>{ex.name}</span>
                                    <span style={{ fontSize: 12, opacity: 0.55, letterSpacing: '0.06em', textAlign: 'right', whiteSpace: 'nowrap', marginLeft: 12 }}>
                                        {ex.sets} × {ex.reps}{ex.rest && ex.rest !== '—' ? ` · ${ex.rest}` : ''}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* XP strip */}
                        <div style={{
                            margin: '0 28px 28px',
                            padding: '14px 18px',
                            background: 'rgba(171,212,158,0.06)',
                            border: '1px solid rgba(171,212,158,0.2)',
                        }}>
                            <div style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.5, marginBottom: 6 }}>
                                SESSION COMPLETE
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.06em' }}>
                                +{shareWorkout.logResult?.dojoXpGained || 0} DOJO XP
                                <span style={{ fontSize: 12, opacity: 0.5, fontWeight: 400, marginLeft: 10 }}>
                                    +{shareWorkout.logResult?.platformXpGained || 0} PLATFORM XP
                                </span>
                            </div>
                            {shareWorkout.logResult?.levelUp && (
                                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, letterSpacing: '0.1em' }}>
                                    ↑ LEVEL UP — {shareWorkout.logResult.newLevel}
                                </div>
                            )}
                            {shareWorkout.logResult?.silhouetteAdvanced && (
                                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, letterSpacing: '0.1em' }}>
                                    BODY SHAPE ADVANCED — {shareWorkout.logResult.newShape}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '12px 28px',
                            borderTop: '1px solid rgba(171,212,158,0.1)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(171,212,158,0.02)',
                        }}>
                            <span style={{ fontSize: 9, letterSpacing: '0.18em', opacity: 0.35 }}>LUCID JUNGLES</span>
                            <span style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.25 }}>lucidjungles.io</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                        <button
                            onClick={exportDojoCard}
                            style={{
                                padding: '14px 36px',
                                background: '#ABD49E',
                                border: 'none',
                                color: '#0A0A09',
                                fontWeight: 700,
                                fontSize: 13,
                                letterSpacing: 2,
                                cursor: 'pointer',
                            }}
                        >
                            DOWNLOAD
                        </button>
                        <button
                            onClick={() => setShareWorkout(null)}
                            style={{
                                padding: '14px 24px',
                                background: 'transparent',
                                border: '1px solid rgba(171,212,158,0.3)',
                                color: '#ABD49E',
                                fontSize: 12,
                                letterSpacing: 1,
                                cursor: 'pointer',
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

