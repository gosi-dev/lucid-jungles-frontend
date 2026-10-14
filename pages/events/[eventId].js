// pages/events/[eventId].js — Event Detail
//
// Layout fidelity ported from UPDATED/client/pages/events/[eventId].js, which still carries the
// original Figma spec: 180×202 attendee cards (160 image), 270×358 talent cards (280 image),
// 300×358 exhibitor cards (280 image + three 30×30 product thumbnails) and a fixed bottom CTA.
// The donor fed that layout hardcoded mock data; here it renders the contract this app already
// uses — GET /api/events/{id} — so the design survives real, thin data.
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';
import { useLayout } from '../../context/LayoutContext';
import EventProfileModal from '../../components/EventProfileModal';
import TicketsList from '../../components/TicketsList';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = '#151413';
const LEAF = '#ABD49E';
const LEAF_10 = 'rgba(171,212,158,0.1)';
const LEAF_30 = 'rgba(171,212,158,0.3)';

// Entities arrive from different endpoints with different image field names.
const imgOf = (o = {}) => o.image || o.avatar || o.photo || o.coverImage || null;

// Section header — 18px bold title, action or count on the right, 1px leaf rule beneath.
function SectionHeader({ title, count, onViewAll }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottom: `1px solid ${LEAF}`, paddingBottom: 10 }}>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</span>
      {onViewAll ? (
        <button onClick={onViewAll} style={{ color: LEAF, fontSize: 14, opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          VIEW ALL{count ? ` (${count})` : ''}
        </button>
      ) : (
        <span style={{ fontSize: 14, opacity: 0.8 }}>{count}</span>
      )}
    </div>
  );
}

// The donor's fixed-width / fixed-image-height card, shared by all three entity rows so they
// stay visually in step.
function EntityCard({ entity, width, imageHeight, children, onClick }) {
  const src = imgOf(entity);
  return (
    <div onClick={onClick} style={{ flexShrink: 0, width, border: `1px solid ${LEAF}`, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ height: imageHeight, backgroundColor: LEAF_10, borderBottom: `1px solid ${LEAF}` }}>
        {src && <img src={src} alt={entity.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ padding: 10 }}>{children}</div>
    </div>
  );
}

