// pages/settings.js — SETTINGS (API: /api/user/profile, /api/user/profile/update)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';

export default function SettingsPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [form, setForm] = useState({ username: '', email: '', profile_picture: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const user = data.data || data;
        setForm({
          username: user?.username || '',
          email: user?.email || '',
          profile_picture: user?.profile_picture || '',
        });
      }
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

  async function save() {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not save');
      setStatus('Saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MvpShell title="SETTINGS" subtitle="YOUR ACCOUNT">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}
          {status ? <div style={{ color: '#ABD49E', marginBottom: 12 }}>{status}</div> : null}

          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>PROFILE</div>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              style={mvpInput}
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              style={mvpInput}
            />
            <input
              value={form.profile_picture}
              onChange={(e) => setForm({ ...form, profile_picture: e.target.value })}
              placeholder="Profile picture URL"
              style={mvpInput}
            />
            <button type="button" onClick={save} disabled={saving} style={mvpButton(saving)}>
              SAVE CHANGES
            </button>
          </div>

          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>ACCOUNT</div>
            <button
              type="button"
              onClick={() => router.push('/reset-password')}
              style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E', marginRight: 8 }}
            >
              CHANGE PASSWORD
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/user/logout', { method: 'POST', credentials: 'include' });
                router.push('/signin');
              }}
              style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E' }}
            >
              LOG OUT
            </button>
          </div>
        </>
      )}
    </MvpShell>
  );
}
