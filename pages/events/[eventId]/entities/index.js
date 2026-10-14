// pages/events/[eventId]/entities/index.js — Attendees/Talent/Exhibitors list
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../../hooks/useHideBottomNav';
import EventProfileModal from '../../../../components/EventProfileModal';

const TABS = ['ATTENDEES', 'TALENT', 'EXHIBITORS'];

export default function EntitiesPage() {
  const router = useRouter();
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
    fetch('/api/events/' + eventId).then(r => r.json()).then(data => { setEvent(data); setLoading(false); }).catch(() => setLoading(false));
  }, [eventId]);

  const list = !event ? [] : activeTab === 'ATTENDEES' ? (event.attendees || []) : activeTab === 'TALENT' ? (event.talents || []) : (event.exhibitors || []);

  return (
    <>
      <Head><title>{activeTab} — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 40 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{event?.title || 'Event'}</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(171,212,158,0.2)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, height: 40, background: activeTab === t ? '#ABD49E' : 'transparent', border: 'none', color: activeTab === t ? '#151413' : '#ABD49E', fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {loading ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading...</div>
          ) : list.length === 0 ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 40, opacity: 0.5 }}>No {activeTab.toLowerCase()} yet</div>
          ) : (
            list.map(entity => (
              <div key={entity._id || entity.id} onClick={() => setSelectedEntity({ ...entity, type: activeTab === 'ATTENDEES' ? 'ATTENDEE' : activeTab === 'TALENT' ? 'TALENT' : 'EXHIBITOR' })}
                style={{ cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ width: '100%', paddingTop: '100%', backgroundColor: 'rgba(171,212,158,0.08)', border: '1px solid rgba(171,212,158,0.2)', marginBottom: 6, position: 'relative' }}>
                  {entity.avatar && <img src={entity.avatar} alt={entity.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entity.name}</div>
                {entity.role && <div style={{ fontSize: 10, opacity: 0.5 }}>{entity.role}</div>}
              </div>
            ))
          )}
        </div>

        {selectedEntity && <EventProfileModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} eventName={event?.title} />}
      </div>
    </>
  );
}
