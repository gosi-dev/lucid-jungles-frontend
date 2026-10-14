// pages/store/[productId].js — STORE PRODUCT (API: /api/store/product/:productId)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpButton } from '../../components/MvpShell';

export default function ProductPage() {
  const router = useRouter();
  const { productId } = router.query;
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/store/product/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status) setProduct(data.data);
        else setError(data.message || 'Product not found');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  async function addToCart() {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/store/add_to_cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not add to cart');
      setMessage('Added to cart.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <MvpShell title="PRODUCT" subtitle="THE STORE">
      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : error ? (
        <div style={{ color: '#E9040C' }}>{error}</div>
      ) : (
        <>
          <div style={mvpCard}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
              {product?.name || 'Untitled'}
            </div>
            <div style={{ fontSize: 16, marginBottom: 12 }}>
              {product?.price != null ? `${product.price}` : '—'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
              {product?.description || 'No description.'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 16 }}>
              {product?.instock ? 'IN STOCK' : 'OUT OF STOCK'}
            </div>
            {message ? <div style={{ color: '#ABD49E', marginBottom: 10 }}>{message}</div> : null}
            <button type="button" onClick={addToCart} disabled={!product?.instock} style={mvpButton(!product?.instock)}>
              ADD TO CART
            </button>
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
