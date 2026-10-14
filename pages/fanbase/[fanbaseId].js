import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBar from '../../components/NavBar';

const TYPE_COLORS = {
  fitness: '#ABD49E',
  agency: '#D4B896',
  venue: '#96B5D4',
  music: '#D496C8',
  general: 'rgba(171,212,158,0.5)',
};

export default function FanbaseDetail() {
  const router = useRouter();
  const { fanbaseId } = router.query;
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [fanbase, setFanbase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!fanbaseId) return;
    fetch(`/api/fanbase/${fanbaseId}/fetch`)
      .then((r) => r.json())
      .then((d) => { if (d.status) setFanbase(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fanbaseId]);

  async function handleJoin() {
    if (!isLoggedIn) { router.push('/signup'); return; }
    if (fanbase.isPaid) {
      setMessage('Paid memberships coming soon.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setJoining(true);
    try {
      const res = await fetch('/api/fanbase/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fanbase_id: fanbaseId }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setMessage('Joined successfully!');
        setFanbase((f) => ({ ...f, total_members: f.total_members + 1 }));
        if (data.data?.fanbaseType === 'fitness') {
          setTimeout(() => router.push(`/dojo/onboarding?fanbaseId=${fanbaseId}`), 1200);
        }
      } else {
        setMessage(data.message || 'Could not join.');
      }
    } catch {
      setMessage('Network error.');
    } finally {
      setJoining(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  const S = {
    page: { minHeight: '100vh', background: '#0A0A09', color: '#ABD49E', fontFamily: "'Averia Sans Libre', 'Inter', sans-serif" },
    inner: { maxWidth: 760, margin: '0 auto', padding: '88px 20px 80px' },
    label: (type) => ({
      fontSize: 9, letterSpacing: '0.14em',
      color: TYPE_COLORS[type] || '#ABD49E',
      border: `1px solid ${TYPE_COLORS[type] || '#ABD49E'}`,
      padding: '2px 8px', display: 'inline-block', marginBottom: 16,
    }),
    title: { fontSize: 30, fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' },
    desc: { fontSize: 14, color: 'rgba(171,212,158,0.7)', lineHeight: 1.7, margin: '0 0 28px' },
    meta: { fontSize: 12, color: 'rgba(171,212,158,0.4)', margin: '0 0 28px' },
    sectionTitle: { fontSize: 11, letterSpacing: '0.16em', color: 'rgba(171,212,158,0.5)', marginBottom: 14, marginTop: 36 },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(171,212,158,0.1)', padding: 16, marginBottom: 10 },
    joinBtn: {
      background: 'transparent', border: '1px solid rgba(171,212,158,0.5)',
      color: '#ABD49E', fontSize: 11, letterSpacing: '0.14em',
      padding: '10px 32px', cursor: 'pointer', marginTop: 8,
    },
  };

  if (loading) return (
    <div style={S.page}><NavBar /><div style={S.inner}><p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>Loading...</p></div></div>
  );

  if (!fanbase) return (
    <div style={S.page}><NavBar /><div style={S.inner}><p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>Fanbase not found.</p></div></div>
  );

  return (
    <div style={S.page}>
      <NavBar />
      <div style={S.inner}>
        {/* Cover */}
        {fanbase.cover_image && (
          <div style={{
            width: '100%', height: 200, marginBottom: 28,
            background: `url(${fanbase.cover_image}) center/cover no-repeat`,
            filter: 'brightness(0.6)',
          }} />
        )}

        {/* Type badge */}
        <span style={S.label(fanbase.fanbaseType)}>
          {fanbase.fanbaseType?.toUpperCase()}
        </span>

        <h1 style={S.title}>{fanbase.name}</h1>

        {fanbase.description && <p style={S.desc}>{fanbase.description}</p>}

        <p style={S.meta}>
          {fanbase.total_members} member{fanbase.total_members !== 1 ? 's' : ''}
          {fanbase.isPaid ? ` · ${fanbase.currency} ${fanbase.membershipFee}/membership` : ' · Free to join'}
        </p>

        {/* Join */}
        {message && <p style={{ color: '#ABD49E', fontSize: 12, marginBottom: 8 }}>{message}</p>}
        <button
          onClick={handleJoin}
          disabled={joining}
          style={{ ...S.joinBtn, opacity: joining ? 0.4 : 1 }}
        >
          {joining ? '...' : fanbase.isPaid ? `JOIN — ${fanbase.currency} ${fanbase.membershipFee}` : 'JOIN FREE'}
        </button>

        {/* Community Goals */}
        {fanbase.community_goals?.length > 0 && (
          <>
            <p style={S.sectionTitle}>COMMUNITY GOALS</p>
            {fanbase.community_goals.map((goal, i) => (
              <div key={i} style={S.card}>
                <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{goal.goal_name}</p>
                {goal.goal_description && (
                  <p style={{ fontSize: 12, color: 'rgba(171,212,158,0.6)', margin: '0 0 8px' }}>{goal.goal_description}</p>
                )}
                {goal.progress && (
                  <p style={{ fontSize: 11, color: 'rgba(171,212,158,0.4)', margin: 0 }}>
                    {goal.progress.current} / {goal.progress.goal}
                  </p>
                )}
              </div>
            ))}
          </>
        )}

        {/* Members */}
        {fanbase.members?.length > 0 && (
          <>
            <p style={S.sectionTitle}>MEMBERS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {fanbase.members.slice(0, 24).map((m, i) => (
                <span
                  key={i}
                  onClick={() => m.username && router.push(`/profile/${m.username}`)}
                  style={{
                    fontSize: 11, padding: '4px 12px',
                    background: 'rgba(171,212,158,0.05)',
                    border: '1px solid rgba(171,212,158,0.12)',
                    color: '#ABD49E', cursor: m.username ? 'pointer' : 'default',
                  }}
                >
                  {m.username || 'member'}
                </span>
              ))}
              {fanbase.members.length > 24 && (
                <span style={{ fontSize: 11, color: 'rgba(171,212,158,0.4)', padding: '4px 0' }}>
                  +{fanbase.members.length - 24} more
                </span>
              )}
            </div>
          </>
        )}

        <p
          onClick={() => router.back()}
          style={{ marginTop: 48, fontSize: 11, color: 'rgba(171,212,158,0.4)', cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          ← BACK
        </p>
      </div>
    </div>
  );
}
