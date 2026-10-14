// pages/invitation/[inviteId]/index.js — Invitation landing
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';

export default function InvitationLanding() {
  const router = useRouter();
  const { inviteId } = router.query;
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(true);

  useEffect(() => {
    if (!inviteId) return;
    fetch('/api/invitations/' + inviteId)
      .then(r => r.json())
      .then(data => { setInvite(data.data || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [inviteId]);

  if (loading) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ABD49E' }}>Loading...</div>;
  if (!invite) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}>Invitation not found</div>;

  return (
    <>
      <Head><title>You're Invited — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🌿</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're Invited!</h1>
        {invite.eventName && <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>{invite.eventName}</p>}
        <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, marginBottom: 32 }}>{invite.message || "You've been invited to participate in this event."}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          {invite.type === 'talent' && (
            <button onClick={() => router.push('/invitation/' + inviteId + '/talent/form')}
              style={{ height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
              APPLY AS TALENT
            </button>
          )}
          {invite.type === 'vendor' && (
            <button onClick={() => router.push('/invitation/' + inviteId + '/vendor/form')}
              style={{ height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
              APPLY AS VENDOR
            </button>
          )}
          {invite.type === 'attendee' && (
            <button onClick={() => router.push('/events/' + invite.eventId)}
              style={{ height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
              VIEW EVENT
            </button>
          )}
          <button onClick={() => router.push('/')} style={{ height: 40, backgroundColor: 'transparent', color: '#ABD49E', border: '1px solid rgba(171,212,158,0.3)', cursor: 'pointer', fontSize: 13 }}>
            Decline
          </button>
        </div>
      </div>
    </>
  );
}
