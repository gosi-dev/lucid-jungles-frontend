import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function TicketConfirmed() {
    const router = useRouter();
    const { eventId, transaction_id, tx_ref } = router.query;
    const [status, setStatus] = useState('loading');   // loading | confirmed | failed

    useEffect(() => {
        // If Flutterwave redirected here with query params, validate server-side
        if (!router.isReady) return;

        if (transaction_id && tx_ref) {
            fetch('/api/events/validate-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ transaction_id, tx_ref })
            })
                .then(r => r.json())
                .then(data => setStatus(data.confirmed ? 'confirmed' : 'failed'))
                .catch(() => setStatus('failed'));
        } else {
            // Arrived here from inline flow (no redirect params needed) — already confirmed
            setStatus('confirmed');
        }
    }, [router.isReady, transaction_id, tx_ref]);

    return (
        <>
            <Head><title>Ticket Confirmed | Lucid Jungles</title></Head>
            <div style={{
                minHeight: '100vh',
                background: '#151413',
                color: '#ABD49E',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                textAlign: 'center'
            }}>
                {status === 'loading' && <p style={{ opacity: 0.6 }}>Confirming payment...</p>}

                {status === 'confirmed' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
                        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>TICKET CONFIRMED</h1>
                        <p style={{ opacity: 0.7, marginBottom: 40 }}>A receipt has been sent to your email.</p>
                        <button
                            onClick={() => router.push('/')}
                            style={{ border: '1px solid #ABD49E', background: 'none', color: '#ABD49E', padding: '12px 32px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 12, width: '100%', maxWidth: 320 }}
                        >
                            BACK TO HOME
                        </button>
                        <button
                            onClick={() => router.push(`/events/${eventId}`)}
                            style={{ border: '1px solid #ABD49E', background: 'none', color: '#ABD49E', padding: '12px 32px', fontWeight: 'bold', cursor: 'pointer', width: '100%', maxWidth: 320 }}
                        >
                            VIEW EVENT
                        </button>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 20 }}>✗</div>
                        <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>PAYMENT NOT CONFIRMED</h1>
                        <p style={{ opacity: 0.7, marginBottom: 40 }}>Please contact support if you were charged.</p>
                        <button
                            onClick={() => router.push(`/events/${eventId}/tickets`)}
                            style={{ border: '1px solid #ABD49E', background: 'none', color: '#ABD49E', padding: '12px 32px', fontWeight: 'bold', cursor: 'pointer', width: '100%', maxWidth: 320 }}
                        >
                            TRY AGAIN
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
