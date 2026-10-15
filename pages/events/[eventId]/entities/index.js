// pages/events/[eventId]/entities/index.js — Attendees / Talent / Exhibitors list
//
// Reached from the VIEW ALL action on each section of the event page. The list was a fixed
// `1fr 1fr 1fr` grid, which on a laptop stretched three avatars into ~450px squares and
// left the tab strip full-bleed across the window. It is now a centred, max-width column
// with a grid that adds columns as the viewport allows.
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../../hooks/useHideBottomNav';
import { useIsDesktop } from '../../../../hooks/useIsDesktop';
import EventProfileModal from '../../../../components/EventProfileModal';

const TABS = ['ATTENDEES', 'TALENT', 'EXHIBITORS'];

const INK = '#151413';
const LEAF = '#ABD49E';
const LEAF_08 = 'rgba(171,212,158,0.08)';
const LEAF_30 = 'rgba(171,212,158,0.3)';

// Tab → the event field it reads, and the entity type the profile modal expects.
const TAB_SOURCE = { ATTENDEES: 'attendees', TALENT: 'talents', EXHIBITORS: 'exhibitors' };
const TAB_TYPE = { ATTENDEES: 'ATTENDEE', TALENT: 'TALENT', EXHIBITORS: 'EXHIBITOR' };

const imgOf = (o = {}) => o.image || o.avatar || o.photo || o.coverImage || o.logo || null;

export default function EntitiesPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { eventId, tab: tabParam } = router.query;
  const [activeTab, setActiveTab] = useState('ATTENDEES');
  const [event, setEvent] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(true);

  useEffect(() => {
    if (!tabParam) return;
    // Accept both spellings — `events/[eventId].js` links here with ?tab=TALENTS while the
    // tab labels are singular. Normalising keeps the two in step.
    const wanted = String(tabParam).toUpperCase();
    const match = TABS.find(t => t === wanted || t + 'S' === wanted);
    if (match) setActiveTab(match);
  }, [tabParam]);

  useEffect(() => {
    if (!eventId) return;
    fetch('/api/events/' + eventId)
      .then(r => r.json())
      .then(data => { setEvent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [eventId]);

  const list = event ? (event[TAB_SOURCE[activeTab]] || []) : [];
  const counts = event
    ? TABS.reduce((acc, t) => ({ ...acc, [t]: (event[TAB_SOURCE[t]] || []).length }), {})
    : {};

  return (
    <>
      <Head><title>{activeTab} — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, paddingBottom: 64 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isDesktop ? '0 32px 64px' : '0 16px 32px' }}>

          {/* Header */}
          <div style={{ height: isDesktop ? 72 : 54, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: `1px solid ${LEAF_30}` }}>
            <button onClick={() => router.back()} aria-label="Back" style={{ position: 'absolute', left: 0, background: 'none', border: 'none', color: LEAF, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <ArrowLeft size={22} />
            </button>
            <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, fontSize: isDesktop ? 18 : 15 }}>
              {event?.title || 'Event'}
            </span>
          </div>

          {/* Tabs — a segmented control on desktop, three equal thirds on a phone */}
          <div style={{ display: 'flex', gap: isDesktop ? 10 : 0, borderBottom: isDesktop ? 'none' : `1px solid ${LEAF_30}`, marginTop: isDesktop ? 24 : 0 }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  flex: isDesktop ? '0 0 auto' : 1,
                  minWidth: isDesktop ? 170 : 0,
                  height: isDesktop ? 42 : 40,
                  backgroundColor: activeTab === t ? LEAF : 'transparent',
                  border: `1px solid ${activeTab === t ? LEAF : LEAF_30}`,
                  color: activeTab === t ? INK : LEAF,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                {t}{counts[t] ? ` (${counts[t]})` : ''}
              </button>
            ))}
          </div>

          {/* Grid — three across on a phone, as many as fit on a desktop */}
          <div
            style={{
              marginTop: isDesktop ? 28 : 16,
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(180px, 1fr))' : 'repeat(3, 1fr)',
              gap: isDesktop ? 20 : 10,
            }}
          >
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, opacity: 0.5 }}>Loading...</div>
            ) : list.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, opacity: 0.5 }}>No {activeTab.toLowerCase()} yet</div>
            ) : (
              list.map(entity => {
                const src = imgOf(entity);
                const name = entity.name || entity.company || 'Unnamed';
                return (
                  <button
                    key={entity._id || entity.id}
                    onClick={() => setSelectedEntity({ ...entity, type: TAB_TYPE[activeTab] })}
                    title={name}
                    className="hover:opacity-90"
                    style={{ padding: 0, background: 'none', border: 'none', color: LEAF, cursor: 'pointer', textAlign: isDesktop ? 'left' : 'center', font: 'inherit' }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1 / 1', backgroundColor: LEAF_08, border: `1px solid ${LEAF_30}`, marginBottom: 8, overflow: 'hidden' }}>
                      {src && <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ fontSize: isDesktop ? 14 : 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    {entity.role && <div style={{ fontSize: isDesktop ? 12 : 10, opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entity.role}</div>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {selectedEntity && (
          <EventProfileModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} eventName={event?.title} />
        )}
      </div>
    </>
  );
}

