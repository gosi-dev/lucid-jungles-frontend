// pages/tkxts/myevents/[eventId]/program.js — Session management
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../../hooks/useHideBottomNav';

export default function EventProgram() {
  const router = useRouter();
  const { eventId } = router.query;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', time: '', speaker: '', description: '' });
  const [saving, setSaving] = useState(false);

  useHideBottomNav(true);

  const loadSessions = () => {
    if (!eventId) return;
    fetch('/api/events/' + eventId + '/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setSessions(Array.isArray(data) ? data : data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(loadSessions, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/events/' + eventId + '/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) { setForm({ title: '', time: '', speaker: '', description: '' }); setShowForm(false); loadSessions(); }
    } catch {}
    setSaving(false);
  };

  const inputStyle = { width: '100%', height: 38, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: '#ABD49E', paddingLeft: 10, fontSize: 13, outline: 'none' };

  return (
    <>
      <Head><title>Event Program — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 40 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Program / Sessions</span>
        </div>

        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading...</div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5, marginBottom: 16 }}>No sessions added yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {sessions.map((s, i) => (
                <div key={s._id || i} style={{ border: '1px solid rgba(171,212,158,0.2)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{s.time}</span>
                  </div>
                  {s.speaker && <div style={{ fontSize: 12, opacity: 0.6 }}>{s.speaker}</div>}
                  {s.description && <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{s.description}</div>}
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(171,212,158,0.2)', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 4 }}>ADD SESSION</div>
              <input placeholder="Session title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} required />
              <input type="time" placeholder="Time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} style={inputStyle} />
              <input placeholder="Speaker / Host" value={form.speaker} onChange={e => setForm(p => ({ ...p, speaker: e.target.value }))} style={inputStyle} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, height: 70, paddingTop: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, height: 38, background: 'none', border: '1px solid rgba(171,212,158,0.3)', color: '#ABD49E', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, height: 38, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  {saving ? 'Saving...' : 'SAVE'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ width: '100%', height: 44, backgroundColor: 'transparent', border: '1px dashed rgba(171,212,158,0.4)', color: '#ABD49E', cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              + ADD SESSION
            </button>
          )}
        </div>
      </div>
    </>
  );
}
