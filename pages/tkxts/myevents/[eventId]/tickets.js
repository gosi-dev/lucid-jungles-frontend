// pages/tkxts/myevents/[eventId]/tickets.js — Manage ticket tiers
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../../hooks/useHideBottomNav';

export default function ManageTickets() {
  const router = useRouter();
  const { eventId } = router.query;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: '', price: '', quantity: '' });
  const [saving, setSaving] = useState(false);

  useHideBottomNav(true);

  const loadTickets = () => {
    if (!eventId) return;
    fetch('/api/tickets/event/' + eventId, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setTickets(Array.isArray(data) ? data : data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(loadTickets, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, eventId, price: Number(form.price), quantity: Number(form.quantity) }),
      });
      if (res.ok) { setForm({ type: '', price: '', quantity: '' }); setShowForm(false); loadTickets(); }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ticket tier?')) return;
    await fetch('/api/tickets/' + id, { method: 'DELETE', credentials: 'include' });
    loadTickets();
  };

  const inputStyle = { width: '100%', height: 38, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: '#ABD49E', paddingLeft: 10, fontSize: 13, outline: 'none' };

  return (
    <>
      <Head><title>Manage Tickets — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 40 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Ticket Tiers</span>
        </div>

        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {tickets.map(t => (
                <div key={t._id} style={{ border: '1px solid rgba(171,212,158,0.2)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.type}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>\u20A6{t.price?.toLocaleString() || 0} · {t.sold || 0}/{t.quantity} sold</div>
                  </div>
                  <button onClick={() => handleDelete(t._id)} style={{ background: 'none', border: '1px solid rgba(255,100,100,0.4)', color: '#ff6b6b', padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>DELETE</button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(171,212,158,0.2)', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 4 }}>ADD TICKET TIER</div>
              <input placeholder="Type (e.g. VIP, General)" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle} required />
              <input type="number" placeholder="Price (₦)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inputStyle} required />
              <input type="number" placeholder="Quantity available" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} style={inputStyle} required />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, height: 38, background: 'none', border: '1px solid rgba(171,212,158,0.3)', color: '#ABD49E', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, height: 38, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  {saving ? 'Saving...' : 'SAVE'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ width: '100%', height: 44, backgroundColor: 'transparent', border: '1px dashed rgba(171,212,158,0.4)', color: '#ABD49E', cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              + ADD TICKET TIER
            </button>
          )}
        </div>
      </div>
    </>
  );
}
