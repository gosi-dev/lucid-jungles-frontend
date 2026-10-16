// pages/cart.js — CART (API: /api/store/fetch_user_cart, PUT /edit_cart/:cartId,
// DELETE /:productId/remove_from_cart)
//
// The page could only remove a line, so a quantity was whatever had been accumulated by
// tapping ADD TO CART over and over in the store. PUT /edit_cart/:cartId already existed for
// exactly this and nothing called it.
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpButton } from '../components/MvpShell';
import { atStockLimit, stockLeft } from '../lib/stock';

// `blocked` separates "wait for the server" from "there is no more of this" — the two look the
// same to a shopper otherwise, and one of them never becomes clickable.
const stepBtn = (disabled, blocked = false) => ({
  background: 'transparent',
  border: '1px solid rgba(171,212,158,0.4)',
  color: '#ABD49E',
  width: 26,
  height: 26,
  lineHeight: '22px',
  fontSize: 14,
  padding: 0,
  cursor: blocked ? 'not-allowed' : disabled ? 'wait' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/${productId}/remove_from_cart`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not remove that item');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // The quantity is written to the server and the cart is read back, so the subtotal below is
  // always the server's arithmetic rather than a local guess that can drift from the order.
  async function setQuantity(productId, quantity) {
    // Stepping below one is a removal, not a cart line containing a zero — edit_cart refuses a
    // zero quantity precisely because the line would silently keep its old value.
    if (quantity < 1) return remove(productId);
    if (!cart?._id) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/edit_cart/${cart._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ productId, quantity }] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update the quantity');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const items = cart?.products || [];
  const subtotal = items.reduce(
    (sum, it) => sum + (it.product?.price || 0) * (it.quantity || 0),
    0
  );
  const currency = items[0]?.product?.currency || '';

  return (
    <MvpShell title="CART" subtitle="THE STORE">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading cart...</div>
      ) : (
        <>
          {/* Shown above the list rather than instead of it: a failed quantity change used to
              replace the whole cart with an error, losing sight of what is still in it. */}
          {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

          {items.length === 0 ? (
            <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>
              Your cart is empty. <Link href="/store" style={{ color: '#ABD49E' }}>Browse the store →</Link>
            </div>
          ) : (
            <>
              {items.map((it, idx) => {
                const id = it.product?._id;
                const quantity = it.quantity || 0;
                const stock = stockLeft(it.product);
                const atLimit = it.product ? atStockLimit(it.product, quantity) : false;
                return (
                  <div key={id || idx} style={mvpCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      {id ? (
                        <Link href={`/store/${id}`} style={{ color: '#ABD49E', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                          {it.product.name || 'Item'}
                        </Link>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 700 }}>Item</span>
                      )}
                      <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                        {it.product?.currency} {it.product?.price != null ? it.product.price : '—'}
                      </span>
                    </div>

                    {!it.product ? (
                      <div style={{ fontSize: 11, color: '#E9040C', marginBottom: 10 }}>
                        This product is no longer in the store. Remove it to check out.
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => id && setQuantity(id, quantity - 1)}
                          disabled={busy}
                          style={stepBtn(busy)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span style={{ fontSize: 13, minWidth: 16, textAlign: 'center' }}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => id && !atLimit && setQuantity(id, quantity + 1)}
                          disabled={busy || atLimit}
                          style={stepBtn(busy || atLimit, atLimit)}
                          title={atLimit ? `Only ${stock} left` : undefined}
                          aria-label={atLimit ? `Only ${stock} left in stock` : 'Increase quantity'}
                        >
                          +
                        </button>
                        {/* The stepper stops at the shelf and says why. The server refuses the
                            same number, so a click that got through would only be an error line. */}
                        {atLimit || (stock > 0 && stock <= 5) ? (
                          <span style={{
                            fontSize: 9,
                            letterSpacing: '0.1em',
                            color: atLimit ? '#E9040C' : 'rgba(171,212,158,0.6)',
                          }}>
                            {atLimit ? `MAX — ONLY ${stock} LEFT` : `ONLY ${stock} LEFT`}
                          </span>
                        ) : null}
                      </div>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>
                        LINE {it.product?.currency} {(it.product?.price || 0) * quantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => id && remove(id)}
                      disabled={busy}
                      style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E', padding: '6px 10px', marginTop: 10 }}
                    >
                      REMOVE
                    </button>
                  </div>
                );
              })}

              <div style={{ ...mvpCard, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                <span>SUBTOTAL</span>
                <span>{currency} {subtotal}</span>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <Link href="/checkout" style={mvpButton(false)}>CHECKOUT</Link>
                <Link href="/store" style={{ color: '#ABD49E', fontSize: 12, alignSelf: 'center' }}>KEEP SHOPPING →</Link>
              </div>
            </>
          )}
        </>
      )}
    </MvpShell>
  );
}
