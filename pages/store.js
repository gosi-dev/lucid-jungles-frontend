// pages/store.js — THE STORE (API: /api/store/public/products, /add_to_cart, /fetch_user_cart,
// /fetch_favourites, /add_to_favourites, /:productId/favourites)
//
// The catalogue is public; the cart is not. This page used to hold the cart in useState, so
// ADD TO CART never reached the server and the drawer's only exit was an alert() reading
// "Checkout coming soon" — while /api/store/checkout and the /cart, /checkout and /orders
// pages were already built against the real thing. It adds to the same cart those pages
// read, and hands off to them instead of duplicating them.
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MvpShell, { mvpButton, MVP_LINE } from '../components/MvpShell';
import FavouriteButton from '../components/FavouriteButton';
import { soldOut } from '../lib/stock';

const ITEM_TYPE_LABELS = {
  physical: 'PHYSICAL',
  virtual: 'DIGITAL',
  hybrid: 'BUNDLE',
};

// None of the three products in the store has an `images` array, so the media band is a
// typographic tile made from the product's own name — the real fix is artwork, which is data.
// The bare ◈ that stood here told a shopper nothing about the card.
function initials(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function ProductCard({ product, onAddToCart, saved, onToggleSaved }) {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  // `instock` alone is not the answer: a product can carry the flag and have nothing left (see
  // lib/stock.js). The button says so instead of letting the server refuse after the click.
  const gone = soldOut(product);

  async function handleCart() {
    if (gone) return;
    setBusy(true);
    const ok = await onAddToCart(product);
    setBusy(false);
    // false means the add was refused — signed out (the caller has already sent you to
    // sign in) or the server said no. Either way it must not claim ADDED.
    if (ok !== true) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const img = product.images?.[0];
  const href = `/store/${product._id}`;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(171,212,158,0.1)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* The whole card opens the product. Only the <h3> used to be a link, so tapping the
          picture — the part a shopper actually taps — did nothing at all. */}
      <Link href={href} style={{ display: 'block', flex: 1, color: '#ABD49E', textDecoration: 'none' }}>
        {img ? (
          <div style={{
            width: '100%', paddingTop: '75%',
            background: `url(${img}) center/cover no-repeat`,
            filter: 'brightness(0.75)',
          }} />
        ) : (
          <div style={{
            width: '100%', paddingTop: '62%', position: 'relative',
            background: 'rgba(171,212,158,0.04)',
            borderBottom: '1px solid rgba(171,212,158,0.1)',
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(171,212,158,0.35)' }}>
                {initials(product.name)}
              </span>
              {product.item_type ? (
                <span style={{ fontSize: 8, letterSpacing: '0.16em', color: 'rgba(171,212,158,0.3)' }}>
                  {ITEM_TYPE_LABELS[product.item_type] || product.item_type.toUpperCase()}
                </span>
              ) : null}
            </div>
          </div>
        )}
        <div style={{ padding: 16, paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', margin: '0 8px 0 0', flex: 1 }}>{product.name}</h3>
            {product.item_type && (
              <span style={{ fontSize: 8, letterSpacing: '0.14em', color: 'rgba(171,212,158,0.5)', border: '1px solid rgba(171,212,158,0.2)', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                {ITEM_TYPE_LABELS[product.item_type] || product.item_type.toUpperCase()}
              </span>
            )}
          </div>
          {product.description && (
            <p style={{ fontSize: 12, color: 'rgba(171,212,158,0.6)', lineHeight: 1.6, margin: '0 0 12px' }}>
              {product.description.slice(0, 90)}{product.description.length > 90 ? '…' : ''}
            </p>
          )}
        </div>
      </Link>

      {/* Overlaps the media band but is not inside the link: a button inside an anchor is
          neither valid HTML nor clickable without fighting the navigation. */}
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <FavouriteButton productId={product._id} saved={saved} onChange={onToggleSaved} />
      </div>

      <div style={{ padding: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>
          {product.currency} {product.price}
        </span>
        <button
          type="button"
          onClick={handleCart}
          disabled={busy || gone}
          style={{
            background: added ? 'rgba(171,212,158,0.15)' : 'transparent',
            border: '1px solid rgba(171,212,158,0.4)',
            color: '#ABD49E',
            fontSize: 9,
            letterSpacing: '0.14em',
            padding: '6px 14px',
            cursor: busy ? 'wait' : gone ? 'not-allowed' : 'pointer',
            opacity: gone ? 0.4 : 1,
            transition: 'background 0.2s',
          }}
        >
          {gone ? 'SOLD OUT' : added ? 'ADDED ✓' : busy ? 'ADDING…' : 'ADD TO CART'}
        </button>
      </div>
    </div>
  );
}

export default function StorePage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/store/public/products')
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setProducts(d.data || []);
        else setError(d.message || 'Could not load the store.');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // The header counts the server's cart, not a local one. /cart and /checkout read the
  // same record, so the number here and the list there cannot drift apart.
  const loadCart = useCallback(async () => {
    if (!isLoggedIn) { setCartCount(0); return; }
    try {
      const res = await fetch('/api/store/fetch_user_cart', { credentials: 'include' });
      const data = await res.json();
      if (data.status) {
        const items = data.data?.products || [];
        setCartCount(items.reduce((n, it) => n + (it.quantity || 0), 0));
      }
    } catch (err) {
      // Decoration on this page; /cart reports its own errors properly.
    }
  }, [isLoggedIn]);

  useEffect(() => { loadCart(); }, [loadCart]);

  // Which products are already saved, so the hearts show the server's answer rather than
  // guessing. /favourites reads the same record.
  const [favouriteIds, setFavouriteIds] = useState([]);
  const loadFavourites = useCallback(async () => {
    if (!isLoggedIn) { setFavouriteIds([]); return; }
    try {
      const res = await fetch('/api/store/fetch_favourites', { credentials: 'include' });
      const data = await res.json();
      if (data.status) {
        const items = data.data?.products || [];
        setFavouriteIds(items.map((f) => f.product?._id).filter(Boolean));
      }
    } catch (err) {
      // Decoration on this page; /favourites reports its own errors properly.
    }
  }, [isLoggedIn]);

  useEffect(() => { loadFavourites(); }, [loadFavourites]);

  function toggleSaved(productId, isSaved) {
    setFavouriteIds((ids) => (
      isSaved ? [...new Set([...ids, productId])] : ids.filter((id) => id !== productId)
    ));
  }

  async function addToCart(product) {
    if (!isLoggedIn) { router.push('/signin'); return false; }
    setError(null);
    try {
      const res = await fetch('/api/store/add_to_cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not add to cart');
      await loadCart();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  const filtered = filter === 'all' ? products : products.filter((p) => p.item_type === filter);

  const filterBtn = (active) => ({
    background: active ? 'rgba(171,212,158,0.1)' : 'transparent',
    border: `1px solid ${MVP_LINE}`,
    color: '#ABD49E',
    fontSize: 9, letterSpacing: '0.14em',
    padding: '5px 14px', cursor: 'pointer',
  });

  return (
    <MvpShell
      title="THE STORE"
      subtitle="GEAR, DROPS, AND JUNGLE ESSENTIALS"
      actions={
        <Link
          href="/cart"
          style={{ ...mvpButton(false), padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          CART{cartCount > 0 ? ` (${cartCount})` : ''}
        </Link>
      }
    >
      {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {['all', 'physical', 'virtual', 'hybrid'].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={filterBtn(filter === f)}>
            {f === 'all' ? 'ALL' : ITEM_TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading the store…</div>
      ) : filtered.length === 0 ? (
        <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>
          {products.length === 0 ? 'Nothing in the store yet. Check back soon.' : 'Nothing under that filter.'}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {filtered.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            onAddToCart={addToCart}
            saved={favouriteIds.includes(p._id)}
            onToggleSaved={(isSaved) => toggleSaved(p._id, isSaved)}
          />
        ))}
      </div>


      <div style={{ display: 'flex', gap: 20, marginTop: 28 }}>
        <Link href="/cart" style={{ color: '#ABD49E', fontSize: 12 }}>YOUR CART →</Link>
        {isLoggedIn ? (
          <Link href="/favourites" style={{ color: '#ABD49E', fontSize: 12 }}>SAVED ITEMS →</Link>
        ) : null}
        {isLoggedIn ? (
          <Link href="/orders" style={{ color: '#ABD49E', fontSize: 12 }}>YOUR ORDERS →</Link>
        ) : null}
      </div>
    </MvpShell>
  );
}

