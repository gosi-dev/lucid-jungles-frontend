// pages/orders.js — ORDERS (API: /api/store/orders)
//
// An order used to be an id, a status and a count. The endpoint already returns the products
// the order was placed for, so the list now says what was actually bought, and a Pending order
// says out loud that it is waiting for payment.
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard } from '../components/MvpShell';

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/store/orders', { credentials: 'include' });
      const data = await res.json();
      if (data.status) setOrders(data.data || []);
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

  return (
    <MvpShell title="ORDERS" subtitle="YOUR PURCHASES">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading orders...</div>
      ) : error ? (
        <div style={{ color: '#E9040C' }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>
          No orders yet. <Link href="/store" style={{ color: '#ABD49E' }}>Browse the store →</Link>
        </div>
      ) : (
        orders.map((o) => {
          const lines = o.products || [];
          const status = (o.status || 'Pending').toString();
          const pending = status.toLowerCase() === 'pending';
          return (
            <div key={o._id || o.order_id} style={mvpCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>#{o.order_id || o._id}</span>
                <span style={{ fontSize: 12 }}>{status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>
                {o.order_date ? new Date(o.order_date).toLocaleString() : ''}
              </div>
              {lines.map((line, idx) => (
                <div
                  key={line.product?._id || idx}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, opacity: 0.85, marginBottom: 4 }}
                >
                  <span>{line.quantity} × {line.product?.name || 'Item'}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {line.product?.currency} {line.product?.price != null ? line.product.price : '—'}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 10 }}>
                <span>TOTAL</span>
                <span>{o.total_amount != null ? o.total_amount : '—'}</span>
              </div>
              {o.shipping_fee ? (
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4 }}>
                  INCLUDES {o.shipping_fee} SHIPPING
                </div>
              ) : null}
              {pending ? (
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
                  Waiting for payment — this order is not being prepared yet.
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </MvpShell>
  );
}
