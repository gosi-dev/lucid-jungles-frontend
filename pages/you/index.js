// pages/you/index.js — YOU: User Dashboard
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useLayout } from '../../context/LayoutContext';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';

export default function YouDashboard() {
  const router = useRouter();
  const { setActiveNav } = useLayout();
  const { isLoggedIn, username } = useSelector(state => state.registerSlice);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(false);
  useEffect(() => setActiveNav('YOU'), [setActiveNav]);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/signin'); return; }
    fetch(`/api/user/u/${username}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setProfile(data.data || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoggedIn, username]);

  const xpCurrent = profile?.xp || 0;
  const xpTotal = 100;
  const level = profile?.level || 'NOVICE EXPLORER';

  const gridButtons = [
    { key: 'wallet', label: 'WALLET', icon: '💰', href: '/you/wallet' },
    { key: 'tkxts', label: 'TKXTS', icon: '🎫', href: '/tkxts' },
    { key: 'my-store', label: 'MY STORE', icon: '🏪', href: '/store' },
    { key: 'my-dreamer', label: 'MY DREAMER', icon: '🌿', href: '/kura' },
    { key: 'my-base', label: 'MY BASE', icon: '🏠', href: `/profile/${username}` },
    { key: 'events', label: 'MY EVENTS', icon: '📅', href: '/tkxts' },
  ];

  return (
    <>
      <Head><title>YOU — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid rgba(171,212,158,0.15)', padding: '0 16px' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>YOUR DASHBOARD</h1>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>Loading...</div>
        ) : (
          <>
            {/* Profile card */}
            <div style={{ margin: '16px', border: '1px solid rgba(171,212,158,0.15)', padding: '20px 16px' }}>
              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
                {[
                  { label: 'MOMENTS', value: profile?.moments || 0 },
                  { label: 'CONNECTIONS', value: profile?.fanbase?.length || 0 },
                  { label: 'STREAK', value: `${profile?.loginStreak || 0}d` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Name + level */}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{username?.toUpperCase() || 'USER'}</h2>
                <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>{level}</div>

                {/* XP bar */}
                <div style={{ backgroundColor: 'rgba(171,212,158,0.1)', height: 6, width: '100%', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${Math.min((xpCurrent / xpTotal) * 100, 100)}%`, backgroundColor: '#ABD49E' }} />
                </div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{xpCurrent}/{xpTotal} XP</div>
              </div>

              {/* Bio */}
              {profile?.about && (
                <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.8, marginBottom: 16 }}>{profile.about}</p>
              )}

              {/* Edit profile button */}
              <button
                onClick={() => router.push(`/profile/${username}`)}
                style={{ width: '100%', height: 40, backgroundColor: 'transparent', color: '#ABD49E', border: '1px solid #ABD49E', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 1 }}
              >
                VIEW PROFILE
              </button>
            </div>

            {/* Grid buttons */}
            <div style={{ margin: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, border: '1px solid rgba(171,212,158,0.15)' }}>
              {gridButtons.map((btn, i) => (
                <Link key={btn.key} href={btn.href}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: 100, backgroundColor: '#151413', textDecoration: 'none',
                    borderRight: (i + 1) % 3 !== 0 ? '1px solid rgba(171,212,158,0.15)' : 'none',
                    borderBottom: i < 3 ? '1px solid rgba(171,212,158,0.15)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 28, marginBottom: 6 }}>{btn.icon}</span>
                  <span style={{ color: '#ABD49E', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{btn.label}</span>
                </Link>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ margin: '16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ color: 'rgba(171,212,158,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>QUICK ACTIONS</div>
              {[
                { label: 'CREATE AN EVENT', href: '/createevents' },
                { label: 'BROWSE EVENTS', href: '/' },
                { label: 'EXPLORE JUNGLE MAP', href: '/jungle' },
                { label: 'BROWSE FANBASES', href: '/fanbase' },
                { label: 'THE STORE', href: '/store' },
              ].map(link => (
                <Link key={link.label} href={link.href}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 16px', border: '1px solid rgba(171,212,158,0.15)', textDecoration: 'none', backgroundColor: '#151413' }}
                >
                  <span style={{ color: '#ABD49E', fontSize: 13, fontWeight: 600 }}>{link.label}</span>
                  <span style={{ color: 'rgba(171,212,158,0.4)', fontSize: 16 }}>›</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
