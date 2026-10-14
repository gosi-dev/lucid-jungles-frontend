import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBar from '../../components/NavBar';

const LEVEL_COLORS = {
  Novice: 'rgba(171,212,158,0.4)',
  Explorer: '#ABD49E',
  Veteran: '#D4B896',
  Legend: '#D4C896',
};

export default function ProfilePage() {
  const router = useRouter();
  const { username: routeUsername } = router.query;
  const { username: myUsername, isLoggedIn } = useSelector((state) => state.registerSlice);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = isLoggedIn && myUsername && routeUsername && myUsername.toLowerCase() === routeUsername.toLowerCase();

  useEffect(() => {
    if (!routeUsername) return;
    fetch(`/api/user/u/${routeUsername}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setUser(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [routeUsername]);

  const S = {
    page: { minHeight: '100vh', background: '#0A0A09', color: '#ABD49E', fontFamily: "'Averia Sans Libre', 'Inter', sans-serif" },
    inner: { maxWidth: 680, margin: '0 auto', padding: '88px 20px 80px' },
    avatar: {
      width: 80, height: 80, borderRadius: '50%',
      background: 'rgba(171,212,158,0.08)',
      border: '1px solid rgba(171,212,158,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 32, color: 'rgba(171,212,158,0.3)', marginBottom: 20,
      overflow: 'hidden',
    },
    name: { fontSize: 26, fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 4px' },
    level: (lvl) => ({ fontSize: 10, letterSpacing: '0.16em', color: LEVEL_COLORS[lvl] || '#ABD49E', marginBottom: 16 }),
    stat: { display: 'flex', gap: 32, marginBottom: 24 },
    statItem: { textAlign: 'center' },
    statNum: { fontSize: 20, fontWeight: 700 },
    statLabel: { fontSize: 10, letterSpacing: '0.12em', color: 'rgba(171,212,158,0.5)' },
    about: { fontSize: 13, color: 'rgba(171,212,158,0.7)', lineHeight: 1.8, marginBottom: 28 },
    sectionTitle: { fontSize: 10, letterSpacing: '0.18em', color: 'rgba(171,212,158,0.4)', marginBottom: 12, marginTop: 32 },
    editBtn: {
      background: 'transparent', border: '1px solid rgba(171,212,158,0.3)',
      color: '#ABD49E', fontSize: 10, letterSpacing: '0.12em',
      padding: '6px 20px', cursor: 'pointer', marginTop: 8,
    },
    divider: { height: 1, background: 'rgba(171,212,158,0.08)', margin: '24px 0' },
  };

  if (loading) return (
    <div style={S.page}><NavBar /><div style={S.inner}><p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>Loading...</p></div></div>
  );

  if (notFound) return (
    <div style={S.page}>
      <NavBar />
      <div style={S.inner}>
        <p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>Profile not found.</p>
        <p onClick={() => router.back()} style={{ fontSize: 11, color: 'rgba(171,212,158,0.3)', cursor: 'pointer', marginTop: 12, letterSpacing: '0.1em' }}>← BACK</p>
      </div>
    </div>
  );

  const avatarSrc = user.profile_picture || null;
  const joinYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <div style={S.page}>
      <NavBar />
      <div style={S.inner}>

        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 20 }}>
          <div style={S.avatar}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '◈'
            }
          </div>
          <div>
            <h1 style={S.name}>{user.username}</h1>
            <p style={S.level(user.level)}>{user.level?.toUpperCase() || 'NOVICE'}</p>
            {user.location && (
              <p style={{ fontSize: 11, color: 'rgba(171,212,158,0.4)', margin: 0 }}>{user.location}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={S.stat}>
          <div style={S.statItem}>
            <div style={S.statNum}>{user.xp || 0}</div>
            <div style={S.statLabel}>XP</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statNum}>{user.loginStreak || 0}</div>
            <div style={S.statLabel}>STREAK</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statNum}>{user.fanbase?.length || 0}</div>
            <div style={S.statLabel}>FANBASES</div>
          </div>
          {joinYear && (
            <div style={S.statItem}>
              <div style={S.statNum}>{joinYear}</div>
              <div style={S.statLabel}>JOINED</div>
            </div>
          )}
        </div>

        {/* About */}
        {user.about && (
          <>
            <div style={S.divider} />
            <p style={S.sectionTitle}>ABOUT</p>
            <p style={S.about}>{user.about}</p>
          </>
        )}
        {!user.about && isOwnProfile && (
          <>
            <div style={S.divider} />
            <p style={{ fontSize: 12, color: 'rgba(171,212,158,0.3)', fontStyle: 'italic' }}>
              No bio yet.
            </p>
          </>
        )}

        {/* Edit button if own profile */}
        {isOwnProfile && (
          <>
            <div style={S.divider} />
            <p style={S.sectionTitle}>YOUR PROFILE</p>
            <button
              onClick={() => router.push('/kura')}
              style={S.editBtn}
            >
              GO TO YOUR KURA
            </button>
          </>
        )}

        <p
          onClick={() => router.back()}
          style={{ marginTop: 40, fontSize: 11, color: 'rgba(171,212,158,0.3)', cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          ← BACK
        </p>
      </div>
    </div>
  );
}
