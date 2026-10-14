import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavBar from '../../components/NavBar';

export default function Events() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/events')
            .then(r => r.json())
            .then(data => { setEvents(data); setLoading(false); })
            .catch(() => { setError('Failed to load events'); setLoading(false); });
    }, []);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <>
            <Head><title>Events | Lucid Jungles</title></Head>
            <div style={{ minHeight: '100vh', background: '#151413', color: '#ABD49E', paddingBottom: 120 }}>
                <NavBar />
                <div style={{ padding: '20px 16px' }}>
                    <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24, borderBottom: '1px solid #ABD49E', paddingBottom: 10 }}>
                        EVENTS
                    </h1>

                    {loading && <p style={{ opacity: 0.6 }}>Loading events...</p>}
                    {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

                    {!loading && !error && events.length === 0 && (
                        <p style={{ opacity: 0.6 }}>No events yet.</p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {events.map(event => (
                            <div
                                key={event._id}
                                onClick={() => router.push(`/events/${event._id}`)}
                                style={{
                                    border: '1px solid #ABD49E',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    background: 'transparent'
                                }}
                            >
                                {event.coverImage && (
                                    <img
                                        src={event.coverImage}
                                        alt={event.title}
                                        style={{ width: '100%', height: 160, objectFit: 'cover', marginBottom: 12 }}
                                    />
                                )}
                                <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>{event.title}</h2>
                                <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{formatDate(event.date)}</p>
                                {event.location && (
                                    <p style={{ fontSize: 13, opacity: 0.7 }}>{event.location}</p>
                                )}
                                {event.tickets && event.tickets.length > 0 && (
                                    <p style={{ fontSize: 13, marginTop: 8, opacity: 0.9 }}>
                                        From {event.tickets[0].currency} {Math.min(...event.tickets.map(t => t.price)).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
