// pages/cart.js — CART (API: /api/store/fetch_user_cart, /api/store/:productId/remove_from_cart)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpButton } from '../components/MvpShell';

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/store/fetch_user_cart', { credentials: 'include' });
      const data = await res.json();
      if (data.status) setCart(data.data);
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

  async function remove(productId) {
    try {
      const res = await fetch(`/api/store/${productId}/remove_from_cart`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) load();
    } catch (err) {
      setError(err.message);
    }
  }

  const items = cart?.products || [];
  const subtotal = items.reduce(
    (sum, it) => sum + (it.product?.price || 0) * (it.quantity || 0),
    0
  );

  return (
    <MvpShell title="CART" subtitle="THE STORE">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading cart...</div>
      ) : error ? (
        <div style={{ color: '#E9040C' }}>{error}</div>
      ) : items.length === 0 ? (
        <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>
          Your cart is empty. <Link href="/store" style={{ color: '#ABD49E' }}>Browse the store →</Link>
        </div>
      ) : (
        <>
          {items.map((it, idx) => (
            <div key={`${it.product?._id || idx}`} style={mvpCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{it.product?.name || 'Item'}</span>
                <span style={{ fontSize: 13 }}>{it.product?.price != null ? it.product.price : '—'}</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>QTY {it.quantity}</div>
              <button
                type="button"
                onClick={() => remove(it.product?._id)}
                style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E', padding: '6px 10px' }}
              >
                REMOVE
              </button>
            </div>
          ))}

          <div style={{ ...mvpCard, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
            <span>SUBTOTAL</span>
            <span>{subtotal}</span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Link href="/checkout" style={mvpButton(false)}>CHECKOUT</Link>
            <Link href="/store" style={{ color: '#ABD49E', fontSize: 12, alignSelf: 'center' }}>KEEP SHOPPING →</Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}
