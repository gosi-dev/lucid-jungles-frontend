import { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import ReactFlow, { Background, useNodesState, useEdgesState } from "reactflow";

// Kṻra entity icon — two dot eyes + rectangle mouth
function KuraIcon({ size = 22, color = '#ABD49E' }) {
  const w = Math.round(size * 30 / 82);
  return (
    <svg width={w} height={size} viewBox="0 0 30 82" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.32041 22.4746L5.25668 17.5946H23.5165L20.4528 22.4746H8.32041ZM15 82C5.29412 82 0 76.7502 0 67.064V32.312H5.29412V66.3986C5.29412 73.5708 8.52941 77.1199 15.0735 77.1199C21.6176 77.1199 24.8529 73.5708 24.8529 66.3986V32.312H30V67.064C30 76.7502 24.7059 82 15 82Z" fill={color} />
      <path d="M7.39487 8.72498C4.9684 8.72498 3.05664 6.80253 3.05664 4.36249C3.05664 1.92245 4.9684 0 7.39487 0C9.82134 0 11.7331 1.92245 11.7331 4.36249C11.7331 6.80253 9.82134 8.72498 7.39487 8.72498ZM22.5419 8.72498C20.1155 8.72498 18.2037 6.80253 18.2037 4.36249C18.2037 1.92245 20.1155 0 22.5419 0C24.9684 0 26.8802 1.92245 26.8802 4.36249C26.8802 6.80253 24.9684 8.72498 22.5419 8.72498Z" fill={color} />
    </svg>
  );
}
import "reactflow/dist/style.css";
import isMobile from "is-mobile";
import { v4 as uuidv4 } from "uuid";
import NavBar from "../components/NavBar";
import AnimatedPage from "../components/AnimatedPage";
import {
  HomeNode,
  BonzoNode,
  CustomMapNode,
  RockNode,
  RockNode2,
  TreeNode,
  TreeNode2,
  TreeNode3,
  SmallTreeNode,
  SmallTreeNode2,
  SmallTreeNode3,
  RoadNode,
  BuildingNode,
} from "../components/MapNodes";

const nodeTypes = {
  HomeNode,
  BonzoNode,
  customNode: CustomMapNode,
  RockNode,
  RockNode2,
  TreeNode,
  TreeNode2,
  TreeNode3,
  SmallTreeNode,
  SmallTreeNode2,
  SmallTreeNode3,
  RoadNode,
  BuildingNode,
};

function makeKuraNodes() {
  return [
    { id: "111", type: "HomeNode", position: { x: 450, y: 150 }, draggable: false, data: {}, style: { zIndex: 10 } },
    { id: uuidv4(), type: "RockNode", position: { x: 150, y: 250 }, draggable: false, data: {}, style: { zIndex: 2 } },
    { id: uuidv4(), type: "RockNode2", position: { x: 600, y: 350 }, draggable: false, data: {}, style: { zIndex: 1 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 450, y: 50 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 400, y: 50 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 430, y: 20 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 430, y: 100 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 400, y: 80 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode2", position: { x: 150, y: 110 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode3", position: { x: 50, y: 80 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 30, y: 120 }, draggable: false, data: {}, style: { zIndex: 3 } },
    { id: uuidv4(), type: "SmallTreeNode", position: { x: 140, y: 280 }, draggable: false, data: {}, style: { zIndex: 1 } },
    { id: uuidv4(), type: "TreeNode3", position: { x: 170, y: 100 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 700, y: 50 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode", position: { x: 800, y: 210 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 1100, y: 50 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 400, y: 250 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: -20, y: -130 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode", position: { x: 330, y: -90 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode3", position: { x: 790, y: -160 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 650, y: 350 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 1000, y: 300 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode", position: { x: 900, y: 420 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode", position: { x: 270, y: 400 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 40, y: 420 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: uuidv4(), type: "TreeNode2", position: { x: 450, y: 490 }, draggable: false, data: {}, style: { zIndex: 5, scale: 0.75 } },
    { id: "122", type: "TreeNode", position: { x: -250, y: 300 }, draggable: false, data: {} },
    { id: "124", type: "TreeNode2", position: { x: 100, y: 600 }, draggable: false, data: {} },
    { id: "123", type: "TreeNode2", position: { x: -400, y: 600 }, draggable: false, data: {} },
    { id: "125", type: "TreeNode", position: { x: -150, y: 500 }, draggable: false, data: {} },
  ];
}

export default function Kura() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state) => state.registerSlice);
  const mobile = isMobile();

  const [nodes, , onNodesChange] = useNodesState(() => makeKuraNodes());
  const [edges, , onEdgesChange] = useEdgesState([]);
  const [hasDragged, setHasDragged] = useState(false);

  // Dream Log panel state
  const [dlOpen, setDlOpen]     = useState(false);
  const [entries, setEntries]   = useState([]);
  const [dlTitle, setDlTitle]   = useState('');
  const [dlText, setDlText]     = useState('');
  const [dlPrivate, setDlPrivate] = useState(false);
  const [dlTasks, setDlTasks]   = useState(''); // newline-separated task text
  const [dlSaving, setDlSaving] = useState(false);

  // Edit entry state
  const [editingId, setEditingId]     = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingTasks, setEditingTasks] = useState(''); // newline-separated task text for editing
  const [editSaving, setEditSaving]   = useState(false);

  // Share card
  const [shareEntry, setShareEntry] = useState(null);
  const [shareCardSide, setShareCardSide] = useState('front'); // 'front' | 'back'
  const shareCardRef = useRef(null);

  // User profile + avatar (for share card)
  const [userProfile, setUserProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Kura daily state
  const [kuraState, setKuraState] = useState(null);
  const [kuraLoading, setKuraLoading] = useState(true);

  // Dojo today
  const [dojoToday, setDojoToday]         = useState(null);
  const [dojoFanbaseId, setDojoFanbaseId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/signup");
    }
  }, [isLoggedIn, router]);

  // Load user profile + avatar for share card
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/user/profile', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data?.user) setUserProfile(data.data.user); })
      .catch(() => {});
    fetch('/api/avatar/view', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data?.avatar?.avatarurl) setAvatarUrl(data.data.avatar.avatarurl); })
      .catch(() => {});
  }, [isLoggedIn]);

  // Load Kura daily state
  useEffect(() => {
    if (!isLoggedIn) return;
    setKuraLoading(true);
    fetch('/api/kura/daily-state', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setKuraState(data); setKuraLoading(false); })
      .catch(() => setKuraLoading(false));
  }, [isLoggedIn]);

  // Load Dojo today
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/fanbase/my-dojo', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.isMember || !data?.onboardingComplete || !data?.fanbase?._id) return;
        const fid = data.fanbase._id;
        setDojoFanbaseId(fid);
        return fetch(`/api/routine/today?fanbaseId=${fid}`, { credentials: 'include' })
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.today) setDojoToday(d.today); });
      })
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => setHasDragged(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Load Dream Log entries when panel opens
  useEffect(() => {
    if (!dlOpen || !isLoggedIn) return;
    fetch('/api/dreamlog', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [dlOpen, isLoggedIn]);

  const saveDlEntry = async () => {
    if (!dlText.trim()) return;
    setDlSaving(true);
    const tasks = dlTasks
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
      .map(text => ({ text }));
    try {
      const res = await fetch('/api/dreamlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: dlTitle.trim(), content: dlText, isPrivate: dlPrivate, tasks })
      });
      if (res.ok) {
        const entry = await res.json();
        setEntries(prev => [entry, ...prev]);
        setDlTitle('');
        setDlText('');
        setDlTasks('');
        setDlPrivate(false);
      }
    } catch {}
    setDlSaving(false);
  };

  const exportCard = async () => {
    if (!shareCardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(shareCardRef.current, {
      scale: 2,
      backgroundColor: '#0A0A09',
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `lucid-jungles-${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const tickTask = async (entryId, taskIndex, completed) => {
    const res = await fetch(`/api/dreamlog/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ taskIndex, completed })
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries(prev => prev.map(e => e._id === entryId ? updated : e));
    }
  };

  const defaultViewport = useMemo(
    () => ({
      x: mobile ? -600 : -200,
      y: mobile ? 50 : 0,
      zoom: mobile ? 1.5 : 2,
    }),
    [mobile]
  );

  if (!isLoggedIn) return null;

  return (
    <AnimatedPage>
      <Head>
        <title>Kṻra — Lucid Jungles</title>
      </Head>
      <main className="relative w-[100dvw] h-[100dvh] font-CodeSaver bg-primary p-2">
        <NavBar audioControls={false} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultViewport={defaultViewport}
          proOptions={{ hideAttribution: true }}
          className="bg-gray-50 w-full h-full border-[3px] border-secondary"
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnScroll={true}
          panOnDrag={true}
          translateExtent={[[-600, -300], [1200, 800]]}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background
            variant="lines"
            gap={150}
            size={5}
            color="#FFFFFF"
            className="bg-[#02a1fd]"
          />
        </ReactFlow>

        {/* Hint to drag */}
        <div
          className={`absolute bottom-[8%] left-1/2 -translate-x-1/2 w-max h-max px-6 py-4 transition-all ease-in-out duration-500 bg-secondary text-primary text-sm md:text-lg font-semibold pointer-events-none border-[1px] border-primary ${
            hasDragged ? "opacity-0" : "opacity-100"
          }`}
        >
          TAP ON THE TABLE TO GET STARTED
        </div>

        {/* Kura daily state card */}
        {!kuraLoading && kuraState && (
          <div
            style={{
              position: 'fixed',
              top: 64,
              left: 16,
              width: 280,
              background: '#151413',
              border: '1px solid #ABD49E',
              zIndex: 50,
              padding: '14px 16px'
            }}
          >
            {/* Resonance label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: '#ABD49E', fontSize: 11, opacity: 0.5, letterSpacing: 2 }}>
                KṺRA
              </span>
              <span style={{
                color: '#ABD49E',
                fontSize: 10,
                opacity: 0.5,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}>
                {kuraState.resonance} · {kuraState.beast}
              </span>
            </div>

            {/* Message */}
            <p style={{
              color: '#ABD49E',
              fontSize: 13,
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: kuraState.nudge ? 12 : 0
            }}>
              &ldquo;{kuraState.message}&rdquo;
            </p>

            {/* Nudge */}
            {kuraState.nudge && (
              <div
                onClick={() => {
                  if (kuraState.nudgeRoute) {
                    router.push(kuraState.nudgeRoute);
                  } else {
                    setDlOpen(true);
                  }
                }}
                style={{
                  borderTop: '1px solid rgba(171,212,158,0.2)',
                  paddingTop: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: '#ABD49E', fontSize: 12, opacity: 0.7 }}>
                  {kuraState.nudge}
                </span>
                <span style={{ color: '#ABD49E', fontSize: 14, opacity: 0.5, marginLeft: 8 }}>›</span>
              </div>
            )}

            {/* Status link */}
            <div
              onClick={() => router.push('/status')}
              style={{
                borderTop: '1px solid rgba(171,212,158,0.1)',
                paddingTop: 8,
                marginTop: kuraState.nudge ? 8 : 0,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#ABD49E', fontSize: 10, opacity: 0.35, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                View Full Status
              </span>
              <span style={{ color: '#ABD49E', fontSize: 12, opacity: 0.25 }}>↗</span>
            </div>
          </div>
        )}

        {/* Dojo today widget */}
        {dojoToday && (
          <div
            onClick={() => router.push(dojoFanbaseId ? `/dojo?fanbaseId=${dojoFanbaseId}` : '/dojo')}
            style={{
              position: 'fixed',
              top: 270,
              left: 16,
              width: 280,
              background: '#151413',
              border: '1px solid rgba(171,212,158,0.35)',
              zIndex: 50,
              padding: '12px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#ABD49E', fontSize: 10, opacity: 0.5, letterSpacing: 2 }}>TODAY IN THE DOJO</span>
              <span style={{ color: '#ABD49E', fontSize: 12, opacity: 0.3 }}>›</span>
            </div>
            <p style={{ color: '#ABD49E', fontSize: 13, fontWeight: 'bold', marginBottom: dojoToday.isRest ? 0 : 6 }}>
              {dojoToday.name}
            </p>
            {!dojoToday.isRest && dojoToday.exercises?.length > 0 && (
              <p style={{ color: '#ABD49E', fontSize: 11, opacity: 0.45 }}>
                {dojoToday.exercises.length} exercises · ~{dojoToday.duration} min
              </p>
            )}
            {dojoToday.isRest && (
              <p style={{ color: '#ABD49E', fontSize: 11, opacity: 0.4, fontStyle: 'italic' }}>Stillness is also training.</p>
            )}
          </div>
        )}

        {/* Dojo button */}
        <button
          onClick={() => router.push(dojoFanbaseId ? `/dojo?fanbaseId=${dojoFanbaseId}` : '/dojo')}
          style={{
            position: 'fixed',
            bottom: 20,
            left: 16,
            background: '#151413',
            border: '1px solid #ABD49E',
            color: '#ABD49E',
            padding: '10px 16px',
            fontWeight: 'bold',
            fontSize: 13,
            cursor: 'pointer',
            zIndex: 50
          }}
        >
          DOJO
        </button>

        {/* Dream Log toggle button */}
        <button
          onClick={() => setDlOpen(v => !v)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 16,
            background: '#151413',
            border: '1px solid #ABD49E',
            color: '#ABD49E',
            padding: '10px 16px',
            fontWeight: 'bold',
            fontSize: 13,
            cursor: 'pointer',
            zIndex: 50
          }}
        >
          {dlOpen ? 'CLOSE LOG' : 'DREAM LOG'}
        </button>

        {/* Dream Log slide-up panel */}
        {dlOpen && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '70vh',
              background: '#151413',
              border: '1px solid #ABD49E',
              borderBottom: 'none',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Panel header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #ABD49E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#ABD49E', fontWeight: 'bold', fontSize: 16, margin: 0 }}>DREAM LOG</h2>
              <button
                onClick={() => setDlOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ABD49E',
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '0 4px',
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            </div>

            {/* New entry composer */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(171,212,158,0.2)', flexShrink: 0 }}>
              <input
                value={dlTitle}
                onChange={e => setDlTitle(e.target.value)}
                placeholder="Title (optional)"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(171,212,158,0.5)',
                  color: '#ABD49E',
                  padding: '8px 10px',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              />
              <textarea
                value={dlText}
                onChange={e => setDlText(e.target.value)}
                placeholder="Write something..."
                rows={2}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(171,212,158,0.5)',
                  color: '#ABD49E',
                  padding: '8px 10px',
                  fontSize: 14,
                  resize: 'none',
                  marginBottom: 8
                }}
              />
              <input
                value={dlTasks}
                onChange={e => setDlTasks(e.target.value)}
                placeholder="Today's intentions (one per line, optional)"
                rows={3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(171,212,158,0.5)',
                  color: '#ABD49E',
                  padding: '8px 10px',
                  fontSize: 13,
                  marginBottom: 8
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: '#ABD49E', fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dlPrivate}
                    onChange={e => setDlPrivate(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  Private
                </label>
                <button
                  onClick={saveDlEntry}
                  disabled={dlSaving || !dlText.trim()}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ABD49E',
                    color: '#ABD49E',
                    padding: '6px 16px',
                    fontWeight: 'bold',
                    fontSize: 13,
                    cursor: dlSaving || !dlText.trim() ? 'not-allowed' : 'pointer',
                    opacity: dlSaving || !dlText.trim() ? 0.4 : 1
                  }}
                >
                  {dlSaving ? 'SAVING...' : 'LOG IT'}
                </button>
              </div>
            </div>

            {/* Entries list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {entries.length === 0 && (
                <p style={{ color: '#ABD49E', opacity: 0.5, fontSize: 13 }}>No entries yet. Write something.</p>
              )}
              {entries.map(entry => (
                <div
                  key={entry._id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(171,212,158,0.15)'
                  }}
                >
                  {editingId === entry._id ? (
                    <div style={{ marginBottom: 8 }}>
                      <textarea
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        rows={4}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: '1px solid rgba(171,212,158,0.5)',
                          color: '#ABD49E',
                          padding: '8px 10px',
                          fontSize: 14,
                          resize: 'vertical',
                          marginBottom: 8,
                        }}
                      />
                      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ABD49E', opacity: 0.45, marginBottom: 6 }}>
                        Intentions (one per line)
                      </div>
                      <textarea
                        value={editingTasks}
                        onChange={e => setEditingTasks(e.target.value)}
                        rows={3}
                        placeholder="One intention per line…"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: '1px solid rgba(171,212,158,0.35)',
                          color: '#ABD49E',
                          padding: '8px 10px',
                          fontSize: 13,
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          disabled={editSaving}
                          onClick={async () => {
                            if (!editingText.trim()) return;
                            setEditSaving(true);
                            const newTasks = editingTasks
                              .split('\n')
                              .map(t => t.trim())
                              .filter(Boolean)
                              .map(text => {
                                const existing = entry.tasks?.find(et => et.text === text);
                                return { text, completed: existing?.completed ?? false };
                              });
                            try {
                              const res = await fetch(`/api/dreamlog/${entry._id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ content: editingText.trim(), tasks: newTasks }),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setEntries(prev => prev.map(e => e._id === entry._id ? updated : e));
                                setEditingId(null);
                              }
                            } catch {}
                            setEditSaving(false);
                          }}
                          style={{
                            background: '#ABD49E',
                            border: 'none',
                            color: '#0A0A09',
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            fontWeight: 'bold',
                            padding: '4px 12px',
                            cursor: editSaving ? 'not-allowed' : 'pointer',
                            opacity: editSaving ? 0.5 : 1,
                          }}
                        >
                          {editSaving ? 'SAVING...' : 'SAVE'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(171,212,158,0.3)',
                            color: '#ABD49E',
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            padding: '4px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#ABD49E', fontSize: 14, marginBottom: entry.tasks?.length ? 8 : 0 }}>
                      {entry.content}
                    </p>
                  )}
                  {entry.tasks?.length > 0 && (
                    <div>
                      {entry.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          onClick={() => tickTask(entry._id, idx, !task.completed)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            padding: '4px 0'
                          }}
                        >
                          <div style={{
                            width: 16,
                            height: 16,
                            border: '1px solid #ABD49E',
                            background: task.completed ? '#ABD49E' : 'transparent',
                            flexShrink: 0
                          }} />
                          <span style={{
                            color: '#ABD49E',
                            fontSize: 13,
                            textDecoration: task.completed ? 'line-through' : 'none',
                            opacity: task.completed ? 0.5 : 1
                          }}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <p style={{ color: '#ABD49E', opacity: 0.4, fontSize: 11, margin: 0 }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                      {entry.isPrivate ? ' · private' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => { setEditingId(entry._id); setEditingText(entry.content); setEditingTasks(entry.tasks?.map(t => t.text).join('\n') || ''); }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(171,212,158,0.2)',
                          color: '#ABD49E',
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          padding: '3px 10px',
                          cursor: 'pointer',
                          opacity: 0.5,
                        }}
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => { setShareEntry(entry); setShareCardSide('front'); }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(171,212,158,0.3)',
                          color: '#ABD49E',
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          padding: '3px 10px',
                          cursor: 'pointer',
                          opacity: 0.6,
                        }}
                      >
                        SHARE
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this entry?')) return;
                          try {
                            const res = await fetch(`/api/dreamlog/${entry._id}`, { method: 'DELETE' });
                            if (res.ok) setEntries(prev => prev.filter(e => e._id !== entry._id));
                          } catch (e) {}
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,100,100,0.25)',
                          color: 'rgba(255,100,100,0.6)',
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          padding: '3px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {/* Share card modal */}
      {shareEntry && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24, gap: 20,
          backdropFilter: 'blur(6px)',
          overflowY: 'auto',
        }}>
          {/* Side switcher — only show if entry has intentions */}
          {shareEntry.tasks?.length > 0 && (
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                onClick={() => setShareCardSide('front')}
                style={{
                  background: shareCardSide === 'front' ? '#ABD49E' : 'transparent',
                  border: '1px solid rgba(171,212,158,0.35)',
                  color: shareCardSide === 'front' ? '#0A0A09' : '#ABD49E',
                  fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                  fontWeight: shareCardSide === 'front' ? 700 : 400,
                  padding: '7px 20px', cursor: 'pointer',
                }}
              >
                Journal Entry
              </button>
              <button
                onClick={() => setShareCardSide('back')}
                style={{
                  background: shareCardSide === 'back' ? '#ABD49E' : 'transparent',
                  border: '1px solid rgba(171,212,158,0.35)',
                  color: shareCardSide === 'back' ? '#0A0A09' : '#ABD49E',
                  fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                  fontWeight: shareCardSide === 'back' ? 700 : 400,
                  padding: '7px 20px', cursor: 'pointer',
                }}
              >
                Intentions
              </button>
            </div>
          )}
          {/* Card — 540×720 renders at 1080×1440 @2x */}
          <div
            ref={shareCardRef}
            style={{
              width: 540, height: 720,
              background: '#0A0A09',
              border: '6px solid #ABD49E',
              display: 'flex', flexDirection: 'column',
              fontFamily: "'Averia Sans Libre', 'Inter', sans-serif",
              flexShrink: 0,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {/* ── Header band ─────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 28px',
              background: 'rgba(171,212,158,0.04)',
              borderBottom: '1px solid rgba(171,212,158,0.1)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <KuraIcon size={26} color="#ABD49E" />
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ABD49E', fontWeight: 600 }}>
                    {shareCardSide === 'front' ? 'Dream Journal Entry' : 'Daily Intentions'}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#ABD49E', opacity: 0.4, marginTop: 3 }}>
                    {new Date(shareEntry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                    {'  ·  '}
                    {new Date(shareEntry.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{
                width: 64, height: 64, flexShrink: 0,
                background: kuraState?.resonance
                  ? { pulse: 'rgba(171,212,158,0.18)', dream: 'rgba(158,196,212,0.18)', shadow: 'rgba(168,158,196,0.18)', style: 'rgba(212,194,158,0.18)' }[kuraState.resonance] || 'rgba(171,212,158,0.1)'
                  : 'rgba(171,212,158,0.1)',
                border: '1px solid rgba(171,212,158,0.25)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(avatarUrl || userProfile?.profile_picture) ? (
                  <img src={avatarUrl || userProfile.profile_picture} crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <img src="/bonzo-avatar.png"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Bonzo" />
                )}
              </div>
            </div>

            {shareCardSide === 'front' ? (
              /* ── FRONT: Journal content ─────────────────── */
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '32px 36px',
                minHeight: 0,
              }}>
                {shareEntry.title && (
                  <p style={{
                    fontSize: 26, letterSpacing: '0.03em',
                    color: '#ABD49E', fontWeight: 700, margin: '0 0 20px',
                    lineHeight: 1.2,
                  }}>
                    {shareEntry.title}
                  </p>
                )}
                <p style={{
                  fontSize: shareEntry.content.length > 300 ? 17 : shareEntry.content.length > 180 ? 20 : shareEntry.content.length > 100 ? 24 : 30,
                  color: '#ABD49E',
                  lineHeight: 1.7,
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  margin: 0,
                }}>
                  {shareEntry.content}
                </p>
              </div>
            ) : (
              /* ── BACK: Daily intentions ──────────────────── */
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '36px 44px',
                minHeight: 0,
              }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ABD49E', opacity: 0.35, marginBottom: 32 }}>
                  Set for the day
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: shareEntry.tasks.length > 6 ? 16 : 24 }}>
                  {shareEntry.tasks.map((task, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                      <div style={{
                        width: 18, height: 18, flexShrink: 0, marginTop: 4,
                        border: '1px solid rgba(171,212,158,0.5)',
                        background: task.completed ? '#ABD49E' : 'transparent',
                      }} />
                      <span style={{
                        fontSize: shareEntry.tasks.length > 7 ? 15 : shareEntry.tasks.length > 5 ? 18 : shareEntry.tasks.length > 3 ? 22 : 26,
                        color: task.completed ? 'rgba(171,212,158,0.3)' : '#ABD49E',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        lineHeight: 1.4,
                        fontWeight: 400,
                        letterSpacing: '0.01em',
                      }}>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Footer band ──────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 28px',
              background: 'rgba(171,212,158,0.03)',
              borderTop: '1px solid rgba(171,212,158,0.1)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ABD49E', opacity: 0.5 }}>
                  {userProfile?.username || 'Dreamer'}
                </span>
                {kuraState?.resonance && (
                  <>
                    <span style={{ color: 'rgba(171,212,158,0.2)', fontSize: 9 }}>·</span>
                    <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'capitalize', color: '#ABD49E', opacity: 0.4 }}>
                      {kuraState.resonance}
                    </span>
                    <span style={{ color: 'rgba(171,212,158,0.2)', fontSize: 9 }}>·</span>
                    <span style={{ fontSize: 9, letterSpacing: '0.08em', color: '#ABD49E', opacity: 0.35 }}>
                      {kuraState.beast}
                    </span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ABD49E', opacity: 0.25 }}>lucid.jungles</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={exportCard}
              style={{
                background: '#ABD49E', color: '#0A0A09',
                border: 'none', padding: '12px 28px',
                fontSize: 11, letterSpacing: '0.15em',
                textTransform: 'uppercase', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Download {shareCardSide === 'front' ? 'Journal' : 'Intentions'} Card
            </button>
            <button
              onClick={() => setShareEntry(null)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(171,212,158,0.25)',
                color: '#ABD49E', padding: '12px 24px',
                fontSize: 11, letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      </main>
    </AnimatedPage>
  );
}
