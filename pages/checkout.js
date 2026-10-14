// pages/checkout.js — CHECKOUT (API: /api/store/checkout + shipping address)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';

const EMPTY_ADDRESS = {
  recipient_name: '', shipping_address: '', state: '', city: '',
  postal_code: '', country: '', country_code: '', full_address: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [addresses, setAddresses] = useState([]);
  const [cart, setCart] = useState(null);
  const [addressId, setAddressId] = useState('');
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
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
    setResult(null);
    try {
      const items = cart?.products || [];
      const storeId = items[0]?.product?.store;
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_id: addressId, store_id: storeId }),
      });
      const data = await res.json();
      setResult(data);
      if (!res.ok) throw new Error(data.message || 'Checkout failed');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const items = cart?.products || [];
  const subtotal = items.reduce((s, it) => s + (it.product?.price || 0) * (it.quantity || 0), 0);

  return (
    <MvpShell title="CHECKOUT" subtitle="COMPLETE YOUR ORDER">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}
          {result ? (
            <div style={{ ...mvpCard, color: result.status ? '#ABD49E' : '#E9040C' }}>
              {result.message || 'Order response received.'}
            </div>
          ) : null}

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
            <span>{subtotal}</span>
          </div>

          <button type="button" onClick={placeOrder} disabled={busy || !addressId} style={mvpButton(busy || !addressId)}>
            PLACE ORDER
          </button>
          <div style={{ marginTop: 12 }}>
            <Link href="/cart" style={{ color: '#ABD49E', fontSize: 12 }}>← BACK TO CART</Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}
