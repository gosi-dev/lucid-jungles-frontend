// pages/chat.js — CHAT (API: /api/chat, /api/chat/:threadId)
//
// Opened either directly or from a person's profile with ?to=<userId>&name=<name>, which is
// what the MESSAGE action on the entity profile uses. A thread is just a stable id shared by
// two people, so the id is derived from the pair — no "start a conversation" endpoint needed,
// and the first message the user actually types creates it.
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSignedIn } from '../hooks/useSignedIn';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';
import { DESKTOP_NAV_H } from '../components/DesktopNavRow';
import { useIsDesktop } from '../hooks/useIsDesktop';

// Deterministic and order-independent, so both sides land in the same thread.
export const threadIdFor = (a, b) => [String(a), String(b)].sort().join('__');

export default function ChatPage() {
  const router = useRouter();
  const { status, signedIn, checking } = useSignedIn();
  const { to: toUserId, name: toName } = router.query;

  const [myId, setMyId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [threadInput, setThreadInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', { credentials: 'include' });
      const data = await res.json();
      if (data.status) setThreads(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stable identity, and declared before the effects that list it as a dependency — a `const`
  // is still in its temporal dead zone while a later effect's dep array is being evaluated.
  const openThread = useCallback(async (threadId) => {
    setActiveThread(threadId);
    setError(null);
    try {
      const res = await fetch(`/api/chat/${threadId}`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (checking) return;
    if (!signedIn) {
      router.push(`/signin?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    loadThreads();
  }, [checking, signedIn, loadThreads, router]);

  // Arriving from a profile: resolve who I am (the thread id needs both ids), then open the
  // pair's thread — which may legitimately be empty until the first message is sent.
  useEffect(() => {
    if (!signedIn || !toUserId || myId) return;
    let cancelled = false;
    fetch('/api/user/profile', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const id = d?.data?.user?._id;
        if (cancelled || !id) return;
        setMyId(String(id));
        setReceiverId(String(toUserId));
        const thread = threadIdFor(id, toUserId);
        setThreadInput(thread);
        openThread(thread);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [signedIn, toUserId, myId, openThread]);

  async function send() {
    if (!draft.trim() || !activeThread) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        // receiverId is what makes a thread started from a profile addressable; the API has
        // always accepted it and the first message in a new thread needs it.
        body: JSON.stringify({ threadId: activeThread, receiverId, content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not send');
      setMessages((prev) => [...prev, data.data]);
      setDraft('');
      loadThreads();
    } catch (err) {
      setError(err.message);
    }
  }

  function startThread() {
    if (!threadInput.trim()) return;
    openThread(threadInput.trim());
    setThreadInput('');
  }

  const isDesktop = useIsDesktop();

  // The conversation fills what the window has left after the shell header and padding. On a
  // desktop the header also carries DesktopNavRow, so its height is in the subtraction too —
  // otherwise the composer is pushed 46px past the bottom of the screen.
  // Browsing (`/chat` with no ?to=) also carries the open-by-id card, so the panes give
  // that back rather than pushing the composer off the bottom.
  const chrome = 140 + (isDesktop ? DESKTOP_NAV_H : 0);
  const paneHeight = isDesktop ? `calc(100vh - ${toUserId ? chrome : chrome + 180}px)` : 'auto';
  const paneFloor = isDesktop ? 320 : undefined;

  return (
    <MvpShell
      title="CHAT"
      subtitle={toUserId ? `MESSAGE ${String(toName || 'THIS PERSON').toUpperCase()}` : 'MESSAGES ACROSS THE JUNGLE'}
    >
      {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

      {/* The thread id box only makes sense when browsing; arriving from a profile derives
          the thread from the two ids, so it would just be noise. */}
      {!toUserId && (
      <div style={mvpCard}>
        <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>START / OPEN THREAD</div>
        <input
          value={threadInput}
          onChange={(e) => setThreadInput(e.target.value)}
          placeholder="thread id (e.g. a username)"
          style={mvpInput}
        />
        <button type="button" onClick={startThread} disabled={!threadInput.trim()} style={mvpButton(!threadInput.trim())}>
          OPEN
        </button>
      </div>
      )}

      {/* One pane on a phone, two on a desktop: the conversations on the left, the open
          conversation on the right. */}
      <div style={{ display: isDesktop ? 'flex' : 'block', gap: 16, alignItems: 'stretch' }}>
        <div
          style={{
            width: isDesktop ? 320 : '100%',
            flexShrink: 0,
            maxHeight: paneHeight,
            minHeight: paneFloor,
            overflowY: isDesktop ? 'auto' : 'visible',
          }}
        >
          {loading ? (
            <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading threads...</div>
          ) : threads.length === 0 ? (
            <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>No conversations yet.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => openThread(t._id)}
                style={{
                  ...mvpCard,
                  width: '100%',
                  textAlign: 'left',
                  background: activeThread === t._id ? 'rgba(171,212,158,0.12)' : 'transparent',
                  color: '#ABD49E',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t._id}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{t.lastMessage}</div>
              </button>
            ))
          )}
        </div>

        {activeThread || isDesktop ? (
          <div
            style={{
              ...mvpCard,
              marginTop: isDesktop ? 0 : 16,
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              height: isDesktop ? paneHeight : undefined,
              minHeight: paneFloor,
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>
              {activeThread ? `THREAD: ${activeThread}` : 'NO CONVERSATION OPEN'}
            </div>
            <div style={{ flex: 1, maxHeight: isDesktop ? undefined : 320, overflow: 'auto', marginBottom: 12 }}>
              {messages.length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {activeThread ? 'No messages yet.' : 'Open a conversation on the left, or start one by id.'}
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m._id} style={{ fontSize: 12, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>@{m.senderId?.username || 'you'}: </span>
                    {m.content}
                  </div>
                ))
              )}
            </div>
            {/* Stacked on a phone, one row on a desktop where the width is there for it. */}
            <div style={{ display: isDesktop ? 'flex' : 'block', gap: 10, alignItems: 'center' }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
                placeholder="Type a message"
                style={{ ...mvpInput, ...(isDesktop ? { flex: 1, marginBottom: 0 } : null) }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                style={{ ...mvpButton(!draft.trim()), ...(isDesktop ? { width: 96 } : null) }}
              >
                SEND
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </MvpShell>
  );
}
