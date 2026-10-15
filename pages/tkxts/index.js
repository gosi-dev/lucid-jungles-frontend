// pages/tkxts/index.js — My Events / My Tickets hub
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLayout } from '../../context/LayoutContext';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';
import { useSignedIn } from '../../hooks/useSignedIn';
import TicketCard from '../../components/TicketCard';

const shortDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// A purchase record is not a ticket card: the card wants the event's own details, so the
// two are joined here rather than bending TicketCard around an API shape.
const toTicketCard = (purchase) => {
  const event = purchase.eventId || {};
  return {
    ...purchase,
    title: event.title || 'Event',
    name: purchase.ticketName || 'Ticket',
    location: event.location || '',
    date: shortDate(event.date),
    time: event.time || '',
    purchaseDate: shortDate(purchase.createdAt),
    ticketCount: purchase.quantity || 1,
  };
};

export default function TkxtsHub() {
  const router = useRouter();
  const { setActiveNav } = useLayout();
  // The server decides whether this account is signed in; redux only knows this device.
  const { status: sessionStatus } = useSignedIn();
  const [activeTab, setActiveTab] = useState('MY TICKETS');
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(false);
  useEffect(() => setActiveNav('YOU'), [setActiveNav]);

  useEffect(() => {
    if (sessionStatus === 'out') { router.push('/signin'); return; }
    if (sessionStatus !== 'in') return;   // still asking the server — stay on "Loading…"
    setLoading(true);
    // Both lists are session-scoped. The previous version asked for /api/tickets/user/<redux _id>,
    // and that id is never populated by sign-in, so it requested /user/undefined and a fresh
    // purchase never appeared in TKXTS.
    const fetchTickets = fetch('/api/events/user/my-tickets', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : [])).catch(() => []);
    const fetchEvents = fetch('/api/events/mine', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : [])).catch(() => []);
    Promise.all([fetchTickets, fetchEvents]).then(([t, e]) => {
      setTickets((Array.isArray(t) ? t : t.data || []).map(toTicketCard));
      setEvents(Array.isArray(e) ? e : e.data || []);
      setLoading(false);
    });
  }, [sessionStatus]);

  return (
    <>
      <Head><title>TKXTS — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>TKXTS</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          {['MY TICKETS', 'MY EVENTS'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, height: 44, background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? '#151413' : '#ABD49E',
                backgroundColor: activeTab === tab ? '#ABD49E' : 'transparent',
                fontWeight: 700, fontSize: 12, letterSpacing: 1,
                borderBottom: activeTab === tab ? 'none' : '1px solid transparent',
              }}
            >{tab}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading...</div>
        ) : activeTab === 'MY TICKETS' ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎫</div>
                <div style={{ opacity: 0.5, fontSize: 14 }}>No tickets yet</div>
                <Link href="/" style={{ color: '#ABD49E', fontSize: 13, marginTop: 12, display: 'block' }}>BROWSE EVENTS</Link>
              </div>
            ) : (
              tickets.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} variant="purchased"
                  onClick={() => router.push('/tkxts/mytickets/' + ticket._id)} />
              ))
            )}
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
                <div style={{ opacity: 0.5, fontSize: 14 }}>No events created yet</div>
                <Link href="/createevents" style={{ color: '#ABD49E', fontSize: 13, marginTop: 12, display: 'block' }}>CREATE AN EVENT</Link>
              </div>
            ) : (
              <>
                <Link href="/createevents" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, border: '1px dashed rgba(171,212,158,0.4)', color: '#ABD49E', textDecoration: 'none', fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                  + CREATE NEW EVENT
                </Link>
                {events.map(ev => (
                  <div key={ev._id} style={{ border: '1px solid rgba(171,212,158,0.15)', padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>{ev.location} — {ev.date ? new Date(ev.date).toLocaleDateString() : ''}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={'/events/' + ev._id + '?admin=1'} style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(171,212,158,0.1)', color: '#ABD49E', textDecoration: 'none', fontSize: 11, fontWeight: 700, border: '1px solid rgba(171,212,158,0.3)', letterSpacing: 1 }}>
                        VIEW
                      </Link>
                      <Link href={'/tkxts/myevents/' + ev._id + '/dashboard'} style={{ flex: 2, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ABD49E', color: '#151413', textDecoration: 'none', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                        MANAGE →
                      </Link>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
