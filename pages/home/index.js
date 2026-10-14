// pages/home/index.js — HOME BASE (DATA_MODEL.md: HomeBase; API: /api/home/:userId)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../../components/MvpShell';

const THEMES = ['jungle', 'sunset', 'midnight', 'neon'];

export default function HomeBasePage() {
  const router = useRouter();
  const { isLoggedIn, username } = useSelector((state) => state.registerSlice);

  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('jungle');
  const [decorInput, setDecorInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const profileRes = await fetch(`/api/user/u/${username}`, { credentials: 'include' });
      if (!profileRes.ok) throw new Error('Could not load profile');
      const profile = await profileRes.json();
      const id = profile?.data?._id || profile?._id;
      const res = await fetch(`/api/home/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHome(data.data);
        setTheme(data.data?.theme || 'jungle');
      } else {
        setHome(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    load();
  }, [isLoggedIn, load, router]);

  async function saveBase() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/home', {
        method: home ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save base');
      setHome(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addDecor() {
    if (!decorInput.trim()) return;
    const decorItems = [...(home?.decorItems || []), decorInput.trim()];
    setSaving(true);
    try {
      const res = await fetch('/api/home', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, decorItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not update base');
      setHome(data.data);
      setDecorInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MvpShell title="HOME BASE" subtitle={username ? `@${username}` : 'YOUR PERSONAL SPACE'}>
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>
              UPGRADE LEVEL {home?.upgradeLevel || 1}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
              {home ? (home.theme || 'JUNGLE').toUpperCase() : 'NO BASE YET'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {home
                ? `${(home.decorItems || []).length} decor items · ${(home.furniture || []).length} furniture`
                : 'Claim your base to place furniture and decor.'}
            </div>
          </div>

          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>THEME</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  style={{
                    ...mvpButton(false),
                    background: theme === t ? '#ABD49E' : 'transparent',
                    color: theme === t ? '#151413' : '#ABD49E',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" onClick={saveBase} disabled={saving} style={mvpButton(saving)}>
              {home ? 'UPDATE BASE' : 'CREATE BASE'}
            </button>
          </div>

          {home ? (
            <div style={mvpCard}>
              <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>DECOR</div>
              {(home.decorItems || []).length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>No decor yet.</div>
              ) : (
                <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 13 }}>
                  {home.decorItems.map((d, i) => (
                    <li key={`${d}-${i}`}>{d}</li>
                  ))}
                </ul>
              )}
              <input
                value={decorInput}
                onChange={(e) => setDecorInput(e.target.value)}
                placeholder="Add decor item"
                style={mvpInput}
              />
              <button
                type="button"
                onClick={addDecor}
                disabled={saving || !decorInput.trim()}
                style={mvpButton(saving || !decorInput.trim())}
              >
                ADD DECOR
              </button>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Link href="/store" style={{ color: '#ABD49E', fontSize: 12 }}>STORE →</Link>
            <Link href="/events" style={{ color: '#ABD49E', fontSize: 12 }}>EVENTS →</Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}

