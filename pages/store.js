import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';

const ITEM_TYPE_LABELS = {
  physical: 'PHYSICAL',
  virtual: 'DIGITAL',
  hybrid: 'BUNDLE',
};

function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false);

  function handleCart() {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const img = product.images?.[0];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(171,212,158,0.1)',
      display: 'flex', flexDirection: 'column',
    }}>
      {img ? (
        <div style={{
          width: '100%', paddingTop: '75%', position: 'relative',
          background: `url(${img}) center/cover no-repeat`,
          filter: 'brightness(0.75)',
        }} />
      ) : (
        <div style={{
          width: '100%', paddingTop: '60%',
          background: 'rgba(171,212,158,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 32, color: 'rgba(171,212,158,0.12)' }}>◈</span>
        </div>
      )}
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', margin: 0, flex: 1, marginRight: 8 }}>{product.name}</h3>
          {product.item_type && (
            <span style={{ fontSize: 8, letterSpacing: '0.14em', color: 'rgba(171,212,158,0.5)', border: '1px solid rgba(171,212,158,0.2)', padding: '2px 6px', whiteSpace: 'nowrap' }}>
              {ITEM_TYPE_LABELS[product.item_type] || product.item_type.toUpperCase()}
            </span>
          )}
        </div>
        {product.description && (
          <p style={{ fontSize: 12, color: 'rgba(171,212,158,0.6)', lineHeight: 1.6, margin: '0 0 12px', flex: 1 }}>
            {product.description.slice(0, 90)}{product.description.length > 90 ? '…' : ''}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {product.currency} {product.price}
          </span>
          <button
            onClick={handleCart}
            style={{
              background: added ? 'rgba(171,212,158,0.15)' : 'transparent',
              border: '1px solid rgba(171,212,158,0.4)',
              color: '#ABD49E',
              fontSize: 9,
              letterSpacing: '0.14em',
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {added ? 'ADDED ✓' : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/store/public/products')
      .then((r) => r.json())
      .then((d) => { if (d.status) setProducts(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i._id !== id));
  }

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const filtered = filter === 'all' ? products : products.filter((p) => p.item_type === filter);

  const S = {
    page: { minHeight: '100vh', background: '#0A0A09', color: '#ABD49E', fontFamily: "'Averia Sans Libre', 'Inter', sans-serif" },
    inner: { maxWidth: 960, margin: '0 auto', padding: '88px 20px 80px' },
    filterBtn: (active) => ({
      background: active ? 'rgba(171,212,158,0.1)' : 'transparent',
      border: '1px solid rgba(171,212,158,0.2)',
      color: '#ABD49E',
      fontSize: 9, letterSpacing: '0.14em',
      padding: '5px 14px', cursor: 'pointer',
    }),
  };

  return (
    <div style={S.page}>
      <NavBar />
      <div style={S.inner}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 6px' }}>THE STORE</h1>
            <p style={{ color: 'rgba(171,212,158,0.5)', fontSize: 13, margin: 0 }}>
              Gear, drops, and jungle essentials.
            </p>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(!cartOpen)}
            style={{
              background: cartCount > 0 ? 'rgba(171,212,158,0.1)' : 'transparent',
              border: '1px solid rgba(171,212,158,0.3)',
              color: '#ABD49E', fontSize: 10, letterSpacing: '0.12em',
              padding: '8px 18px', cursor: 'pointer', position: 'relative',
            }}
          >
            CART {cartCount > 0 ? `(${cartCount})` : ''}
          </button>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {['all', 'physical', 'virtual', 'hybrid'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
              {f === 'all' ? 'ALL' : ITEM_TYPE_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading && <p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13 }}>Loading...</p>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'rgba(171,212,158,0.3)', fontSize: 13 }}>
              No products yet. Run the seed script to populate the store.
            </p>
            <p style={{ color: 'rgba(171,212,158,0.2)', fontSize: 11, marginTop: 8 }}>
              cd OG/original-backend && node seed.js
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} onAddToCart={addToCart} />
          ))}
        </div>

        {/* Cart slide-in */}
        {cartOpen && (
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
            background: '#151413', borderLeft: '1px solid rgba(171,212,158,0.15)',
            zIndex: 200, padding: 24, overflowY: 'auto',
            fontFamily: "'Averia Sans Libre', 'Inter', sans-serif",
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', color: '#ABD49E', margin: 0 }}>CART</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ABD49E', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>

            {cart.length === 0 && (
              <p style={{ color: 'rgba(171,212,158,0.4)', fontSize: 12 }}>Your cart is empty.</p>
            )}

            {cart.map((item) => (
              <div key={item._id} style={{
                borderBottom: '1px solid rgba(171,212,158,0.1)',
                paddingBottom: 14, marginBottom: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#ABD49E', flex: 1 }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#ABD49E' }}>×{item.qty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(171,212,158,0.5)' }}>{item.currency} {(item.price * item.qty).toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,100,100,0.5)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, marginBottom: 20 }}>
                  <span style={{ fontSize: 12, color: 'rgba(171,212,158,0.6)' }}>TOTAL</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#ABD49E' }}>
                    {cart[0].currency} {cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!isLoggedIn) { router.push('/signup'); return; }
                    alert('Checkout coming soon. Payments via Flutterwave will be live shortly.');
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(171,212,158,0.1)',
                    border: '1px solid rgba(171,212,158,0.5)',
                    color: '#ABD49E',
                    fontSize: 11, letterSpacing: '0.14em',
                    padding: '12px 0', cursor: 'pointer',
                  }}
                >
                  CHECKOUT — COMING SOON
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
