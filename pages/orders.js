// pages/orders.js — ORDERS (API: /api/store/orders)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
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
        <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>No orders yet.</div>
      ) : (
        orders.map((o) => (
          <div key={o._id || o.order_id} style={mvpCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>#{o.order_id || o._id}</span>
              <span style={{ fontSize: 12 }}>{(o.status || 'pending').toString().toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
              {o.order_date ? new Date(o.order_date).toLocaleString() : ''}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
              {(o.products || []).length} item(s)
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              TOTAL {o.total_amount != null ? o.total_amount : '—'}
            </div>
          </div>
        ))
      )}
    </MvpShell>
  );
}
