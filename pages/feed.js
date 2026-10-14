// pages/feed.js — SOCIAL FEED (API: /api/feed + comments)
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import MvpShell, { mvpCard, mvpInput, mvpButton } from '../components/MvpShell';

export default function FeedPage() {
  const router = useRouter();
  const { isLoggedIn, username } = useSelector((state) => state.registerSlice);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [comments, setComments] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/feed', { credentials: 'include' });
      const data = await res.json();
      if (data.status) setPosts(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function submitPost() {
    if (!draft.trim()) return;
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || 'Could not post');
      setPosts((prev) => [data.data, ...prev]);
      setDraft('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function toggleComments(postId) {
    if (comments[postId]) {
      setComments((prev) => ({ ...prev, [postId]: null }));
      return;
    }
    const res = await fetch(`/api/feed/${postId}/comments`, { credentials: 'include' });
    const data = await res.json();
    setComments((prev) => ({ ...prev, [postId]: data.data || [] }));
  }

  async function submitComment(postId) {
    const content = (commentDraft[postId] || '').trim();
    if (!content) return;
    if (!isLoggedIn) {
      router.push('/signin');
      return;
    }
    const res = await fetch(`/api/feed/${postId}/comments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok && data.status) {
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data.data] }));
      setCommentDraft((prev) => ({ ...prev, [postId]: '' }));
    }
  }

  return (
    <MvpShell title="FEED" subtitle="WHAT THE JUNGLE IS SAYING">
      {error ? <div style={{ color: '#E9040C', marginBottom: 12 }}>{error}</div> : null}

      <div style={mvpCard}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isLoggedIn ? 'Share a moment...' : 'Sign in to post'}
          rows={3}
          style={{ ...mvpInput, resize: 'vertical' }}
        />
        <button type="button" onClick={submitPost} disabled={posting || !draft.trim()} style={mvpButton(posting || !draft.trim())}>
          POST
        </button>
      </div>

      {loading ? (
        <div style={{ opacity: 0.5, padding: 40, textAlign: 'center' }}>Loading feed...</div>
      ) : posts.length === 0 ? (
        <div style={{ opacity: 0.6, padding: 24, textAlign: 'center' }}>No posts yet. Be the first.</div>
      ) : (
        posts.map((post) => {
          const author = post.userId?.username || post.userId?.first_name || 'explorer';
          const thread = comments[post._id];
          return (
            <div key={post._id} style={mvpCard}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>@{author}</div>
              <div style={{ fontSize: 14, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{post.content}</div>
              {post.communityId?.name ? (
                <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 8 }}>in {post.communityId.name}</div>
              ) : null}
              <button
                type="button"
                onClick={() => toggleComments(post._id)}
                style={{ ...mvpButton(false), background: 'transparent', color: '#ABD49E', padding: '6px 10px' }}
              >
                COMMENTS {thread ? '▾' : '▸'}
              </button>

              {thread ? (
                <div style={{ marginTop: 10, borderTop: '1px solid rgba(171,212,158,0.15)', paddingTop: 10 }}>
                  {thread.length === 0 ? (
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>No comments yet.</div>
                  ) : (
                    thread.map((c) => (
                      <div key={c._id} style={{ fontSize: 12, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700 }}>@{c.userId?.username || 'explorer'}: </span>
                        {c.content}
                      </div>
                    ))
                  )}
                  <input
                    value={commentDraft[post._id] || ''}
                    onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post._id]: e.target.value }))}
                    placeholder="Add a comment"
                    style={mvpInput}
                  />
                  <button type="button" onClick={() => submitComment(post._id)} style={mvpButton(false)}>
                    REPLY
                  </button>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </MvpShell>
  );
}
