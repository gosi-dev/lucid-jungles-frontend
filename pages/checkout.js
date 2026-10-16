// pages/checkout.js — CHECKOUT (API: /api/store/checkout, /validate_payment, shipping address)
//
// PLACE ORDER posted to a handler that never answered (see the controller: the shipping quote
// threw and there was no catch), so no order was ever created. It now creates the order and
// shows the number and the total, and only then asks for the card. Whether the payment
// happened is decided by the server talking to Flutterwave — never by this page.
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';

const EMPTY_ADDRESS = {
  recipient_name: '', shipping_address: '', state: '', city: '',
  postal_code: '', country: '', country_code: '', full_address: '',
};

// Flutterwave's inline checkout is one <script> exposing one function. There is no npm client
// for it in this app's dependency list, so it is loaded on demand — when the shopper reaches
// the payment step, not on page load.
function loadFlutterwaveCheckout() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Payments need a browser'));
  if (window.FlutterwaveCheckout) return Promise.resolve(window.FlutterwaveCheckout);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('flutterwave-v3');
    const script = existing || document.createElement('script');
    script.id = 'flutterwave-v3';
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => (
      window.FlutterwaveCheckout
        ? resolve(window.FlutterwaveCheckout)
        : reject(new Error('The payment library loaded but exposed nothing'))
    );
    script.onerror = () => reject(new Error('Could not reach the payment provider'));
    if (!existing) document.head.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [addresses, setAddresses] = useState([]);
  const [cart, setCart] = useState(null);
  const [addressId, setAddressId] = useState('');
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // The order the server created, with everything needed to pay it. Null until PLACE ORDER,
  // which is what stops a second order being created by a second tap.
  const [order, setOrder] = useState(null);
  // The order as the server left it after confirming the payment.
  const [paid, setPaid] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [addrRes, cartRes] = await Promise.all([
        fetch('/api/store/fetch_shipping_address', { credentials: 'include' }),
        fetch('/api/store/fetch_user_cart', { credentials: 'include' }),
      ]);
      const addrData = await addrRes.json();
      const cartData = await cartRes.json();
      if (addrData.status) {
        setAddresses(addrData.data || []);
        if ((addrData.data || []).length > 0) setAddressId(addrData.data[0]._id);
      }
      if (cartData.status) setCart(cartData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    load();
  }, [isLoggedIn, load, router]);

  async function createAddress() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/store/create_shipping_address', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not save address');
      setForm(EMPTY_ADDRESS);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      const items = cart?.products || [];
      const storeId = items[0]?.product?.store;
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_id: addressId, store_id: storeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.status) throw new Error(data.message || 'Checkout failed');
      // The order exists in the database from here on, and PLACE ORDER is replaced by the
      // payment step, so a second tap cannot create a second order.
      setOrder(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // The card form belongs to Flutterwave; what comes back is a transaction id. Whether that
  // transaction was actually paid is the server's question, not this callback's.
  async function confirmPayment(response) {
    const transactionId = response?.transaction_id || response?.id;
    if (!transactionId) {
      setError('The payment provider did not return a transaction id.');
      setBusy(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/store/validate_payment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId, tx_ref: order.tx_ref }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.status) throw new Error(data.message || 'The payment could not be confirmed');
      setPaid(data.data || { order_id: order.order_id });
      await load(); // the server empties the cart once the money is confirmed; show that
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function payWithCard() {
    if (!order) return;
    setError(null);
    setBusy(true);
    try {
      const FlutterwaveCheckout = await loadFlutterwaveCheckout();
      FlutterwaveCheckout({
        public_key: order.public_key,
        tx_ref: order.tx_ref,
        amount: order.amount,
        currency: order.currency,
        payment_options: 'card',
        customer: order.customer,
        meta: { order_id: order.order_id },
        customizations: { title: 'Lucid Jungles', description: `Order ${order.order_id}` },
        callback: confirmPayment,
        onclose: () => setBusy(false), // closed without paying: the order just waits
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const items = cart?.products || [];
  const subtotal = items.reduce((s, it) => s + (it.product?.price || 0) * (it.quantity || 0), 0);
  const currency = items[0]?.product?.currency || '';

  return (
    <MvpShell title="CHECKOUT" subtitle="COMPLETE YOUR ORDER">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

          {paid ? (
            <div style={{ ...mvpCard, color: '#ABD49E' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                PAYMENT CONFIRMED — ORDER {paid.order_id}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
                {typeof paid.amount === 'number' ? `${paid.amount} ${currency} paid. ` : ''}
                The order is now In Progress.
              </div>
              <Link href="/orders" style={{ color: '#ABD49E', fontSize: 12 }}>SEE YOUR ORDERS →</Link>
            </div>
          ) : order ? (
            <>
              <div style={mvpCard}>
                <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>
                  ORDER PLACED — AWAITING PAYMENT
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>#{order.order_id}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                  <span>ITEMS</span>
                  <span>{order.productTotal} {order.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}>
                  <span>SHIPPING</span>
                  <span>{order.shipping_fee} {order.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, margin: '10px 0' }}>
                  <span>TOTAL</span>
                  <span>{order.amount} {order.currency}</span>
                </div>
                {order.shipping_quoted === false ? (
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>
                    The shipping quote service could not be reached, so no shipping fee was
                    charged on this order.
                  </div>
                ) : null}
                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 14 }}>REF {order.tx_ref}</div>
                <button type="button" onClick={payWithCard} disabled={busy} style={mvpButton(busy)}>
                  {busy ? 'WAITING FOR THE PROVIDER…' : `PAY ${order.amount} ${order.currency} BY CARD`}
                </button>
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 16 }}>
                The order is already saved and stays Pending until the payment is confirmed — it
                is in <Link href="/orders" style={{ color: '#ABD49E' }}>your orders</Link> either
                way, so closing this dialog loses nothing.
              </div>
            </>
          ) : (
            <>
          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>SHIPPING ADDRESS</div>
            {addresses.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.7 }}>No saved address. Add one below.</div>
            ) : (
              addresses.map((a) => (
                <label key={a._id} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === a._id}
                    onChange={() => setAddressId(a._id)}
                  />
                  <span>
                    {a.recipient_name} — {a.full_address || a.shipping_address}, {a.city} {a.country}
                  </span>
                </label>
              ))
            )}
          </div>

          <div style={mvpCard}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>NEW ADDRESS</div>
            {['recipient_name', 'shipping_address', 'state', 'city', 'postal_code', 'country', 'country_code', 'full_address'].map((f) => (
              <input
                key={f}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                placeholder={f.replace(/_/g, ' ')}
                style={mvpInput}
              />
            ))}
            <button type="button" onClick={createAddress} disabled={busy} style={mvpButton(busy)}>
              SAVE ADDRESS
            </button>
          </div>

          <div style={{ ...mvpCard, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
            <span>SUBTOTAL</span>
            <span>{currency} {subtotal}</span>
          </div>

          {items.length === 0 ? (
            <div style={{ ...mvpCard, fontSize: 12, opacity: 0.7 }}>
              Your cart is empty — there is nothing to order.{' '}
              <Link href="/store" style={{ color: '#ABD49E' }}>Browse the store →</Link>
            </div>
          ) : null}

          {/* Disabled without an address and without a basket: the server refuses both, and a
              button that cannot work should not look like it can. */}
          <button
            type="button"
            onClick={placeOrder}
            disabled={busy || !addressId || items.length === 0}
            style={mvpButton(busy || !addressId || items.length === 0)}
          >
            {busy ? 'PLACING…' : 'PLACE ORDER'}
          </button>
          <div style={{ marginTop: 12 }}>
            <Link href="/cart" style={{ color: '#ABD49E', fontSize: 12 }}>← BACK TO CART</Link>
          </div>
            </>
          )}
        </>
      )}
    </MvpShell>
  );
}
