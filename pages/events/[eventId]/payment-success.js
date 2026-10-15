// pages/events/[eventId]/payment-success.js — the receipt
//
// This page used to be a 🎫, a "check your email" promise nothing sends, and a link to
// /tkxts — it never showed what had been bought. It is now the receipt itself: read from
// the order draft the payment step leaves behind, or rebuilt from the confirmed purchases
// when the page is revisited later or reached from a provider redirect.
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';
import { readDraft, money } from '../../../utils/orderDraft';

const INK = '#151413';
const LEAF = '#ABD49E';
const CARD = { border: '1px solid rgba(171,212,158,0.3)', padding: 16 };

const shortDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Rebuild a receipt from the server when the draft is gone (refresh, revisit, or the
// provider's redirect landing here for the first time).
const receiptFromPurchases = (purchases = []) => {
  if (!purchases.length) return null;
  const event = purchases[0].eventId || {};
  return {
    items: purchases.map(p => ({ name: p.ticketName, qty: p.quantity, subtotal: p.totalPaid || 0 })),
    total: purchases.reduce((sum, p) => sum + (p.totalPaid || 0), 0),
    currency: purchases[0].currency || 'NGN',
    reference: purchases[0].paymentRef || purchases[0]._id,
    simulated: false,
    buyer: { name: '', email: '' },
    eventTitle: event.title || '',
    eventLocation: event.location || '',
    eventDate: event.date || null,
    createdAt: purchases[0].createdAt || null,
    recovered: true,
  };
};

export default function PaymentSuccess() {
  const router = useRouter();
  const { eventId, ref: refParam } = router.query;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useHideBottomNav(true);

  useEffect(() => {
    if (!eventId) return;

    const stored = readDraft(eventId).receipt;
    if (stored) {
      setReceipt(stored);
      setLoading(false);
      return;
    }

    // No draft: ask the server what this account holds for this event.
    fetch('/api/events/user/my-tickets', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : []))
      .then(list => {
        const purchases = (Array.isArray(list) ? list : list.data || [])
          .filter(p => String(p.eventId?._id || p.eventId) === String(eventId));
        setReceipt(receiptFromPurchases(purchases));
        setLoading(false);
      })
      .catch(() => { setReceipt(null); setLoading(false); });
  }, [eventId]);

  const reference = receipt?.reference || refParam || null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: 0.6 }}>
        Preparing your receipt…
      </div>
    );
  }

  // Nothing bought, or the account is not signed in on this device to prove otherwise.
  if (!receipt) {
    return (
      <>
        <Head><title>Tickets — Lucid Jungles</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎟️</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No recent order to show</div>
          <div style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.6, marginBottom: 28, maxWidth: 300 }}>
            If you have just been charged, your ticket is in TKXTS under this account.
          </div>
          <button onClick={() => router.push('/tkxts')} style={{ width: '100%', maxWidth: 320, height: 46, backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer', marginBottom: 12 }}>
            VIEW MY TICKETS
          </button>
          <button onClick={() => router.push(`/events/${eventId}/tickets`)} style={{ width: '100%', maxWidth: 320, height: 46, backgroundColor: 'transparent', color: LEAF, border: `1px solid ${LEAF}`, fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
            BUY TICKETS
          </button>
        </div>
      </>
    );
  }

  const itemCount = receipt.items.reduce((sum, i) => sum + i.qty, 0);
  const when = shortDate(receipt.eventDate);

  return (
    <>
      <Head><title>Tickets Confirmed — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, padding: '32px 16px 40px' }}>

        {/* Confirmation */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
            border: `1px solid ${LEAF}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>✓</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>TICKETS CONFIRMED</h1>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {itemCount} ticket{itemCount !== 1 ? 's' : ''} issued to {receipt.buyer?.name || 'you'}
          </div>
        </div>

        {/* The ticket itself */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{receipt.eventTitle || 'Event'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            <span>WHEN</span>
            <span>{when || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
            <span>WHERE</span>
            <span>{receipt.eventLocation || '—'}</span>
          </div>
          <div style={{ borderTop: '1px dashed rgba(171,212,158,0.5)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.6, marginBottom: 4 }}>REFERENCE</div>
              <div style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all', maxWidth: 210 }}>{reference || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.6, marginBottom: 4 }}>ADMIT</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{itemCount}</div>
            </div>
          </div>
        </div>

        {/* What was bought */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, marginBottom: 10 }}>ORDER</div>
          {receipt.items.map((item, i) => (
            <div key={`${item.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>{item.name} × {item.qty}</span>
              <span>{item.subtotal === 0 ? 'Free' : money(item.subtotal)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(171,212,158,0.3)', paddingTop: 10, marginTop: 10, fontWeight: 700 }}>
            <span>{receipt.total === 0 ? 'TOTAL' : 'PAID'}</span>
            <span>{receipt.total === 0 ? 'FREE' : money(receipt.total)}</span>
          </div>
        </div>

        {/* Who holds it, and how it was paid — stated, not promised */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          {receipt.buyer?.email && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              <span>TICKET HOLDER</span>
              <span style={{ wordBreak: 'break-all', maxWidth: 200, textAlign: 'right' }}>{receipt.buyer.email}</span>
            </div>
          )}
          {receipt.createdAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}>
              <span>ISSUED</span>
              <span>{shortDate(receipt.createdAt)}</span>
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.6, marginTop: 10 }}>
            {receipt.simulated
              ? 'Test mode: this payment was simulated, so no money moved. The ticket is real in your account.'
              : receipt.recovered
                ? 'Confirmed purchases retrieved from your account.'
                : receipt.total === 0
                  ? 'No payment was required for this order.'
                  : 'Paid by card and verified with the payment provider.'}
          </div>
        </div>

        {/* Where the ticket actually lives — the one claim this page can keep. */}
        <div style={{ fontSize: 11, opacity: 0.55, textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
          Your ticket is saved to TKXTS under this account and is valid for entry.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 340, margin: '0 auto' }}>
          <button onClick={() => router.push('/tkxts')}
            style={{ height: 46, backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
            VIEW MY TICKETS
          </button>
          <button onClick={() => router.push(`/events/${eventId}`)}
            style={{ height: 46, backgroundColor: 'transparent', color: LEAF, border: `1px solid ${LEAF}`, fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
            BACK TO EVENT
          </button>
        </div>
      </div>
    </>
  );
}
