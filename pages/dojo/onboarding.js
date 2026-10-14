/**
 * /pages/dojo/onboarding.js
 * Dojo fitness onboarding — runs after joining a fitness Fanbase.
 * Query params: fanbaseId
 */
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaChevronLeft } from 'react-icons/fa';

const BODY_SHAPES = [
    { value: 'Titan',    label: 'Titan',    desc: 'Big, strong, carries significant mass' },
    { value: 'Bear',     label: 'Bear',     desc: 'Broad and powerful, some extra weight' },
    { value: 'Everyday', label: 'Everyday', desc: 'Average build, not training consistently' },
    { value: 'Runner',   label: 'Runner',   desc: 'Lean, lighter, low body fat' },
    { value: 'Athlete',  label: 'Athlete',  desc: 'Fit, functional, balanced muscle and cardio' },
    { value: 'Lifter',   label: 'Lifter',   desc: 'Muscular, trained, strength-focused physique' },
];
const GOAL_SHAPES = [
    { value: 'Runner',  label: 'Runner',  desc: 'Lean and light — fat loss focus' },
    { value: 'Athlete', label: 'Athlete', desc: 'Fit and functional — balanced goal' },
    { value: 'Lifter',  label: 'Lifter',  desc: 'Strong and muscular — muscle-building focus' },
];
const FITNESS_GOALS = [
    { value: 'fat_loss', label: 'Lose fat' },
    { value: 'muscle',   label: 'Build muscle' },
    { value: 'endurance',label: 'Improve endurance' },
    { value: 'general',  label: 'General fitness' }
];
const EQUIPMENT_OPTIONS = [
    { value: 'none',      label: 'No equipment (bodyweight)' },
    { value: 'dumbbells', label: 'Dumbbells at home' },
    { value: 'full_gym',  label: 'Full gym access' }
];

const STEPS = ['Your body now', 'Your goal', 'Training style', 'Almost there'];

