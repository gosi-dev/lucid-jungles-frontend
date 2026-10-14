import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBar from '../../components/NavBar';

const TYPE_LABELS = {
  fitness: 'FITNESS',
  agency: 'AGENCY',
  venue: 'VENUE',
  music: 'MUSIC',
  general: 'GENERAL',
};

const TYPE_COLORS = {
  fitness: '#ABD49E',
  agency: '#D4B896',
  venue: '#96B5D4',
  music: '#D496C8',
  general: 'rgba(171,212,158,0.5)',
};

export default function FanbasePage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [fanbases, setFanbases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch('/api/fanbase/fetch_all')
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setFanbases(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(fanbase) {
    if (!isLoggedIn) { router.push('/signup'); return; }
    if (fanbase.isPaid) {
      setMessage({ id: fanbase._id, text: 'Paid memberships coming soon.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setJoining(fanbase._id);
    try {
      const res = await fetch('/api/fanbase/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fanbase_id: fanbase._id }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setMessage({ id: fanbase._id, text: 'Joined!' });
        setFanbases((prev) =>
          prev.map((f) =>
            f._id === fanbase._id ? { ...f, total_members: f.total_members + 1 } : f
          )
        );
        // If fitness type, offer onboarding
        if (data.data?.fanbaseType === 'fitness') {
          setTimeout(() => {
            router.push(`/dojo/onboarding?fanbaseId=${fanbase._id}`);
          }, 1200);
        }
      } else {
        setMessage({ id: fanbase._id, text: data.message || 'Could not join.' });
      }
    } catch {
      setMessage({ id: fanbase._id, text: 'Network error.' });
    } finally {
      setJoining(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A09', color: '#ABD49E', fontFamily: "'Averia Sans Libre', 'Inter', sans-serif" }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '88px 20px 60px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 6 }}>FANBASES</h1>
        <p style={{ color: 'rgba(171,212,158,0.5)', fontSize: 13, marginBottom: 36 }}>
          Communities inside the jungle. Join one. Build with people.
        </p>

        {loading && (
          <p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>Loading...</p>
        )}

        {!loading && fanbases.length === 0 && (
          <p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>
            No fanbases yet. Seed some from the backend or create one.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {fanbases.map((fb) => (
            <div
              key={fb._id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(171,212,158,0.12)',
                padding: 20,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => router.push(`/fanbase/${fb._id}`)}
            >
              {fb.cover_image && (
                <div style={{
                  width: '100%', height: 120, marginBottom: 14,
                  background: `url(${fb.cover_image}) center/cover no-repeat`,
                  filter: 'brightness(0.7)',
                }} />
              )}
              {!fb.cover_image && (
                <div style={{
                  width: '100%', height: 80, marginBottom: 14,
                  background: 'rgba(171,212,158,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: 'rgba(171,212,158,0.15)',
                }}>
                  ◈
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  color: TYPE_COLORS[fb.fanbaseType] || '#ABD49E',
                  border: `1px solid ${TYPE_COLORS[fb.fanbaseType] || '#ABD49E'}`,
                  padding: '2px 7px',
                  opacity: 0.8,
                }}>
                  {TYPE_LABELS[fb.fanbaseType] || fb.fanbaseType?.toUpperCase()}
                </span>
                {fb.isPaid && (
                  <span style={{ fontSize: 10, color: 'rgba(171,212,158,0.5)' }}>
                    {fb.currency} {fb.membershipFee}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {fb.name}
              </h2>
              {fb.description && (
                <p style={{ fontSize: 12, color: 'rgba(171,212,158,0.6)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {fb.description.slice(0, 100)}{fb.description.length > 100 ? '…' : ''}
                </p>
              )}
              <p style={{ fontSize: 11, color: 'rgba(171,212,158,0.4)', margin: '0 0 14px' }}>
                {fb.total_members} member{fb.total_members !== 1 ? 's' : ''}
              </p>

              {message?.id === fb._id && (
                <p style={{ fontSize: 11, color: '#ABD49E', margin: '0 0 8px' }}>{message.text}</p>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); handleJoin(fb); }}
                disabled={joining === fb._id}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(171,212,158,0.4)',
                  color: '#ABD49E',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  padding: '8px 0',
                  cursor: joining === fb._id ? 'default' : 'pointer',
                  opacity: joining === fb._id ? 0.4 : 1,
                }}
              >
                {joining === fb._id ? '...' : fb.isPaid ? `JOIN — ${fb.currency} ${fb.membershipFee}` : 'JOIN FREE'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
