// pages/events/[eventId]/checkout.js — Checkout form
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useHideBottomNav } from '../../../hooks/useHideBottomNav';
import { useSelector } from 'react-redux';

// Flutterwave's inline SDK is fetched on demand, so no third-party script is
// loaded until a user actually commits to paying.
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

export default function Checkout() {
  const router = useRouter();
  const { eventId, selections: selectionsParam } = router.query;
  const { username } = useSelector(state => state.registerSlice);

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useHideBottomNav(true);

  useEffect(() => {
    if (selectionsParam) {
      try { setSelections(JSON.parse(decodeURIComponent(selectionsParam))); } catch {}
    }
  }, [selectionsParam]);

  useEffect(() => {
    if (!eventId) return;
    fetch('/api/events/' + eventId)
      .then(r => r.json())
      .then(data => { setEvent(data); setTickets(data.tickets || []); })
      .catch(() => {});
  }, [eventId]);

  const selectedItems = tickets.filter(t => {
    const key = t._id || t.id;
    return (selections[key] || 0) > 0;
  });

  const total = selectedItems.reduce((sum, t) => {
    const qty = selections[t._id || t.id] || 0;
    return sum + qty * (t.price || 0);
  }, 0);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { eventId, selections, guestInfo: form };
      const res = await fetch('/api/tickets/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || data.message || 'Purchase failed');
        return;
      }

      // Free tickets are already confirmed server-side.
      if (data.confirmed) {
        router.push('/events/' + eventId + '/ticket-confirmed');
        return;
      }

      // Paid tickets are deliberately left `pending` until Flutterwave verifies
      // the transaction, so hand off to the payment provider now.
      if (data.paymentRequired && data.flw_payload) {
        const p = data.flw_payload;
        await loadFlutterwave();
        window.FlutterwaveCheckout({
          public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
          tx_ref: p.tx_ref,
          amount: p.amount,
          currency: p.currency,
          customer: {
            email: (p.customer && p.customer.email) || form.email,
            name: (p.customer && p.customer.name) || form.name,
            phone_number: form.phone,
          },
          customizations: p.customizations,
          callback: (response) => {
            router.push(
              '/events/' + eventId + '/ticket-confirmed' +
              '?transaction_id=' + encodeURIComponent(response.transaction_id) +
              '&tx_ref=' + encodeURIComponent(response.tx_ref)
            );
          },
          onclose: () => {},
        });
        return;
      }

      alert('Unexpected response from checkout. Please try again.');
    } catch (err) {
      alert(err && err.message ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', height: 40, backgroundColor: 'transparent', border: '1px solid rgba(171,212,158,0.4)', color: '#ABD49E', paddingLeft: 10, fontSize: 14, outline: 'none' };
  const labelStyle = { color: '#ABD49E', fontSize: 12, letterSpacing: 1, marginBottom: 6, display: 'block' };

  return (
    <>
      <Head><title>Checkout — Lucid Jungles</title></Head>
      <div style={{ minHeight: '100vh', backgroundColor: '#151413', color: '#ABD49E', paddingBottom: 80 }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px', borderBottom: '1px solid #ABD49E', marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', color: '#ABD49E', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Checkout</span>
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Order summary */}
          <div style={{ border: '1px solid rgba(171,212,158,0.3)', padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 10, opacity: 0.6 }}>ORDER SUMMARY</div>
            {event && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{event.title}</div>}
            {selectedItems.map(t => {
              const qty = selections[t._id || t.id] || 0;
              return (
                <div key={t._id || t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{t.type || t.name} x{qty}</span>
                  <span>₦{(qty * (t.price || 0)).toLocaleString()}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(171,212,158,0.3)', paddingTop: 10, marginTop: 10, fontWeight: 700 }}>
              <span>TOTAL</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Guest info form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, opacity: 0.6, marginBottom: 4 }}>GUEST INFORMATION</div>
            <div>
              <label style={labelStyle}>FULL NAME</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} placeholder="Your name" required />
            </div>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} placeholder="Your email" required />
            </div>
            <div>
              <label style={labelStyle}>PHONE</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="Your phone number" />
            </div>

            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, opacity: 0.6, marginBottom: 10 }}>PAYMENT METHOD</div>
              <div style={{ border: '1px solid rgba(171,212,158,0.3)', padding: 12, marginBottom: 8, cursor: 'pointer', backgroundColor: 'rgba(171,212,158,0.05)' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>BANK TRANSFER</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Transfer to account and upload proof</div>
              </div>
              <div style={{ border: '1px solid rgba(171,212,158,0.1)', padding: 12, opacity: 0.4 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>CARD PAYMENT</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Coming soon</div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', height: 50, backgroundColor: '#ABD49E', color: '#151413', border: 'none', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: 1 }}>
              {loading ? 'PROCESSING...' : 'COMPLETE PURCHASE'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
