// pages/events/[eventId]/tickets.js — STEP 1 of 3: select tickets
//
// The CTA used to be conditional on `totalTickets > 0` while the "+" handler was wired to
// the wrong shape — TicketCard calls onQuantityChange(ticketId, quantity), but this page
// passed a one-argument adapter, so a tier stored its own ObjectId as the quantity, the
// total became NaN and the checkout bar never rendered. Selecting a ticket was a dead end.
//
// Now the handler keeps TicketCard's (ticketId, quantity) contract, and the next step is
// always on screen: disabled until something is selected, then "NEXT — YOUR DETAILS".
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import CheckoutSteps from '../../../components/CheckoutSteps';
import TicketCard from '../../../components/TicketCard';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';
import { readDraft, saveDraft, buildLines, totalOf, money } from '../../../utils/orderDraft';

const INK = '#151413';
const LEAF = '#ABD49E';

export default function TicketSelection() {
  const router = useRouter();
  const { eventId } = router.query;

  const [event, setEvent] = useState(null);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useHideBottomNav(true);

  // Resume from the draft, else honour a ?selections= deep link, then load the event.
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const draft = readDraft(eventId);
    if (draft.selections) {
      setSelections(draft.selections);
    } else if (router.query.selections) {
      try { setSelections(JSON.parse(decodeURIComponent(String(router.query.selections)))); } catch { /* malformed link */ }
    }

    fetch('/api/events/' + eventId)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { if (!cancelled) { setEvent(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Event not found'); setLoading(false); } });

    return () => { cancelled = true; };
  }, [eventId, router.query.selections]);

  const tickets = event?.tickets || [];
  const lines = buildLines(tickets, selections);
  const total = totalOf(lines);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  // TicketCard/TicketsList speak (ticketId, quantity); quantities are clamped to what is
  // still available, so a tier cannot be oversold from a screen left open.
  const setQuantity = useCallback((ticketId, qty) => {
    const ticket = tickets.find(t => (t._id || t.id) === ticketId);
    const max = ticket && typeof ticket.quantity === 'number'
      ? Math.max(0, ticket.quantity - (ticket.sold || 0))
      : Infinity;
    const next = Math.max(0, Math.min(qty, max));
    setSelections(prev => {
      const copy = { ...prev };
      if (next > 0) copy[ticketId] = next;
      else delete copy[ticketId];
      return copy;
    });
  }, [tickets]);

  const continueToDetails = () => {
    if (!count) return;
    // Carry the cart and the event's headline details into the next two steps.
    saveDraft(eventId, {
      selections,
      eventTitle: event?.title || '',
      eventLocation: event?.location || '',
      eventDate: event?.date || null,
    });
    router.push(`/events/${eventId}/checkout`);
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
        <span>{error}</span>
        <button onClick={() => router.push(`/events/${eventId}`)} style={{ height: 42, padding: '0 20px', backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          BACK TO EVENT
        </button>
      </div>
    );
  }

  return (
    <>
      <Head><title>Select Tickets — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, paddingBottom: 130 }}>
        <CheckoutSteps
          step={1}
          title="Select Tickets"
          subtitle={loading ? 'Loading tiers…' : event?.title}
          onBack={() => router.back()}
        />

        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No tickets available</div>
          ) : (
            tickets.map(ticket => {
              const id = ticket._id || ticket.id;
              const remaining = typeof ticket.quantity === 'number'
                ? Math.max(0, ticket.quantity - (ticket.sold || 0))
                : null;
              return (
                <div key={id}>
                  <TicketCard
                    ticket={ticket}
                    isSelectable
                    showQuantitySelector
                    selectedQuantity={selections[id] || 0}
                    onQuantityChange={setQuantity}
                  />
                  {remaining === 0 && (
                    <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, marginTop: 6 }}>SOLD OUT</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Next step — always on screen, so a selection is never a dead end. */}
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
            backgroundColor: INK, borderTop: `1px solid ${LEAF}`,
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, opacity: count ? 1 : 0.55 }}>
            <span>{count ? `${count} ticket${count !== 1 ? 's' : ''} selected` : 'No tickets selected'}</span>
            <span style={{ fontWeight: 700 }}>{count ? money(total) : ''}</span>
          </div>
          <button
            onClick={continueToDetails}
            disabled={!count}
            style={{
              width: '100%', height: 46, border: 'none', fontWeight: 700, fontSize: 13,
              letterSpacing: 1, backgroundColor: count ? LEAF : 'rgba(171,212,158,0.2)',
              color: count ? INK : LEAF, cursor: count ? 'pointer' : 'not-allowed',
            }}
          >
            {count ? 'NEXT — YOUR DETAILS' : 'SELECT A TICKET TO CONTINUE'}
          </button>
        </div>
      </div>
    </>
  );
}
