import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBar from '../../components/NavBar';
import { useIsDesktop } from '../../hooks/useIsDesktop';

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
  const isDesktop = useIsDesktop();

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

  // Same 1180px desktop grid as the event and entity pages; the phone column stays 680.
  const S = {
    page: { minHeight: '100vh', background: '#0A0A09', color: '#ABD49E', fontFamily: "'Averia Sans Libre', 'Inter', sans-serif" },
    inner: {
      maxWidth: isDesktop ? 1180 : 680,
      margin: '0 auto',
      padding: isDesktop ? '104px 32px 80px' : '88px 20px 80px',
    },
    columns: { display: 'flex', gap: 48, alignItems: 'flex-start' },
    identity: { width: isDesktop ? 380 : undefined, flexShrink: 0 },
    avatar: {
      width: isDesktop ? 112 : 80, height: isDesktop ? 112 : 80, borderRadius: '50%',
      // Without this the long username beside it squeezes the circle into an ellipse.
      flexShrink: 0,
      background: 'rgba(171,212,158,0.08)',
      border: '1px solid rgba(171,212,158,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: isDesktop ? 44 : 32, color: 'rgba(171,212,158,0.3)', marginBottom: isDesktop ? 0 : 20,
      overflow: 'hidden',
    },
    name: { fontSize: isDesktop ? 34 : 26, fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 4px' },
    level: (lvl) => ({ fontSize: isDesktop ? 11 : 10, letterSpacing: '0.16em', color: LEVEL_COLORS[lvl] || '#ABD49E', marginBottom: 16 }),
    stat: { display: 'flex', gap: isDesktop ? 48 : 32, marginBottom: isDesktop ? 32 : 24, flexWrap: 'wrap' },
    statItem: { textAlign: 'center' },
    statNum: { fontSize: isDesktop ? 26 : 20, fontWeight: 700 },
    statLabel: { fontSize: isDesktop ? 11 : 10, letterSpacing: '0.12em', color: 'rgba(171,212,158,0.5)' },
    about: { fontSize: isDesktop ? 14 : 13, color: 'rgba(171,212,158,0.7)', lineHeight: 1.8, marginBottom: 28 },
    sectionTitle: { fontSize: isDesktop ? 11 : 10, letterSpacing: '0.18em', color: 'rgba(171,212,158,0.4)', marginBottom: 12, marginTop: 32 },
    editBtn: {
      background: 'transparent', border: '1px solid rgba(171,212,158,0.3)',
      color: '#ABD49E', fontSize: isDesktop ? 11 : 10, letterSpacing: '0.12em',
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

  // Written back to the same conversation the entity dialog's MESSAGE opens, from the
  // public id this page already fetched. Nobody messages themselves.
  const canMessage = !isOwnProfile && !!user._id;

  const identity = (
    <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', gap: isDesktop ? 24 : 20, marginBottom: isDesktop ? 0 : 20 }}>
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
          <p style={{ fontSize: isDesktop ? 12 : 11, color: 'rgba(171,212,158,0.4)', margin: 0 }}>{user.location}</p>
        )}
      </div>
    </div>
  );

  const actions = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: isDesktop ? 18 : 0 }}>
      {canMessage && (
        <button
          type="button"
          onClick={() => router.push(`/chat?to=${user._id}&name=${encodeURIComponent(user.username)}`)}
          style={S.editBtn}
        >
          MESSAGE
        </button>
      )}
      {isOwnProfile && (
        <button onClick={() => router.push('/kura')} style={S.editBtn}>
          GO TO YOUR KURA
        </button>
      )}
    </div>
  );

  const stats = (
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
  );

  const about = user.about ? (
    <>
      <div style={S.divider} />
      <p style={S.sectionTitle}>ABOUT</p>
      <p style={S.about}>{user.about}</p>
    </>
  ) : isOwnProfile ? (
    <>
      <div style={S.divider} />
      <p style={{ fontSize: 12, color: 'rgba(171,212,158,0.3)', fontStyle: 'italic' }}>
        No bio yet.
      </p>
    </>
  ) : null;

  const back = (
    <p
      onClick={() => router.back()}
      style={{ marginTop: 40, fontSize: 11, color: 'rgba(171,212,158,0.3)', cursor: 'pointer', letterSpacing: '0.1em' }}
    >
      ← BACK
    </p>
  );

  return (
    <div style={S.page}>
      <NavBar />
      <div style={S.inner}>
        {isDesktop ? (
          // Identity on the left, everything read on the right — the same split the entity
          // profile dialog uses.
          <div style={S.columns}>
            <div style={S.identity}>
              {identity}
              {actions}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {stats}
              {about}
              {back}
            </div>
          </div>
        ) : (
          <>
            {identity}
            {actions}
            {stats}
            {about}
            {back}
          </>
        )}
      </div>
    </div>
  );
}
