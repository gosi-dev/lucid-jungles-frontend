// pages/chat.js — CHAT (API: /api/chat, /api/chat/:threadId)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';

export default function ChatPage() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);

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

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    loadThreads();
  }, [isLoggedIn, loadThreads, router]);

  async function openThread(threadId) {
    setActiveThread(threadId);
    setError(null);
    try {
      const res = await fetch(`/api/chat/${threadId}`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function send() {
    if (!draft.trim() || !activeThread) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: activeThread, content: draft.trim() }),
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

  return (
    <MvpShell title="CHAT" subtitle="MESSAGES ACROSS THE JUNGLE">
      {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

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

      {activeThread ? (
        <div style={{ ...mvpCard, marginTop: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>
            THREAD: {activeThread}
          </div>
          <div style={{ maxHeight: 320, overflow: 'auto', marginBottom: 12 }}>
            {messages.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.6 }}>No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m._id} style={{ fontSize: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>@{m.senderId?.username || 'you'}: </span>
                  {m.content}
                </div>
              ))
            )}
          </div>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
            placeholder="Type a message"
            style={mvpInput}
          />
          <button type="button" onClick={send} disabled={!draft.trim()} style={mvpButton(!draft.trim())}>
            SEND
          </button>
        </div>
      ) : null}
    </MvpShell>
  );
}
