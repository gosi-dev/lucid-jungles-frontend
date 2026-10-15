// hooks/useSignedIn.js
//
// redux-persist only knows what this device recorded — the session cookie lives on the
// server, and the two drift apart in both directions: cleared storage on a live session
// (a rebuilt client, a new browser), or a remembered login whose cookie has expired. So
// the session is treated as the source of truth and the local flag is reconciled to it.
//
// GET /api/events/user/my-tickets is loginRequired: 200 means the session is live; anything
// else (the backend answers unauthenticated requests with 500 "Login required") means it is
// not. One probe per mount.
//
// status: 'checking' until the server has answered. The starting value mirrors redux so a
// signed-in reload does not flash a gate.
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateIsLoggedIn } from '../store/registerSlice';

export function useSignedIn() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.registerSlice.isLoggedIn);
  const [status, setStatus] = useState(isLoggedIn ? 'in' : 'checking');
  const reconciled = useRef(false);

  useEffect(() => {
    if (reconciled.current) return;
    let cancelled = false;

    fetch('/api/events/user/my-tickets', { credentials: 'include' })
      .then(res => {
        if (cancelled) return;
        const live = res.ok;
        reconciled.current = true;
        setStatus(live ? 'in' : 'out');
        if (live !== isLoggedIn) dispatch(updateIsLoggedIn(live));
      })
      .catch(() => {
        if (cancelled) return;
        reconciled.current = true;
        setStatus('out');
        if (isLoggedIn) dispatch(updateIsLoggedIn(false));
      });

    return () => { cancelled = true; };
  }, [dispatch, isLoggedIn]);

  return { status, signedIn: status === 'in', checking: status === 'checking' };
}
