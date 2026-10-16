// pages/store/[productId].js — STORE PRODUCT (API: /api/store/product/:productId)
//
// The grid card links here, so this page answers what a card cannot: what the thing is,
// whether it is in stock, what it costs, and how to buy or save it.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpButton, MVP_LINE } from '../../components/MvpShell';
import FavouriteButton from '../../components/FavouriteButton';
import { soldOut, stockLeft } from '../../lib/stock';

const ITEM_TYPE_LABELS = {
  physical: 'PHYSICAL',
  virtual: 'DIGITAL',
  hybrid: 'BUNDLE',
};

// No product in the store has an `images` array yet, so the media band falls back to the
// product's own initials — the same tile the grid card uses. Real artwork is data.
function initials(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function ProductPage() {
  const router = useRouter();
  const { productId } = router.query;
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/store/product/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        // A deleted (or mistyped) id answers status:true with data:null, which used to render
        // an "Untitled" product at price "—" instead of admitting the product is gone.
        if (data.status && data.data) setProduct(data.data);
        else setError(data.message || 'That product is no longer in the store.');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  // Whether this product is already saved is a server fact, not a page-level guess.
  useEffect(() => {
    if (!isLoggedIn || !productId) { setSaved(false); return; }
    fetch('/api/store/fetch_favourites', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.status) {
          const items = data.data?.products || [];
          setSaved(items.some((f) => f.product?._id === productId));
        }
      })
      .catch(() => {
        // Decoration: the heart starts empty and the first tap tells the truth.
      });
  }, [isLoggedIn, productId]);

  async function addToCart() {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/store/add_to_cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      // The server's 500s carry the raw error object, so only a string message is shown.
      const reason = typeof data.message === 'string' && data.message ? data.message : 'Could not add to cart';
      if (!res.ok || !data.status) throw new Error(reason);
      setMessage('Added to cart.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const img = product?.images?.[0];
  // The flag and the shelf, in the same words the server uses (lib/stock.js).
  const left = stockLeft(product);
  const gone = soldOut(product);

  return (
    <MvpShell title="PRODUCT" subtitle="THE STORE">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : !product ? (
        <>
          <div style={{ ...mvpCard, color: '#E9040C' }}>{error || 'Product not found.'}</div>
          <Link href="/store" style={{ color: '#ABD49E', fontSize: 12 }}>← BACK TO STORE</Link>
        </>
      ) : (
        <>
          <div style={{ ...mvpCard, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {img ? (
              <div style={{
                width: 120, height: 120, flexShrink: 0,
                background: `url(${img}) center/cover no-repeat`,
              }} />
            ) : (
              <div style={{
                width: 120, height: 120, flexShrink: 0,
                background: 'rgba(171,212,158,0.04)',
                border: `1px solid ${MVP_LINE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 700, letterSpacing: '0.18em',
                color: 'rgba(171,212,158,0.35)',
              }}>
                {initials(product.name)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                {product.name || 'Untitled'}
              </div>
              <div style={{ fontSize: 16, marginBottom: 12 }}>
                {product.price != null ? `${product.currency || ''} ${product.price}`.trim() : '—'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {gone ? 'OUT OF STOCK' : 'IN STOCK'}
                {!gone && left > 0 && left <= 5 ? ` · ONLY ${left} LEFT` : ''}
                {product.item_type ? ` · ${ITEM_TYPE_LABELS[product.item_type] || product.item_type.toUpperCase()}` : ''}
              </div>
            </div>
          </div>

          <div style={mvpCard}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 14 }}>
              {product.description || 'No description.'}
            </div>

            {message ? <div style={{ color: '#ABD49E', marginBottom: 10 }}>{message}</div> : null}
            {error ? <div style={{ color: '#E9040C', marginBottom: 10 }}>{error}</div> : null}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                onClick={addToCart}
                disabled={busy || gone}
                style={mvpButton(busy || gone)}
              >
                {gone ? 'SOLD OUT' : busy ? 'ADDING…' : 'ADD TO CART'}
              </button>
              <FavouriteButton productId={product._id} saved={saved} onChange={setSaved} />
              <span style={{ fontSize: 10, opacity: 0.5 }}>{saved ? 'SAVED' : 'SAVE THIS'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/cart" style={{ color: '#ABD49E', fontSize: 12 }}>GO TO CART →</Link>
            <Link href="/store" style={{ color: '#ABD49E', fontSize: 12 }}>BACK TO STORE →</Link>
          </div>
        </>
      )}
    </MvpShell>
  );
}
