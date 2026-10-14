// pages/tkxts/index.js — My Events / My Tickets hub
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useLayout } from '../../context/LayoutContext';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';
import TicketCard from '../../components/TicketCard';

export default function TkxtsHub() {
  const router = useRouter();
  const { setActiveNav } = useLayout();
  const { isLoggedIn, username, _id: userId } = useSelector(state => state.registerSlice);
  const [activeTab, setActiveTab] = useState('MY TICKETS');
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(false);
  useEffect(() => setActiveNav('YOU'), [setActiveNav]);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/signin'); return; }
    setLoading(true);
    const fetchTickets = fetch('/api/tickets/user/' + userId, { credentials: 'include' }).then(r => r.ok ? r.json() : []).catch(() => []);
    const fetchEvents = fetch('/api/events/user/' + userId, { credentials: 'include' }).then(r => r.ok ? r.json() : []).catch(() => []);
    Promise.all([fetchTickets, fetchEvents]).then(([t, e]) => {
      setTickets(Array.isArray(t) ? t : t.data || []);
      setEvents(Array.isArray(e) ? e : e.data || []);
      setLoading(false);
    });
  }, [isLoggedIn, userId]);

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
