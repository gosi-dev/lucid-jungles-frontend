// pages/events/[eventId]/tickets.js — Ticket selection
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';
import TicketCard from '../../../components/TicketCard';

export default function TicketSelection() {
  const router = useRouter();
  const { eventId } = router.query;
  const [tickets, setTickets] = useState([]);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('');

  useHideBottomNav(true);

  useEffect(() => {
    if (!eventId) return;
    fetch('/api/events/' + eventId)
      .then(r => r.json())
      .then(data => {
        setEventName(data.title || '');
        setTickets(data.tickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId]);

  const handleQuantityChange = (ticketId, qty) => {
    setSelections(prev => ({ ...prev, [ticketId]: qty }));
  };

  const total = tickets.reduce((sum, t) => {
    const qty = selections[t._id || t.id] || 0;
    return sum + qty * (t.price || 0);
  }, 0);

  const totalTickets = Object.values(selections).reduce((s, v) => s + v, 0);

  const handleCheckout = () => {
    if (totalTickets === 0) { alert('Please select at least one ticket'); return; }
    const params = encodeURIComponent(JSON.stringify(selections));
    router.push('/events/' + eventId + '/checkout?selections=' + params);
  };

  return (
    <>
      <Head><title>Select Tickets — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 80 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid #ABD49E', marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Select Tickets</span>
        </div>

        {eventName && <div style={{ padding: '0 16px 16px', fontSize: 13, opacity: 0.7 }}>{eventName}</div>}

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No tickets available</div>
          ) : (
            tickets.map(ticket => (
              <TicketCard
                key={ticket._id || ticket.id}
                ticket={ticket}
                isSelectable
                showQuantitySelector
                selectedQuantity={selections[ticket._id || ticket.id] || 0}
                onQuantityChange={(qty) => handleQuantityChange(ticket._id || ticket.id, qty)}
              />
            ))
          )}
        </div>

        {/* Total + CTA */}
        {totalTickets > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#151413', borderTop: '1px solid rgba(171,212,158,0.3)', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span>{totalTickets} ticket{totalTickets !== 1 ? 's' : ''}</span>
              <span style={{ fontWeight: 700 }}>₦{total.toLocaleString()}</span>
            </div>
            <button onClick={handleCheckout} style={{ width: '100%', height: 46, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
              CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  );
}