// Keeps a section's shape when it has no data, so the layout never collapses to a bare heading in
// front of an audience. Deliberately blank — a placeholder, not invented people.
function EmptyCards({ width, imageHeight, label }) {
  return (
    <div style={{ flexShrink: 0, width, border: `1px dashed ${LEAF_30}` }}>
      <div style={{ height: imageHeight, backgroundColor: LEAF_10, borderBottom: `1px dashed ${LEAF_30}` }} />
      <div style={{ padding: 10, fontSize: 13, opacity: 0.5 }}>{label}</div>
    </div>
  );
}

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
  const goTo = (path) => router.push(path);
  const viewAll = (tab) => goTo(`/events/${eventId}/entities?tab=${tab}`);

  if (loading) return <div style={{ backgroundColor: INK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: LEAF }}>Loading...</div>;

  // Not a dead end — the failure state still offers a way forward.
  if (error || !event) {
    return (
      <div style={{ backgroundColor: INK, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', justifyContent: 'center', color: LEAF }}>
        <span>{error || 'Event not found'}</span>
        <button onClick={() => goTo('/events')} style={{ height: 42, padding: '0 20px', backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}>
          BROWSE EVENTS
        </button>
      </div>
    );
  }

  const attendees = event.attendees || [];
  const talents = event.talents || [];
  const exhibitors = event.exhibitors || [];
  const dateLabel = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <>
      <Head><title>{event.title} — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, padding: '0 8px', paddingBottom: 70 }}>
        {/* Header */}
        <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 7px', marginTop: 10, marginBottom: 15, borderBottom: `1px solid ${LEAF}` }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 7, background: 'none', border: 'none', color: LEAF, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>Event Name</span>
        </div>

        {/* Event description */}
        <div style={{ margin: '0 7px', padding: '10px 0' }}>
          <div style={{ minHeight: 457, border: `1px solid ${LEAF}`, overflow: 'hidden' }}>
            <div style={{ height: 200, backgroundColor: LEAF_10, borderBottom: `1px solid ${LEAF}` }}>
              {event.coverImage && <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ padding: 15 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{event.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 14 }}>
                <span style={{ fontWeight: 'bold' }}>{event.location}</span>
                <span style={{ opacity: 0.8 }}>{dateLabel}{event.time ? ` | ${event.time}` : ''}</span>
              </div>
              {event.description && (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10, opacity: 0.9, overflow: 'hidden', display: showFullDesc ? 'block' : '-webkit-box', WebkitLineClamp: showFullDesc ? 'unset' : 3, WebkitBoxOrient: 'vertical' }}>
                    {event.description}
                  </div>
                  {event.description.length > 200 && (
                    <button onClick={() => setShowFullDesc(v => !v)} style={{ color: LEAF, fontSize: 14, opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showFullDesc ? 'SEE LESS' : 'SEE MORE'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Who's Coming? */}
        <div style={{ margin: '0 7px', padding: '10px 0' }}>
          <SectionHeader title="Who's Coming?" count={attendees.length} onViewAll={attendees.length ? () => viewAll('ATTENDEES') : undefined} />
          <div style={{ display: 'flex', overflowX: 'auto', gap: 15, paddingBottom: 10 }}>
            {attendees.length === 0 && <EmptyCards width={180} imageHeight={160} label="No attendees yet" />}
            {attendees.map(a => (
              <EntityCard key={a._id || a.id} entity={a} width={180} imageHeight={160} onClick={() => setSelectedEntity({ ...a, type: 'ATTENDEE' })}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{a.name}</div>
                {a.role && <div style={{ fontSize: 11, opacity: 0.7 }}>{a.role}</div>}
              </EntityCard>
            ))}
          </div>
        </div>

        {/* Featured Talent */}
        <div style={{ margin: '0 7px', padding: '10px 0' }}>
          <SectionHeader title="Featured Talent" count={talents.length} onViewAll={talents.length ? () => viewAll('TALENTS') : undefined} />
          <div style={{ display: 'flex', overflowX: 'auto', gap: 15, paddingBottom: 10 }}>
            {talents.length === 0 && <EmptyCards width={270} imageHeight={280} label="No talent announced yet" />}
            {talents.map(t => (
              <EntityCard key={t._id || t.id} entity={t} width={270} imageHeight={280} onClick={() => setSelectedEntity({ ...t, type: 'TALENT' })}>
                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{t.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{t.role}</div>
              </EntityCard>
            ))}
          </div>
        </div>

        {/* Exhibitors — main image plus the donor's row of product thumbnails */}
        <div style={{ margin: '0 7px', padding: '10px 0' }}>
          <SectionHeader title="Exhibitors" count={exhibitors.length} onViewAll={exhibitors.length ? () => viewAll('EXHIBITORS') : undefined} />
          <div style={{ display: 'flex', overflowX: 'auto', gap: 15, paddingBottom: 10 }}>
            {exhibitors.length === 0 && <EmptyCards width={300} imageHeight={280} label="No exhibitors yet" />}
            {exhibitors.map(ex => (
              <div key={ex._id || ex.id} onClick={() => setSelectedEntity({ ...ex, type: 'EXHIBITOR' })} style={{ flexShrink: 0, width: 300, border: `1px solid ${LEAF}`, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ position: 'relative', height: 280, borderBottom: `1px solid ${LEAF}` }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: LEAF_10 }}>
                    {imgOf(ex) && <img src={imgOf(ex)} alt={ex.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 5 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 30, height: 30, backgroundColor: LEAF_30, border: `1px solid ${LEAF}`, overflow: 'hidden' }}>
                        {ex.products?.[i]?.image && <img src={ex.products[i].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>{ex.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{ex.role || ex.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets */}
        <div style={{ margin: '0 7px', padding: '10px 0' }}>
          <SectionHeader title="Tickets" count={tickets.length} />
          <TicketsList tickets={tickets} onTicketClick={() => goTo(`/events/${eventId}/tickets`)} isEventOwner={isAdmin} userTicketCounts={{}} />
        </div>

        {selectedEntity && (
          <EventProfileModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} eventName={event.title} />
        )}

        {/* Fixed CTA — outlined for the organiser, filled for everyone else */}
        {isAdmin ? (
          <button onClick={() => { setActiveNav('YOU'); goTo(`/tkxts/myevents/${eventId}/dashboard`); }}
            style={{ position: 'fixed', bottom: 15, left: 8, right: 8, height: 42, backgroundColor: 'transparent', color: LEAF, border: `1px solid ${LEAF}`, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', zIndex: 10000 }}>
            GO TO EVENT DASHBOARD
          </button>
        ) : (
          <button onClick={() => goTo(`/events/${eventId}/tickets`)}
            style={{ position: 'fixed', bottom: 15, left: 8, right: 8, height: 42, backgroundColor: LEAF, color: INK, border: `1px solid ${LEAF}`, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', zIndex: 10000 }}>
            PURCHASE TICKETS
          </button>
        )}
      </div>
    </>
  );
}