export default function DojoOnboarding() {
    const router = useRouter();
    const { fanbaseId } = router.query;

    const [step, setStep]   = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const [answers, setAnswers] = useState({
        currentBodyShape: '',
        goalBodyShape: '',
        fitnessGoal: '',
        daysPerWeek: 3,
        equipment: '',
        avoid: '',
        heightCm: '',
        weightKg: '',
        desiredWeightKg: ''
    });

    const set = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

    const canAdvance = () => {
        if (step === 0) return !!answers.currentBodyShape && !!answers.heightCm && !!answers.weightKg;
        if (step === 1) return !!answers.goalBodyShape && !!answers.desiredWeightKg;
        if (step === 2) return !!answers.fitnessGoal && !!answers.equipment;
        return true;
    };

    const handleFinish = async () => {
        if (!fanbaseId) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/fanbase/${fanbaseId}/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...answers,
                    heightCm: parseFloat(answers.heightCm) || undefined,
                    weightKg: parseFloat(answers.weightKg) || undefined,
                    desiredWeightKg: parseFloat(answers.desiredWeightKg) || undefined
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');

            // Generate first routine immediately
            await fetch('/api/routine/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ fanbaseId })
            });

            router.push(`/dojo?fanbaseId=${fanbaseId}`);
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    const OptionButton = ({ selected, onClick, children, desc }) => (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: 10,
                border: `1px solid ${selected ? '#fff' : '#ABD49E'}`,
                background: selected ? '#ABD49E' : 'transparent',
                color: selected ? '#151413' : '#ABD49E',
                fontWeight: selected ? 'bold' : 'normal',
                fontSize: 15,
                cursor: 'pointer',
                textAlign: 'left'
            }}
        >
            <span style={{ display: 'block', fontWeight: 'bold' }}>{children}</span>
            {desc && (
                <span style={{ display: 'block', fontSize: 12, opacity: 0.7, marginTop: 3, fontWeight: 'normal' }}>
                    {desc}
                </span>
            )}
        </button>
    );

    return (
        <>
            <Head><title>Dojo Onboarding | Lucid Jungles</title></Head>
            <div style={{ minHeight: '100vh', background: '#151413', color: '#ABD49E', padding: '20px 16px', paddingBottom: 120 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #ABD49E', paddingBottom: 12 }}>
                    {step > 0 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            style={{ background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer', marginRight: 12 }}
                        >
                            <FaChevronLeft size={22} />
                        </button>
                    )}
                    <div>
                        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 2 }}>Step {step + 1} of {STEPS.length}</p>
                        <h1 style={{ fontSize: 20, fontWeight: 'bold' }}>{STEPS[step]}</h1>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: 'rgba(171,212,158,0.2)', marginBottom: 32 }}>
                    <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: '#ABD49E', transition: 'width 0.3s' }} />
                </div>

                {/* Step 0: Current body shape + measurements */}
                {step === 0 && (
                    <div>
                        <p style={{ marginBottom: 20, opacity: 0.8 }}>Which body type best describes you right now?</p>
                        {BODY_SHAPES.map(shape => (
                            <OptionButton
                                key={shape.value}
                                selected={answers.currentBodyShape === shape.value}
                                onClick={() => set('currentBodyShape', shape.value)}
                                desc={shape.desc}
                            >
                                {shape.label}
                            </OptionButton>
                        ))}

                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Height (cm)</label>
                                <input
                                    type="number"
                                    min="100" max="250"
                                    value={answers.heightCm}
                                    onChange={e => set('heightCm', e.target.value)}
                                    placeholder="e.g. 175"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'transparent',
                                        border: '1px solid #ABD49E',
                                        color: '#ABD49E',
                                        fontSize: 15,
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Weight (kg)</label>
                                <input
                                    type="number"
                                    min="30" max="300"
                                    value={answers.weightKg}
                                    onChange={e => set('weightKg', e.target.value)}
                                    placeholder="e.g. 85"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'transparent',
                                        border: '1px solid #ABD49E',
                                        color: '#ABD49E',
                                        fontSize: 15,
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Goal body shape + desired weight */}
                {step === 1 && (
                    <div>
                        <p style={{ marginBottom: 20, opacity: 0.8 }}>Where do you want to get to?</p>
                        {GOAL_SHAPES.map(shape => (
                            <OptionButton
                                key={shape.value}
                                selected={answers.goalBodyShape === shape.value}
                                onClick={() => set('goalBodyShape', shape.value)}
                                desc={shape.desc}
                            >
                                {shape.label}
                            </OptionButton>
                        ))}

                        <div style={{ marginTop: 8 }}>
                            <label style={{ display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Desired weight (kg)</label>
                            <input
                                type="number"
                                min="30" max="300"
                                value={answers.desiredWeightKg}
                                onChange={e => set('desiredWeightKg', e.target.value)}
                                placeholder="e.g. 75"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'transparent',
                                    border: '1px solid #ABD49E',
                                    color: '#ABD49E',
                                    fontSize: 15,
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Fitness goal + equipment */}
                {step === 2 && (
                    <div>
                        <p style={{ marginBottom: 16, opacity: 0.8 }}>What's your main goal?</p>
                        {FITNESS_GOALS.map(g => (
                            <OptionButton
                                key={g.value}
                                selected={answers.fitnessGoal === g.value}
                                onClick={() => set('fitnessGoal', g.value)}
                            >
                                {g.label}
                            </OptionButton>
                        ))}

                        <p style={{ margin: '24px 0 16px', opacity: 0.8 }}>Equipment available?</p>
                        {EQUIPMENT_OPTIONS.map(e => (
                            <OptionButton
                                key={e.value}
                                selected={answers.equipment === e.value}
                                onClick={() => set('equipment', e.value)}
                            >
                                {e.label}
                            </OptionButton>
                        ))}
                    </div>
                )}

                {/* Step 3: Days + avoid */}
                {step === 3 && (
                    <div>
                        <p style={{ marginBottom: 16, opacity: 0.8 }}>How many days a week can you train?</p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
                            {[2, 3, 4, 5, 6].map(n => (
                                <button
                                    key={n}
                                    onClick={() => set('daysPerWeek', n)}
                                    style={{
                                        width: 52,
                                        height: 52,
                                        border: `1px solid ${answers.daysPerWeek === n ? '#fff' : '#ABD49E'}`,
                                        background: answers.daysPerWeek === n ? '#ABD49E' : 'transparent',
                                        color: answers.daysPerWeek === n ? '#151413' : '#ABD49E',
                                        fontWeight: 'bold',
                                        fontSize: 18,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        <p style={{ marginBottom: 10, opacity: 0.8 }}>Any exercises to avoid? (injuries, preferences)</p>
                        <textarea
                            value={answers.avoid}
                            onChange={e => set('avoid', e.target.value)}
                            placeholder="e.g. squats due to knee injury... or leave blank"
                            rows={4}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid #ABD49E',
                                color: '#ABD49E',
                                padding: '10px 12px',
                                fontSize: 14,
                                resize: 'none'
                            }}
                        />

                        {error && <p style={{ color: '#ff6b6b', marginTop: 16 }}>{error}</p>}
                    </div>
                )}

                {/* CTA */}
                <div style={{ position: 'fixed', bottom: 15, left: 8, right: 8 }}>
                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canAdvance()}
                            style={{
                                width: '100%',
                                height: 48,
                                border: '1px solid #ABD49E',
                                background: 'transparent',
                                color: '#ABD49E',
                                fontWeight: 'bold',
                                fontSize: 16,
                                cursor: canAdvance() ? 'pointer' : 'not-allowed',
                                opacity: canAdvance() ? 1 : 0.4
                            }}
                        >
                            CONTINUE
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={saving}
                            style={{
                                width: '100%',
                                height: 48,
                                border: '1px solid #ABD49E',
                                background: '#ABD49E',
                                color: '#151413',
                                fontWeight: 'bold',
                                fontSize: 16,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.6 : 1
                            }}
                        >
                            {saving ? 'SETTING UP YOUR DOJO...' : "LET'S GO"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
