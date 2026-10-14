// pages/events/[eventId].js — Event Detail (UPDATED design)
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';
import { useLayout } from '../../context/LayoutContext';
import EventProfileModal from '../../components/EventProfileModal';
import TicketsList from '../../components/TicketsList';
import { useSelector } from 'react-redux';

export default function EventDetail() {
  const router = useRouter();
  const { eventId } = router.query;
  const { setActiveNav } = useLayout();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useHideBottomNav(true);

  useEffect(() => {
    if (!eventId) return;
    fetch('/api/events/' + eventId)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { setEvent(data); setTickets(data.tickets || []); setLoading(false); })
      .catch(() => { setError('Event not found'); setLoading(false); });
  }, [eventId]);

  const isAdmin = router.query.admin === '1' || router.query.admin === 'true';

  if (loading) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ABD49E' }}>Loading...</div>;
  if (error || !event) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}>{error || 'Event not found'}</div>;

  return (
    <>
      <Head><title>{event.title} — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 80 }}>

        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid #ABD49E', marginBottom: 15 }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Event Details</span>
        </div>

        <div style={{ padding: '0 8px' }}>
          <div style={{ border: '1px solid #ABD49E', marginBottom: 16 }}>
            <div style={{ height: 200, backgroundColor: 'rgba(171,212,158,0.05)', borderBottom: '1px solid #ABD49E' }}>
              {event.coverImage && <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ padding: 16 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{event.title}</h1>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16, opacity: 0.8 }}>
                <span>{event.location}</span>
                <span>{event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
              </div>
              {event.description && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.6, overflow: showFullDesc ? 'visible' : 'hidden', display: showFullDesc ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{event.description}</p>
                  {event.description.length > 200 && (
                    <button onClick={() => setShowFullDesc(v => !v)} style={{ background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer', fontSize: 13, padding: 0, marginTop: 4, textDecoration: 'underline' }}>
                      {showFullDesc ? 'SEE LESS' : 'SEE MORE'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {event.attendees && event.attendees.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(171,212,158,0.3)', paddingBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>WHO\'S COMING?</span>
                <span style={{ opacity: 0.6, fontSize: 13 }}>{event.attendees.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {event.attendees.map(a => (
                  <div key={a.id || a._id} onClick={() => setSelectedEntity({ ...a, type: 'ATTENDEE' })} style={{ flexShrink: 0, cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, backgroundColor: 'rgba(171,212,158,0.1)', border: '1px solid rgba(171,212,158,0.3)', marginBottom: 4 }} />
                    <div style={{ fontSize: 10, opacity: 0.8, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.talents && event.talents.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(171,212,158,0.3)', paddingBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>FEATURED TALENT</span>
                <span style={{ opacity: 0.6, fontSize: 13 }}>{event.talents.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {event.talents.map(t => (
                  <div key={t.id || t._id} onClick={() => setSelectedEntity({ ...t, type: 'TALENT' })} style={{ flexShrink: 0, cursor: 'pointer', width: 80 }}>
                    <div style={{ width: 80, height: 80, backgroundColor: 'rgba(171,212,158,0.1)', border: '1px solid rgba(171,212,158,0.3)', marginBottom: 4 }} />
                    <div style={{ fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>{t.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.exhibitors && event.exhibitors.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(171,212,158,0.3)', paddingBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>EXHIBITORS</span>
                <span style={{ opacity: 0.6, fontSize: 13 }}>{event.exhibitors.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {event.exhibitors.map(ex => (
                  <div key={ex.id || ex._id} onClick={() => setSelectedEntity({ ...ex, type: 'EXHIBITOR' })} style={{ flexShrink: 0, cursor: 'pointer', width: 100 }}>
                    <div style={{ width: 100, height: 80, backgroundColor: 'rgba(171,212,158,0.1)', border: '1px solid rgba(171,212,158,0.3)', marginBottom: 4 }} />
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{ex.name}</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>{ex.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1, marginBottom: 12, borderBottom: '1px solid rgba(171,212,158,0.3)', paddingBottom: 8 }}>TICKETS</div>
            <TicketsList tickets={tickets} onTicketClick={() => router.push('/events/' + eventId + '/tickets')} />
          </div>

          {isAdmin ? (
            <button onClick={() => { setActiveNav('YOU'); router.push('/tkxts/myevents/' + eventId + '/dashboard'); }}
              style={{ width: '100%', height: 50, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
              GO TO EVENT DASHBOARD
            </button>
          ) : (
            <button onClick={() => router.push('/events/' + eventId + '/tickets')}
              style={{ width: '100%', height: 50, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
              PURCHASE TICKETS
            </button>
          )}
        </div>

        {selectedEntity && <EventProfileModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} eventName={event.title} />}
      </div>
    </>
  );
}
