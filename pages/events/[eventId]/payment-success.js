// pages/events/[eventId]/payment-success.js — Purchase success
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';

export default function PaymentSuccess() {
  const router = useRouter();
  const { eventId } = router.query;
  useHideBottomNav(true);

  return (
    <>
      <Head><title>Tickets Confirmed — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎫</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Tickets Confirmed!</h1>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 40, lineHeight: 1.6 }}>Your tickets have been confirmed. Check your email for the booking details.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          <button onClick={() => router.push('/tkxts')} style={{ height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
            VIEW MY TICKETS
          </button>
          <button onClick={() => router.push('/events/' + eventId)} style={{ height: 46, backgroundColor: 'transparent', color: '#ABD49E', border: '1px solid #ABD49E', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
            BACK TO EVENT
          </button>
        </div>
      </div>
    </>
  );
}
