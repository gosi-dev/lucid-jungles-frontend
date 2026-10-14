// pages/quests.js — QUESTS / MISSIONS (API: /api/quests; DATA_MODEL.md: Mission)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';

const TYPES = ['daily', 'weekly', 'monthly'];

export default function QuestsPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState(1);
  const [type, setType] = useState('daily');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/quests', { credentials: 'include' });
      const data = await res.json();
      if (data.status) setMissions(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    load();
  }, [isLoggedIn, load, router]);

  async function createMission() {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), goal: Number(goal) || 1, type }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not create quest');
      setMissions((prev) => [data.data, ...prev]);
      setTitle('');
      setGoal(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function advance(mission) {
    try {
      const res = await fetch(`/api/quests/${mission._id}/progress`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setMissions((prev) => prev.map((m) => (m._id === mission._id ? data.data : m)));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <MvpShell title="QUESTS" subtitle="YOUR DAILY MISSIONS">
      {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

      <div style={mvpCard}>
        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>NEW QUEST</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quest title" style={mvpInput} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="number"
            min={1}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Goal"
            style={{ ...mvpInput, marginBottom: 0, width: 90 }}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...mvpInput, marginBottom: 0 }}>
            {TYPES.map((t) => (
              <option key={t} value={t} style={{ background: '#151413' }}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={createMission} disabled={creating || !title.trim()} style={mvpButton(creating || !title.trim())}>
          CREATE QUEST
        </button>
      </div>

      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading quests...</div>
      ) : missions.length === 0 ? (
        <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>No active quests. Create one above.</div>
      ) : (
        missions.map((m) => (
          <div key={m._id} style={mvpCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{m.title}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{m.type.toUpperCase()}</span>
            </div>
            {m.description ? <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{m.description}</div> : null}
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>
              {m.progress}/{m.goal} · {m.status.toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => advance(m)}
              disabled={m.status !== 'active'}
              style={mvpButton(m.status !== 'active')}
            >
              {m.status === 'active' ? 'COMPLETE STEP' : 'DONE'}
            </button>
          </div>
        ))
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/kura" style={{ color: '#ABD49E', fontSize: 12 }}>DAILY STATE (KURA) →</Link>
      </div>
    </MvpShell>
  );
}
