// pages/favourites.js — SAVED ITEMS (API: /api/store/fetch_favourites, /add_to_favourites,
// /:productId/favourites)
//
// The two favourites endpoints were reachable but had no screen anywhere in the client, so a
// shopper could not see, let alone use, what they had saved. This is that screen.
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpButton } from '../components/MvpShell';

const ITEM_TYPE_LABELS = {
  physical: 'PHYSICAL',
  virtual: 'DIGITAL',
  hybrid: 'BUNDLE',
};

export default function FavouritesPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/store/fetch_favourites', { credentials: 'include' });
      const data = await res.json();
      if (!data.status) throw new Error(data.message || 'Could not load your saved items');
      // data is null for a shopper who has never saved anything: an empty list, not an error.
      setItems((data.data?.products || []).map((f) => f.product).filter(Boolean));
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
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/${productId}/favourites`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not remove that item');
      setItems((list) => list.filter((p) => p._id !== productId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addToCart(product) {
    setBusy(true);
    setError(null);
    setAdded(null);
    try {
      const res = await fetch('/api/store/add_to_cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not add to cart');
      setAdded(product._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MvpShell title="SAVED ITEMS" subtitle="THE STORE">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

          {items.length === 0 ? (
            <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>
              Nothing saved yet. Tap the ♡ on a product in the{' '}
              <Link href="/store" style={{ color: '#ABD49E' }}>store</Link> to keep it here.
            </div>
          ) : (
            items.map((p) => (
              <div key={p._id} style={mvpCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <Link href={`/store/${p._id}`} style={{ color: '#ABD49E', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                    {p.name || 'Untitled'}
                  </Link>
                  <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                    {p.currency} {p.price != null ? p.price : '—'}
                  </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 10 }}>
                  {p.instock ? 'IN STOCK' : 'OUT OF STOCK'}
                  {p.item_type ? ` · ${ITEM_TYPE_LABELS[p.item_type] || p.item_type.toUpperCase()}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={busy || !p.instock}
                    style={{ ...mvpButton(busy || !p.instock), padding: '6px 12px' }}
                  >
                    {added === p._id ? 'ADDED ✓' : 'ADD TO CART'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p._id)}
                    disabled={busy}
                    style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E', padding: '6px 10px' }}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            ))
          )}

          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Link href="/store" style={{ color: '#ABD49E', fontSize: 12 }}>BACK TO STORE →</Link>
            <Link href="/cart" style={{ color: '#ABD49E', fontSize: 12 }}>YOUR CART →</Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}