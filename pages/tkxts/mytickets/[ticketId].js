// pages/tkxts/mytickets/[ticketId].js — Single ticket detail
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';

export default function TicketDetail() {
  const router = useRouter();
  const { ticketId } = router.query;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(true);

  useEffect(() => {
    if (!ticketId) return;
    fetch('/api/tickets/' + ticketId, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { setTicket(data ? (data.data || data) : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticketId]);

  if (loading) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ABD49E' }}>Loading...</div>;
  if (!ticket) return <div style={{ backgroundColor: '#151413', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}>Ticket not found</div>;

  return (
    <>
      <Head><title>My Ticket — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 40 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid rgba(171,212,158,0.15)' }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>My Ticket</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ border: '1px solid rgba(171,212,158,0.3)', padding: 24, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{ticket.ticketName || ticket.type || 'Ticket'}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{ticket.eventId?.title || 'Event'}</div>
            {(ticket.eventId?.location || ticket.eventId?.date) && (
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                {ticket.eventId?.location}
                {ticket.eventId?.location && ticket.eventId?.date ? ' · ' : ''}
                {ticket.eventId?.date ? new Date(ticket.eventId.date).toLocaleDateString() : ''}
              </div>
            )}
          </div>
          <div style={{ border: '1px solid rgba(171,212,158,0.15)', padding: 16 }}>
            {[
              { label: 'TICKET ID', value: ticket._id },
              { label: 'QUANTITY', value: ticket.quantity || 1 },
              { label: 'PRICE', value: ticket.totalPaid ? '\u20A6' + ticket.totalPaid.toLocaleString() : 'Free' },
              { label: 'STATUS', value: (ticket.status || 'confirmed').toUpperCase() },
              { label: 'REFERENCE', value: ticket.paymentRef || '—' },
              { label: 'DATE', value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(171,212,158,0.1)', fontSize: 13 }}>
                <span style={{ opacity: 0.6, letterSpacing: 1, fontSize: 11 }}>{row.label}</span>
                <span style={{ fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
