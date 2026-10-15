// pages/events/[eventId]/checkout.js — STEP 2 of 3: your details
//
// Previously this page both collected details and fired the purchase, so the payment
// provider opened on top of a form the user had not finished reviewing (and the "BANK
// TRANSFER" panel was decorative). Details and payment are now separate steps: this screen
// reviews the order, collects the buyer, and names — honestly — how payment will happen.
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import CheckoutSteps from '../../../components/CheckoutSteps';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';
import { useSignedIn } from '../../../hooks/useSignedIn';
import { readDraft, saveDraft, buildLines, totalOf, isFree, money, signinHref } from '../../../utils/orderDraft';

const INK = '#151413';
const LEAF = '#ABD49E';
const FIELD = { width: '100%', height: 42, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: LEAF, paddingLeft: 10, fontSize: 14, outline: 'none' };
const LABEL = { color: LEAF, fontSize: 11, letterSpacing: 1, marginBottom: 6, display: 'block', opacity: 0.7 };
const CARD = { border: '1px solid rgba(171,212,158,0.3)', padding: 16 };

export default function CheckoutDetails() {
  const router = useRouter();
  const { eventId } = router.query;
  const { username, email } = useSelector(state => state.registerSlice);
  // The server decides whether this buyer is signed in; redux only knows this device.
  // `checking` must not read as "signed out", or a signed-in buyer sees a sign-in prompt flash.
  const { signedIn, checking } = useSignedIn();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selections, setSelections] = useState(null);   // null until the draft is read
  const [loaded, setLoaded] = useState(false);          // the event (and its tiers) are in
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});

  useHideBottomNav(true);

  useEffect(() => {
    if (!eventId) return;

    const draft = readDraft(eventId);
    let picked = draft.selections || {};
    if (!Object.keys(picked).length && router.query.selections) {
      try { picked = JSON.parse(decodeURIComponent(String(router.query.selections))) || {}; } catch { /* malformed link */ }
    }
    setSelections(picked);

    // Prefill from the account, never overwriting something the buyer already typed.
    setForm(prev => ({
      name: prev.name || draft.buyer?.name || username || '',
      email: prev.email || draft.buyer?.email || email || '',
      phone: prev.phone || draft.buyer?.phone || '',
    }));

    fetch('/api/events/' + eventId)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { setEvent(data); setTickets(data.tickets || []); setLoaded(true); })
      .catch(() => { setEvent({}); setLoaded(true); });
  }, [eventId, router.query.selections, username, email]);

  const lines = buildLines(tickets, selections || {});
  const total = totalOf(lines);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const free = isFree(lines);
  const hasSelection = Object.keys(selections || {}).length > 0;
  const loading = selections === null || !loaded;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter the name the tickets are held under';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const continueToPayment = () => {
    if (!signedIn || !validate()) return;
    saveDraft(eventId, {
      selections,
      buyer: form,
      eventTitle: event?.title || '',
      eventLocation: event?.location || '',
      eventDate: event?.date || null,
    });
    router.push(`/events/${eventId}/payment`);
  };

  // Never show a total before the order is actually known: a stray "₦0" flash reads as free.
  if (loading) {
    return (
      <>
        <Head><title>Your Details — Lucid Jungles</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF }}>
          <CheckoutSteps step={2} title="Your Details" onBack={() => router.back()} />
          <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, fontSize: 14 }}>Loading your order…</div>
        </div>
      </>
    );
  }

  if (!hasSelection) {
    return (
      <>
        <Head><title>Checkout — Lucid Jungles</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF }}>
          <CheckoutSteps step={2} title="Checkout" onBack={() => router.back()} />
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
            <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 20 }}>No tickets selected for this order.</div>
            <button onClick={() => router.push(`/events/${eventId}/tickets`)}
              style={{ height: 46, padding: '0 24px', backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
              CHOOSE TICKETS
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Your Details — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, paddingBottom: 170 }}>
        <CheckoutSteps step={2} title="Your Details" subtitle={event?.title} onBack={() => router.back()} />

        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Order summary — reviewable before any money moves */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>ORDER SUMMARY</span>
              <button onClick={() => router.push(`/events/${eventId}/tickets`)}
                style={{ background: 'none', border: 'none', color: LEAF, fontSize: 11, letterSpacing: 1, cursor: 'pointer', opacity: 0.8, padding: 0 }}>
                EDIT
              </button>
            </div>
            {event?.title && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{event.title}</div>}
            {lines.map(line => (
              <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>{line.name} × {line.qty}</span>
                <span>{line.subtotal === 0 ? 'Free' : money(line.subtotal)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(171,212,158,0.3)', paddingTop: 10, marginTop: 10, fontWeight: 700 }}>
              <span>TOTAL</span>
              <span>{free ? 'FREE' : money(total)}</span>
            </div>
          </div>

          {/* Sign-in gate — tickets are issued to an account, so say so before the last step */}
          {!signedIn && !checking && (
            <div style={{ ...CARD, borderStyle: 'dashed' }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>
                Tickets are issued to your Lucid Jungles account. Sign in to continue — you come
                straight back to this order.
              </div>
              <button onClick={() => router.push(signinHref(`/events/${eventId}/checkout`))}
                style={{ marginTop: 12, width: '100%', height: 42, backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer' }}>
                SIGN IN TO CONTINUE
              </button>
            </div>
          )}

          {/* Buyer details */}
          <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>TICKET HOLDER</div>
          <div>
            <label style={LABEL}>FULL NAME</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} style={FIELD} placeholder="Name on the tickets" />
            {errors.name && <div style={{ color: '#ff8b8b', fontSize: 11, marginTop: 6 }}>{errors.name}</div>}
          </div>
          <div>
            <label style={LABEL}>EMAIL</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} style={FIELD} placeholder="you@example.com" />
            {errors.email && <div style={{ color: '#ff8b8b', fontSize: 11, marginTop: 6 }}>{errors.email}</div>}
          </div>
          <div>
            <label style={LABEL}>PHONE (OPTIONAL)</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={FIELD} placeholder="+234…" />
          </div>
          {/* How payment happens — stated plainly, because the next screen is the payment itself */}
          <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, marginTop: 4 }}>PAYMENT METHOD</div>
          {free ? (
            <div style={{ ...CARD, backgroundColor: 'rgba(171,212,158,0.05)' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>NO PAYMENT REQUIRED</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                This order totals {money(0)}. Free tickets are confirmed as soon as you confirm the order.
              </div>
            </div>
          ) : (
            <>
              <div style={{ ...CARD, backgroundColor: 'rgba(171,212,158,0.05)' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>CARD</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                  You enter card details on the next screen. Flutterwave test mode is in use, so
                  cards here are test cards and no real money moves.
                </div>
              </div>
              <div style={{ ...CARD, opacity: 0.4 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>BANK TRANSFER</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Not available yet</div>
              </div>
            </>
          )}
        </div>

        {/* Next step — same always-visible bar as step 1 */}
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
            backgroundColor: INK, borderTop: `1px solid ${LEAF}`,
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, opacity: 0.8 }}>
            <span>{count} ticket{count !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 700 }}>{free ? 'FREE' : money(total)}</span>
          </div>
          <button
            onClick={continueToPayment}
            disabled={!signedIn}
            style={{
              width: '100%', height: 46, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1,
              backgroundColor: signedIn ? LEAF : 'rgba(171,212,158,0.2)',
              color: signedIn ? INK : LEAF,
              cursor: signedIn ? 'pointer' : 'not-allowed',
            }}
          >
            {checking
              ? 'CHECKING SESSION…'
              : !signedIn
                ? 'SIGN IN TO CONTINUE'
                : free ? 'CONTINUE — CONFIRM TICKETS' : `CONTINUE TO PAYMENT — ${money(total)}`}
          </button>
        </div>
      </div>
    </>
  );
}
