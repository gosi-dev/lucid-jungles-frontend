// pages/tkxts/myevents/[eventId]/dashboard.js — Event admin dashboard
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../../hooks/useHideBottomNav';

export default function EventDashboard() {
  const router = useRouter();
  const { eventId } = router.query;
  const [stats, setStats] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(true);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      fetch('/api/events/' + eventId, { credentials: 'include' }).then(r => r.json()).catch(() => null),
      fetch('/api/tkxts/events/' + eventId + '/dashboard', { credentials: 'include' }).then(r => r.json()).catch(() => null),
    ]).then(([ev, st]) => {
      setEvent(ev);
      setStats(st);
      setLoading(false);
    });
  }, [eventId]);

  const statCards = [
    { label: 'TOTAL TICKETS', value: stats?.totalTickets || 0 },
    { label: 'SOLD', value: stats?.ticketsSold || 0 },
    { label: 'CHECKED IN', value: stats?.checkedIn || 0 },
    { label: 'REVENUE', value: stats?.revenue ? '\u20A6' + stats.revenue.toLocaleString() : '\u20A60' },
  ];

  const manageSections = [
    { label: 'MANAGE TICKETS', href: '/tkxts/myevents/' + eventId + '/tickets' },
    { label: 'PROGRAM / SESSIONS', href: '/tkxts/myevents/' + eventId + '/program' },
    { label: 'ATTENDEES', href: '/events/' + eventId + '/entities?tab=ATTENDEES&admin=1' },
    { label: 'TALENT', href: '/events/' + eventId + '/entities?tab=TALENT&admin=1' },
    { label: 'EXHIBITORS', href: '/events/' + eventId + '/entities?tab=EXHIBITORS&admin=1' },
    { label: 'VIEW PUBLIC EVENT', href: '/events/' + eventId },
  ];

  if (loading) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ABD49E' }}>Loading...</div>;

  return (
    <>
      <Head><title>Event Dashboard — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 40 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <button onClick={() => router.push('/tkxts')} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Event Dashboard</span>
        </div>

        <div style={{ padding: 16 }}>
          {event && <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{event.title}</h2>}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ border: '1px solid rgba(171,212,158,0.15)', padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Management sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ color: 'rgba(171,212,158,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>MANAGE</div>
            {manageSections.map(s => (
              <Link key={s.label} href={s.href}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 16px', border: '1px solid rgba(171,212,158,0.15)', backgroundColor: '#151413', textDecoration: 'none', color: '#ABD49E' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                <span style={{ opacity: 0.4, fontSize: 16 }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
