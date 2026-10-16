// components/FavouriteButton.jsx
// POST /api/store/add_to_favourites and DELETE /api/store/:productId/favourites existed with no
// caller anywhere in the rebuilt client, so there was no way to save a product at all. This is
// the one control the store grid and the product page both use, so "saved" means the same thing
// on both screens, and /favourites reads the same record back.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { MVP_GREEN } from './MvpShell';

export default function FavouriteButton({ productId, saved = false, onChange }) {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);
  const [on, setOn] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // The parent learns which products are saved asynchronously (its own fetch), so the prop can
  // arrive after mount.
  useEffect(() => { setOn(saved); }, [saved]);

  async function toggle(event) {
    // Cards are links; the heart must not navigate.
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) { router.push('/signin'); return; }
    if (busy) return;

    const wasOn = on;
    setBusy(true);
    setError(null);
    setOn(!wasOn); // answer the tap now; the request below either confirms it or puts it back

    try {
      const res = await fetch(
        wasOn ? `/api/store/${productId}/favourites` : '/api/store/add_to_favourites',
        {
          method: wasOn ? 'DELETE' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: wasOn ? undefined : JSON.stringify({ productId }),
        }
      );
      const data = await res.json().catch(() => ({}));
      // A double tap (or a second tab) makes the server answer 403 "Product exists already",
      // which means the product is saved — the state the caller wanted.
      const alreadySaved = !wasOn && res.status === 403;
      if (!res.ok && !alreadySaved) throw new Error(data.message || 'Could not update favourites');
      if (onChange) onChange(!wasOn);
    } catch (err) {
      setOn(wasOn);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? 'Remove from favourites' : 'Save to favourites'}
      title={error || (on ? 'Saved — tap to remove' : 'Save to favourites')}
      style={{
        background: 'rgba(21,20,19,0.75)',
        border: `1px solid ${error ? '#E9040C' : 'rgba(171,212,158,0.3)'}`,
        color: error ? '#E9040C' : MVP_GREEN,
        width: 28,
        height: 28,
        lineHeight: '20px',
        fontSize: 13,
        cursor: busy ? 'wait' : 'pointer',
        padding: 0,
      }}
    >
      {on ? '♥' : '♡'}
    </button>
  );
}
