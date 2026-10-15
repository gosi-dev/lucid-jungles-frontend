// pages/events/[eventId]/payment.js — STEP 3 of 3: pay
//
// The old checkout fired the purchase and handed straight to Flutterwave's iframe, so
// there was no payment step of our own and, with no provider reachable, no way to finish.
// This screen owns the payment: it creates the purchase (free orders confirm here), runs a
// simulated authorisation so the flow can be walked end to end, and keeps the real
// Flutterwave inline checkout as a secondary path for test-mode keys.
//
// A simulated payment is confirmed by POST /api/tickets/mock-confirm, which performs the
// same inventory + status transition a verified Flutterwave transaction does. Nothing here
// reports success the server has not recorded.
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import CheckoutSteps from '../../../components/CheckoutSteps';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';
import { useSignedIn } from '../../../hooks/useSignedIn';
import { readDraft, saveDraft, buildLines, totalOf, isFree, money, signinHref } from '../../../utils/orderDraft';

const INK = '#151413';
const LEAF = '#ABD49E';
const FIELD = { width: '100%', height: 42, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: LEAF, paddingLeft: 10, fontSize: 14, outline: 'none', letterSpacing: 1 };
const LABEL = { color: LEAF, fontSize: 11, letterSpacing: 1, marginBottom: 6, display: 'block', opacity: 0.7 };
const CARD = { border: '1px solid rgba(171,212,158,0.3)', padding: 16 };

// Flutterwave's inline SDK is fetched on demand, so no third-party script loads until a
// buyer actually commits to paying with it.
const FLW_SDK_URL = 'https://checkout.flutterwave.com/v3.js';
let flwLoader = null;
function loadFlutterwave() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No browser context'));
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (!flwLoader) {
    flwLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = FLW_SDK_URL;
      script.onload = () => resolve();
      script.onerror = () => { flwLoader = null; reject(new Error('Could not reach the payment provider')); };
      document.body.appendChild(script);
    });
  }
  return flwLoader;
}

// Simulated payments belong to development and design review. A production build offers
// only the real provider unless NEXT_PUBLIC_PAYMENTS_MODE=mock asks for the simulation.
const MOCK_ALLOWED = process.env.NEXT_PUBLIC_PAYMENTS_MODE
  ? process.env.NEXT_PUBLIC_PAYMENTS_MODE === 'mock'
  : process.env.NODE_ENV !== 'production';

const TEST_CARD = { number: '4242 4242 4242 4242', name: 'Test Dreamer', expiry: '12/34', cvv: '123' };
const onlyDigits = (value) => String(value || '').replace(/\D/g, '');
const groupCardNumber = (value) => onlyDigits(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (value) => {
  const d = onlyDigits(value).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Payment() {
  const router = useRouter();
  const { eventId } = router.query;
  // The server decides whether this buyer is signed in; redux only knows this device.
  const { status: sessionStatus } = useSignedIn();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [draft, setDraft] = useState(null);        // null until the draft is read
  const [stage, setStage] = useState("idle");       // idle | processing | authorising | error
  const [error, setError] = useState(null);
  const [needsSignin, setNeedsSignin] = useState(false);
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [cardErrors, setCardErrors] = useState({});
  const [flwEnabled, setFlwEnabled] = useState(false);

  useHideBottomNav(true);

  useEffect(() => {
    if (!eventId) return;
    setDraft(readDraft(eventId));
    fetch("/api/events/" + eventId)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => { setEvent(data); setTickets(data.tickets || []); })
      .catch(() => setEvent({}));
    // The real inline checkout needs a provider key; without one only the simulation exists.
    setFlwEnabled(/^FLWPUBK/.test(process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || ""));
  }, [eventId]);

  const lines = buildLines(tickets, draft?.selections || {});
  const total = totalOf(lines);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const free = isFree(lines);
  const buyer = draft?.buyer || {};
  const hasOrder = !!draft && Object.keys(draft.selections || {}).length > 0;
  const busy = stage === 'processing' || stage === 'authorising';

  // The cart is spent once tickets are issued; the receipt is what the confirmation
  // screen reads, and it is the only copy of the order that survives a refresh.
  const finishReceipt = ({ reference, simulated }) => {
    saveDraft(eventId, {
      selections: null,
      receipt: {
        items: lines.map(l => ({ name: l.name, qty: l.qty, subtotal: l.subtotal })),
        total,
        currency: 'NGN',
        reference: reference || null,
        simulated: !!simulated,
        buyer,
        eventTitle: draft?.eventTitle || event?.title || '',
        eventLocation: draft?.eventLocation || event?.location || '',
        eventDate: draft?.eventDate || event?.date || null,
        createdAt: new Date().toISOString(),
      },
    });
    router.replace(`/events/${eventId}/payment-success` + (reference ? `?ref=${encodeURIComponent(reference)}` : ''));
  };

  // Create the purchase lines. A free order is confirmed by this call; a paid order comes
  // back `pending` with a tx_ref for the provider — or the simulation — to verify.
  const createPurchase = async () => {
    const res = await fetch('/api/tickets/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventId, selections: draft.selections, guestInfo: buyer }),
    });
    const data = await res.json().catch(() => ({}));
    // Unauthenticated requests come back as 500 {message:'Login required'} from the auth
    // middleware, so a status check alone would show a generic error instead of the gate.
    if (res.status === 401 || /login required/i.test(data.message || '')) {
      setNeedsSignin(true);
      setError('Sign in to finish this order.');
      setStage('error');
      return null;
    }
    if (!res.ok) {
      setError(data.error || data.message || 'Could not start this purchase.');
      setStage('error');
      return null;
    }
    return data;
  };

  const validateCard = () => {
    const next = {};
    if (onlyDigits(card.number).length !== 16) next.number = 'Enter the 16 digits on the card';
    if (!card.name.trim()) next.name = 'Enter the name on the card';
    const [mm, yy] = card.expiry.split('/');
    if (!/^\d{2}$/.test(mm || '') || !/^\d{2}$/.test(yy || '') || Number(mm) < 1 || Number(mm) > 12) {
      next.expiry = 'Use MM/YY';
    }
    if (!/^\d{3,4}$/.test(card.cvv)) next.cvv = 'The 3 digits on the back';
    setCardErrors(next);
    return Object.keys(next).length === 0;
  };

  const updateCard = (key, value) => {
    const formatted = key === 'number' ? groupCardNumber(value) : key === 'expiry' ? formatExpiry(value) : value;
    setCard(prev => ({ ...prev, [key]: formatted }));
    setCardErrors(prev => ({ ...prev, [key]: undefined }));
  };

  // Simulated card payment: same server-side outcome as a verified transaction.
  const paySimulated = async () => {
    if (busy) return;
    if (!free && !validateCard()) return;
    setError(null);
    setStage('processing');

    const data = await createPurchase();
    if (!data) return;
    // Free order: the purchase id is the ticket's identity, and the receipt should show one.
    if (data.confirmed) {
      finishReceipt({ reference: data.purchases?.[0]?._id, simulated: false });
      return;
    }

    if (!data.paymentRequired || !data.flw_payload) {
      setError('Unexpected response from the server. Please try again.');
      setStage('error');
      return;
    }

    setStage('authorising');
    await new Promise(resolve => setTimeout(resolve, 1400));               // the handshake, felt
    const res = await fetch('/api/tickets/mock-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tx_ref: data.flw_payload.tx_ref }),
    });
    const confirmation = await res.json().catch(() => ({}));

    if (!res.ok || !confirmation.confirmed) {
      setError(confirmation.error || 'The payment could not be confirmed, so no tickets were issued.');
      setStage('error');
      return;
    }
    finishReceipt({ reference: data.flw_payload.tx_ref, simulated: true });
  };

  // The real provider path, kept for test-mode keys: Flutterwave collects the card in its
  // own iframe and verification happens server-side on the way back.
  const payWithFlutterwave = async () => {
    if (busy) return;
    setError(null);
    setStage('processing');

    const data = await createPurchase();
    if (!data) return;
    if (data.confirmed) {
      finishReceipt({ reference: data.purchases?.[0]?._id, simulated: false });
      return;
    }

    const p = data.flw_payload;
    try {
      await loadFlutterwave();
      window.FlutterwaveCheckout({
        public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
        tx_ref: p.tx_ref,
        amount: p.amount,
        currency: p.currency,
        customer: {
          email: (p.customer && p.customer.email) || buyer.email,
          name: (p.customer && p.customer.name) || buyer.name,
          phone_number: buyer.phone,
        },
        customizations: p.customizations,
        callback: (response) => router.push(
          `/events/${eventId}/ticket-confirmed` +
          `?transaction_id=${encodeURIComponent(response.transaction_id)}&tx_ref=${encodeURIComponent(response.tx_ref)}`
        ),
        onclose: () => setStage('idle'),
      });
      setStage('idle');
    } catch (providerError) {
      setError(providerError.message || 'Could not reach the payment provider.');
      setStage('error');
    }
  };

  // The draft is read in an effect, so `null` means "not yet known" — never an empty order.
  if (draft === null) {
    return (
      <>
        <Head><title>Payment — Lucid Jungles</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF }}>
          <CheckoutSteps step={3} title="Payment" onBack={() => router.push(`/events/${eventId}/checkout`)} />
          <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, fontSize: 14 }}>Loading your order…</div>
        </div>
      </>
    );
  }

  // Nothing to pay for: the draft was cleared (a completed order) or step 1 was skipped.
  // Nobody can be charged without a session, so do not present a card form to nobody.
  if (sessionStatus === 'out') {
    return (
      <>
        <Head><title>Payment — Lucid Jungles</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF }}>
          <CheckoutSteps step={3} title="Payment" onBack={() => router.push(`/events/${eventId}/checkout`)} />
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ opacity: 0.75, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Sign in to pay for this order. Your tickets are issued to your account.
            </div>
            <button onClick={() => router.push(signinHref(`/events/${eventId}/payment`))}
              style={{ height: 46, padding: '0 24px', backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer' }}>
              SIGN IN AND RETURN
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!hasOrder) {
    return (
      <>
        <Head><title>Payment — Lucid Jungles</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF }}>
          <CheckoutSteps step={3} title="Payment" onBack={() => router.push(`/events/${eventId}/tickets`)} />
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 20 }}>There is no order in progress to pay for.</div>
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
      <Head><title>Payment — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: INK, color: LEAF, paddingBottom: 210 }}>
        <CheckoutSteps
          step={3}
          title="Payment"
          subtitle={draft?.eventTitle || event?.title}
          onBack={() => router.push(`/events/${eventId}/checkout`)}
        />

        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* What is being paid for */}
          <div style={CARD}>
            <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, marginBottom: 10 }}>ORDER TOTAL</div>
            {lines.map(line => (
              <div key={line.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span>{line.name} × {line.qty}</span>
                <span>{line.subtotal === 0 ? 'Free' : money(line.subtotal)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(171,212,158,0.3)', paddingTop: 10, marginTop: 10, fontSize: 18, fontWeight: 700 }}>
              <span>DUE</span>
              <span>{free ? 'FREE' : money(total)}</span>
            </div>
          </div>

          {free ? (
            <div style={{ ...CARD, backgroundColor: 'rgba(171,212,158,0.05)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>NO PAYMENT REQUIRED</div>
              <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                This order totals {money(0)}, so confirming it issues the ticket straight away.
              </div>
            </div>
          ) : (
            <>
              {MOCK_ALLOWED && (
                <div style={{ ...CARD, padding: 12, borderStyle: 'dashed' }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>SIMULATED PAYMENT</div>
                  <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                    No card is charged and no provider is contacted. Use 4242 4242 4242 4242, any
                    future expiry and any three digits — or tap FILL TEST CARD.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>CARD DETAILS</span>
                {MOCK_ALLOWED && (
                  <button onClick={() => { setCard(TEST_CARD); setCardErrors({}); }}
                    style={{ background: 'none', border: `1px solid ${LEAF}`, color: LEAF, fontSize: 10, letterSpacing: 1, padding: '4px 8px', cursor: 'pointer', opacity: 0.85 }}>
                    FILL TEST CARD
                  </button>
                )}
              </div>

              <div>
                <label style={LABEL}>CARD NUMBER</label>
                <input type="text" inputMode="numeric" autoComplete="cc-number" maxLength={19} value={card.number}
                  onChange={(e) => updateCard('number', e.target.value)} style={FIELD} placeholder="0000 0000 0000 0000" />
                {cardErrors.number && <div style={{ color: '#ff8b8b', fontSize: 11, marginTop: 6 }}>{cardErrors.number}</div>}
              </div>
              <div>
                <label style={LABEL}>NAME ON CARD</label>
                <input type="text" autoComplete="cc-name" value={card.name}
                  onChange={(e) => updateCard('name', e.target.value)} style={FIELD} placeholder="As printed on the card" />
                {cardErrors.name && <div style={{ color: '#ff8b8b', fontSize: 11, marginTop: 6 }}>{cardErrors.name}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={LABEL}>EXPIRY</label>
                  <input type="text" inputMode="numeric" autoComplete="cc-exp" maxLength={5} value={card.expiry}
                    onChange={(e) => updateCard('expiry', e.target.value)} style={FIELD} placeholder="MM/YY" />
                  {cardErrors.expiry && <div style={{ color: '#ff8b8b', fontSize: 11, marginTop: 6 }}>{cardErrors.expiry}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={LABEL}>CVV</label>
                  <input type="text" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvv}
                    onChange={(e) => updateCard('cvv', e.target.value)} style={FIELD} placeholder="123" />
                  {cardErrors.cvv && <div style={{ color: '#ff8b8b', fontSize: 11, marginTop: 6 }}>{cardErrors.cvv}</div>}
                </div>
              </div>
            </>
          )}
          {error && (
            <div style={{ border: '1px solid #ff8b8b', padding: 12 }}>
              <div style={{ color: '#ff8b8b', fontSize: 13, lineHeight: 1.5 }}>{error}</div>
              {needsSignin && (
                <button onClick={() => router.push(signinHref(`/events/${eventId}/payment`))}
                  style={{ marginTop: 12, width: '100%', height: 42, backgroundColor: LEAF, color: INK, border: 'none', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer' }}>
                  SIGN IN AND RETURN
                </button>
              )}
            </div>
          )}

          {!free && flwEnabled && (
            <div style={{ fontSize: 11, opacity: 0.55, lineHeight: 1.6 }}>
              Rather use the provider's own sheet? PAY WITH FLUTTERWAVE opens Flutterwave's test
              checkout; the transaction is then verified server-side before tickets are issued.
            </div>
          )}
        </div>

        {/* The commitment itself — always on screen, like the steps before it */}
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

          {free ? (
            <button onClick={paySimulated} disabled={busy}
              style={{ width: '100%', height: 46, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1, backgroundColor: LEAF, color: INK, cursor: busy ? 'not-allowed' : 'pointer' }}>
              CONFIRM FREE TICKETS
            </button>
          ) : (
            <>
              {MOCK_ALLOWED && (
                <button onClick={paySimulated} disabled={busy}
                  style={{ width: '100%', height: 46, border: 'none', fontWeight: 700, fontSize: 13, letterSpacing: 1, backgroundColor: LEAF, color: INK, cursor: busy ? 'not-allowed' : 'pointer' }}>
                  {busy ? 'PROCESSING…' : `PAY ${money(total)} — TEST`}
                </button>
              )}
              {flwEnabled && (
                <button onClick={payWithFlutterwave} disabled={busy}
                  style={{
                    width: '100%', height: 44, marginTop: MOCK_ALLOWED ? 8 : 0, backgroundColor: 'transparent',
                    border: `1px solid ${LEAF}`, color: LEAF, fontWeight: 700, fontSize: 12, letterSpacing: 1,
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}>
                  PAY WITH FLUTTERWAVE
                </button>
              )}
              {!MOCK_ALLOWED && !flwEnabled && (
                <div style={{ fontSize: 12, opacity: 0.7, textAlign: 'center' }}>
                  Card payments are unavailable in this build.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Blocking progress — a payment must not look idle while it is being confirmed */}
      {busy && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 20000, backgroundColor: 'rgba(21,20,19,0.94)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 18, padding: 32, textAlign: 'center',
          }}
        >
          <div className="animate-spin" style={{ width: 34, height: 34, border: `3px solid ${LEAF}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
          <div style={{ fontSize: 14, letterSpacing: 1 }}>
            {stage === 'authorising' ? 'AUTHORISING PAYMENT…' : 'CREATING YOUR ORDER…'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, maxWidth: 260, lineHeight: 1.5 }}>
            Keep this screen open while the payment is confirmed.
          </div>
        </div>
      )}
    </>
  );
}
