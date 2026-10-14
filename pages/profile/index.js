// pages/profile/index.js — DREAMING: Personal jungle map
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useLayout } from '../../context/LayoutContext';
import { useHideBottomNav } from '../../hooks/useHideBottomNav';
import { generateMapElements, getEntitySizing } from '../../data/jungleMapElements';
import { MOCK_MAP_ENTITIES } from '../../data/mockMapData';
import SearchBar from '../../components/SearchBar';
import Drawer from '../../components/Drawer';
import {
  KuraNode, MojNode, CCStudiosNode, DojoNode
} from '../../components/MapNodes';

const GRID_SIZE = 260; // matches Figma grid line spacing (3.svg)

// ── PERMANENT PLATFORM BASES (always on the DREAMING map) ──────────────────
const PLATFORM_BASES = [
  { id: 'moj',         type: 'building', gridX: -12, gridY: -5,  name: 'MOJ',               route: '/moj',       desc: 'Ministry of Joy — the cultural heartbeat of the jungle.' },
  { id: 'ccstudios',   type: 'building', gridX: 8,   gridY: 3,   name: 'CAPPUCCINO STUDIOX', route: '/ccstudios', desc: 'Creative studio & community space.' },
  { id: 'luciddojo',   type: 'building', gridX: 14,  gridY: -8,  name: 'LUCID DOJO',         route: '/dojo',      desc: 'The jungle dojo. Train, compete, level up.' },
  { id: 'lucidhigh',   type: 'building', gridX: -6,  gridY: 13,  name: 'LUCID HIGH CLUB',    route: '/highclub',  desc: 'The elevated lounge of Lucid Jungles.' },
];

const IMAGE_PATHS = {
  'big-tree-1':   '/jungle/Property%201=A.svg',
  'big-tree-2':   '/jungle/Property%201=B.svg',
  'small-tree-1': '/jungle/Property%201=A%20(1).svg',
  'small-tree-2': '/jungle/Property%201=B%20(1).svg',
  'palm':         '/jungle/Property%201=Palm%20Tree.svg',
  'shrub':        '/jungle/Property%201=Shrubs.svg',
  'rock':         '/jungle/Property%201=Rocks.svg',
  'flowers':      '/jungle/Property%201=Flowers.svg',
};

const getImagePath = (comp) => {
  if (comp.type === 'big-tree') return IMAGE_PATHS[`big-tree-${comp.variant || 1}`];
  if (comp.type === 'small-tree') return IMAGE_PATHS[`small-tree-${comp.variant || 1}`];
  return IMAGE_PATHS[comp.type];
};

// ── Individual building popup ───────────────────────────────────────────────
function BuildingPopup({ base, onClose }) {
  const router = useRouter();
  if (!base) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div style={{ backgroundColor: '#151413', border: '1px solid #ABD49E', maxWidth: 320, width: '100%', fontFamily: 'CodeSaver, monospace' }} onClick={e => e.stopPropagation()}>
        <div style={{ backgroundColor: '#ABD49E', color: '#151413', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>{base.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#151413', fontSize: 20, cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
        <div style={{ padding: '16px', color: '#ABD49E', fontSize: 13, lineHeight: 1.6 }}>{base.desc}</div>
        <button
          onClick={() => router.push(base.route)}
          style={{ width: '100%', height: 48, backgroundColor: 'transparent', border: 'none', borderTop: '1px solid #ABD49E', color: '#ABD49E', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
        >
          EXPLORE LOCATION <span style={{ fontSize: 18 }}>›</span>
        </button>
      </div>
    </div>
  );
}

// ── Connection dropdown ──────────────────────────────────────────────────────
function ConnectionDropdown({ conn, onClose }) {
  const router = useRouter();
  if (!conn) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ backgroundColor: '#151413', border: '1px solid #ABD49E', minWidth: 220, fontFamily: 'CodeSaver, monospace' }} onClick={e => e.stopPropagation()}>
        <div style={{ backgroundColor: '#ABD49E', color: '#151413', height: 40, display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{conn.name}</div>
        {[
          { label: 'VIEW PROFILE', action: () => { onClose(); } },
          { label: 'VISIT BASE', action: () => { router.push(`/${conn.id}`); onClose(); } },
          { label: 'CANCEL', action: onClose },
        ].map(item => (
          <button key={item.label} onClick={item.action}
            style={{ width: '100%', height: 44, backgroundColor: 'transparent', border: 'none', borderTop: '1px solid rgba(171,212,158,0.15)', color: '#ABD49E', fontWeight: 600, fontSize: 12, letterSpacing: 1, cursor: 'pointer', textAlign: 'left', padding: '0 16px' }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function DreamingPage() {
  const router = useRouter();
  const { setActiveNav, drawerView, setDrawerView } = useLayout();
  const { username } = useSelector(state => state.registerSlice);
  const mapContainerRef = useRef(null);

  useHideBottomNav(false);
  useEffect(() => { setActiveNav('DREAMING'); }, [setActiveNav]);

  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapData, setMapData] = useState({ connections: [], communities: [] });
  const [kuraOpen, setKuraOpen] = useState(false);

  // Fetch dynamic connections
  useEffect(() => {
    fetch('/api/map')
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          setMapData({
            connections: result.data.connections || [],
            communities: result.data.communities || [],
          });
        } else {
          const userEntities = MOCK_MAP_ENTITIES.filter(e => e.type === 'user' && e.id !== 'me');
          setMapData({
            connections: userEntities.map((e, i) => ({
              id: e.id, name: e.name, status: i === 0 ? 'online' : 'away',
              gridX: e.gridX, gridY: e.gridY, level: 'EXPLORER',
            })),
            communities: [],
          });
        }
      })
      .catch(() => setMapData({ connections: [], communities: [] }))
      .finally(() => setMapLoading(false));
  }, []);

  // All entities for map bounds + natural element generation
  const allEntities = useMemo(() => [
    { gridX: 0, gridY: 0, type: 'user' },
    ...PLATFORM_BASES.map(b => ({ gridX: b.gridX, gridY: b.gridY, type: 'building' })),
    ...mapData.connections.map(c => ({ gridX: c.gridX, gridY: c.gridY, type: 'user' })),
    ...mapData.communities.map(c => ({ gridX: c.gridX, gridY: c.gridY, type: 'community' })),
  ], [mapData]);

  const mapBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allEntities.forEach(e => {
      const s = getEntitySizing(e.type);
      minX = Math.min(minX, e.gridX);
      maxX = Math.max(maxX, e.gridX + s.totalSpace - 1);
      minY = Math.min(minY, e.gridY);
      maxY = Math.max(maxY, e.gridY + s.totalSpace - 1);
    });
    const buf = 6;
    const mnX = Math.floor(minX - buf), mxX = Math.floor(maxX + buf);
    const mnY = Math.floor(minY - buf), mxY = Math.floor(maxY + buf);
    const rangeX = mxX - mnX, rangeY = mxY - mnY;
    const maxRange = Math.max(rangeX, rangeY);
    const minCoord = Math.min(mnX, mnY);
    return {
      minGridCoord: minCoord,
      maxGridCoord: minCoord + maxRange,
      mapSize: maxRange * GRID_SIZE,
      gridOffset: -minCoord * GRID_SIZE,
    };
  }, [allEntities]);

  const { mapSize: MAP_SIZE, gridOffset: GRID_OFFSET } = mapBounds;

  const naturalComponents = useMemo(() => generateMapElements(
    mapBounds.minGridCoord, mapBounds.maxGridCoord,
    mapBounds.minGridCoord, mapBounds.maxGridCoord,
    allEntities
  ), [mapBounds, allEntities]);

  const naturalWithPositions = useMemo(() => naturalComponents.map(comp => {
    const px = GRID_OFFSET + comp.gridX * GRID_SIZE;
    const py = GRID_OFFSET + comp.gridY * GRID_SIZE;
    const size = comp.type === 'big-tree' ? GRID_SIZE * 1.1          // ~286px ≈ Figma
      : comp.type === 'small-tree' || comp.type === 'palm' ? GRID_SIZE * 0.46  // ~120px
      : GRID_SIZE * 0.4;                                               // ~104px rocks/shrubs
    return { ...comp, px, py, size };
  }), [naturalComponents, GRID_OFFSET]);

  const getPos = (gridX, gridY) => ({ x: GRID_OFFSET + gridX * GRID_SIZE, y: GRID_OFFSET + gridY * GRID_SIZE });

  // Center on HOME after load
  useEffect(() => {
    if (!mapLoading && mapContainerRef.current) {
      setTimeout(() => {
        const el = mapContainerRef.current;
        const { x, y } = getPos(0, 0);
        el.scrollLeft = x - el.clientWidth / 2 + GRID_SIZE / 2;
        el.scrollTop = y - el.clientHeight / 2 + GRID_SIZE / 2;
      }, 100);
    }
  }, [mapLoading, GRID_OFFSET]);

  // Drawer content
  const renderDrawerContent = () => {
    if (drawerView === 'community' && selectedConnection) {
      return (
        <div style={{ color: '#ABD49E' }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{selectedConnection.name}</div>
          <div style={{ opacity: 0.6, fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>COMMUNITY</div>
          <Link href={`/fanbase/${selectedConnection.id}`}
            style={{ display: 'block', height: 40, backgroundColor: '#ABD49E', color: '#151413', textAlign: 'center', lineHeight: '40px', fontWeight: 700, fontSize: 12, letterSpacing: 1, textDecoration: 'none' }}>
            VIEW COMMUNITY
          </Link>
        </div>
      );
    }
    const term = search.toLowerCase();
    const filtered = search.length
      ? mapData.connections.filter(c => c.name.toLowerCase().includes(term))
      : mapData.connections;
    return (
      <div>
        <div style={{ color: 'rgba(171,212,158,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 12 }}>CONNECTIONS ({filtered.length})</div>
        {filtered.length === 0 && (
          <div style={{ color: 'rgba(171,212,158,0.4)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            {search ? 'No matches' : 'No connections yet'}
          </div>
        )}
        {filtered.map(conn => (
          <div key={conn.id} onClick={() => { setSelectedConnection(conn); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(171,212,158,0.1)', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, backgroundColor: '#FFF212', border: '2px solid #151413', flexShrink: 0, position: 'relative' }}>
              <img src="/jungle/User%20Icon.svg" alt={conn.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', border: '2px solid #151413', backgroundColor: conn.status === 'online' ? '#4ADE80' : '#FCD34D' }} />
            </div>
            <div>
              <div style={{ color: '#ABD49E', fontWeight: 600, fontSize: 13 }}>{conn.name}</div>
              <div style={{ color: 'rgba(171,212,158,0.5)', fontSize: 10 }}>{conn.level || 'DREAMER'}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const homePos = getPos(0, 0);

  return (
    <>
      <Head>
        <title>DREAMING — Lucid Jungles</title>
        <link rel="preload" as="image" href="/jungle/Property%201=A.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=B.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=A%20(1).svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=B%20(1).svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Palm%20Tree.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Shrubs.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Rocks.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Flowers.svg" />
      </Head>
      <div style={{ position: 'relative', height: '100dvh', width: '100dvw', overflow: 'hidden', backgroundColor: '#0A2A0A' }}>

        <SearchBar
          placeholder="Search connections, communities..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value.length > 0) setShowList(true); }}
        />

        {/* Jungle map */}
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 75,
            overflow: 'auto', cursor: 'grab',
            background: 'linear-gradient(135deg, #0A2A0A 0%, #1A472A 30%, #2D5A3D 70%, #3D6B4F 100%)',
            scrollbarWidth: 'thin', scrollbarColor: '#ABD49E #151413',
          }}
        >
          <div style={{ position: 'relative', width: MAP_SIZE, height: MAP_SIZE, minWidth: MAP_SIZE, minHeight: MAP_SIZE }}>

            {/* Fine grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(to right, rgba(171,212,158,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(171,212,158,0.05) 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`, pointerEvents: 'none', zIndex: 5 }} />
            {/* Coarse grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(to right, rgba(171,212,158,0.1) 2px, transparent 2px), linear-gradient(to bottom, rgba(171,212,158,0.1) 2px, transparent 2px)`, backgroundSize: `${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`, pointerEvents: 'none', zIndex: 5 }} />

            {/* Dashed paths from HOME to all permanent bases and dynamic connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15 }}>
              {PLATFORM_BASES.map(base => {
                const bpos = getPos(base.gridX, base.gridY);
                const bSizing = getEntitySizing('building');
                const halfIcon = (bSizing.iconSize * GRID_SIZE) / 2;
                return (
                  <line key={`path-${base.id}`}
                    x1={homePos.x + GRID_SIZE / 2} y1={homePos.y + GRID_SIZE / 2}
                    x2={bpos.x + halfIcon} y2={bpos.y + halfIcon}
                    stroke="rgba(139,92,246,0.25)" strokeWidth="2" strokeDasharray="8,6"
                  />
                );
              })}
              {mapData.connections.map(conn => {
                const cpos = getPos(conn.gridX, conn.gridY);
                return (
                  <line key={`path-conn-${conn.id}`}
                    x1={homePos.x + GRID_SIZE / 2} y1={homePos.y + GRID_SIZE / 2}
                    x2={cpos.x + GRID_SIZE / 2} y2={cpos.y + GRID_SIZE / 2}
                    stroke="rgba(171,212,158,0.2)" strokeWidth="2" strokeDasharray="8,6"
                  />
                );
              })}
              {mapData.communities.map(com => {
                const cpos = getPos(com.gridX, com.gridY);
                const cSizing = getEntitySizing('community');
                const halfIcon = (cSizing.iconSize * GRID_SIZE) / 2;
                return (
                  <line key={`path-com-${com.id}`}
                    x1={homePos.x + GRID_SIZE / 2} y1={homePos.y + GRID_SIZE / 2}
                    x2={cpos.x + halfIcon} y2={cpos.y + halfIcon}
                    stroke="rgba(139,92,246,0.2)" strokeWidth="2" strokeDasharray="8,6"
                  />
                );
              })}
            </svg>

            {/* Procedural natural elements */}
            {naturalWithPositions.map(comp => {
              const imgPath = getImagePath(comp);
              if (!imgPath) return null;
              return (
                <img key={comp.id} src={imgPath} alt="" decoding="async"
                  style={{ position: 'absolute', left: comp.px, top: comp.py, width: comp.size, height: comp.size, transform: 'translate(-50%,-50%)', zIndex: comp.type.includes('tree') || comp.type === 'palm' ? 35 : 32, objectFit: 'contain', pointerEvents: 'none' }}
                />
              );
            })}

            {/* ── USER HOME BASE ────────────────────────────────────────── */}
            {(() => {
              const { x, y } = getPos(0, 0);
              return (
                <div style={{ position: 'absolute', left: x, top: y, zIndex: 40, overflow: 'visible' }}>
                  <KuraNode data={{ onClick: () => router.push(`/${username}`) }} />
                  <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#151413', color: '#ABD49E', padding: '3px 10px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #ABD49E', letterSpacing: 0.5 }}>
                    {username ? `${username.toUpperCase()}'S BASE` : 'YOUR BASE'}
                  </div>
                </div>
              );
            })()}

            {/* ── PLATFORM BUILDINGS ───────────────────────────────────── */}
            {PLATFORM_BASES.map(base => {
              const { x, y } = getPos(base.gridX, base.gridY);
              const sizing = getEntitySizing('building');
              const pixelSize = sizing.iconSize * GRID_SIZE;
              return (
                <div key={base.id} style={{ position: 'absolute', left: x, top: y, width: pixelSize, height: pixelSize, zIndex: 50, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {base.id === 'moj'       && <MojNode data={{}} />}
                  {base.id === 'ccstudios' && <CCStudiosNode data={{}} />}
                  {base.id === 'luciddojo' && <LucidDojoNode onClick={() => setSelectedBuilding(base)} />}
                  {base.id === 'lucidhigh' && <LucidHighClubNode onClick={() => setSelectedBuilding(base)} />}
                  {(base.id === 'moj' || base.id === 'ccstudios') && null /* popups handled inside node */}
                  <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#151413', color: '#8B5CF6', padding: '3px 10px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #8B5CF6', letterSpacing: 0.5 }}>
                    {base.name}
                  </div>
                </div>
              );
            })}

            {/* ── DYNAMIC USER CONNECTIONS ─────────────────────────────── */}
            {mapData.connections.map(conn => {
              const { x, y } = getPos(conn.gridX, conn.gridY);
              return (
                <div key={conn.id} onClick={() => setSelectedConnection(conn)}
                  style={{ position: 'absolute', left: x, top: y, width: GRID_SIZE, height: GRID_SIZE, backgroundColor: '#FFF212', border: '3px solid #151413', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', overflow: 'visible' }}>
                  <img src="/jungle/User%20Icon.svg" alt={conn.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, borderRadius: '50%', border: '2px solid #151413', backgroundColor: conn.status === 'online' ? '#4ADE80' : '#FCD34D' }} />
                  <div style={{ position: 'absolute', bottom: -26, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#151413', color: '#ABD49E', padding: '2px 8px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #ABD49E' }}>
                    {conn.name}
                  </div>
                </div>
              );
            })}

            {/* ── DYNAMIC API COMMUNITIES ──────────────────────────────── */}
            {mapData.communities.map(com => {
              const { x, y } = getPos(com.gridX, com.gridY);
              const sizing = getEntitySizing('community');
              const iconSize = sizing.iconSize * GRID_SIZE;
              return (
                <div key={com.id} onClick={() => { setSelectedConnection({ id: com.id, name: com.name, type: 'community' }); setDrawerView('community'); setShowList(true); }}
                  style={{ position: 'absolute', left: x, top: y, width: iconSize, height: iconSize, backgroundColor: 'rgba(139,92,246,0.3)', border: '2px solid #8B5CF6', borderRadius: 8, cursor: 'pointer', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                  <div style={{ color: '#8B5CF6', fontSize: 28 }}>⬡</div>
                  <div style={{ position: 'absolute', bottom: -26, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#151413', color: '#8B5CF6', padding: '2px 8px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #8B5CF6' }}>
                    {com.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Building popup */}
        {selectedBuilding && <BuildingPopup base={selectedBuilding} onClose={() => setSelectedBuilding(null)} />}

        {/* Connection dropdown */}
        {selectedConnection && !drawerView.startsWith('community') && (
          <ConnectionDropdown conn={selectedConnection} onClose={() => setSelectedConnection(null)} />
        )}

        {mapLoading && (
          <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', color: '#ABD49E', fontSize: 11, backgroundColor: '#151413', border: '1px solid rgba(171,212,158,0.3)', padding: '6px 14px', letterSpacing: 1 }}>
            LOADING MAP...
          </div>
        )}

        {/* Floating Kura button */}
        <button
          onClick={() => setKuraOpen(v => !v)}
          style={{ position: 'fixed', bottom: 92, right: 20, width: 48, height: 48, borderRadius: '50%', backgroundColor: '#ABD49E', border: '2px solid #151413', cursor: 'pointer', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', fontFamily: 'CodeSaver, monospace', flexShrink: 0 }}
          aria-label="Open Kura"
        >
          <span style={{ fontSize: 20, color: '#151413', lineHeight: 1 }}>✦</span>
        </button>

        {/* Kura chat panel (placeholder — interface TBD) */}
        {kuraOpen && (
          <div style={{ position: 'fixed', bottom: 150, right: 20, width: 300, backgroundColor: '#151413', border: '1px solid #ABD49E', zIndex: 300, fontFamily: 'CodeSaver, monospace', boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ backgroundColor: '#ABD49E', color: '#151413', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
              <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>KURA</span>
              <button onClick={() => setKuraOpen(false)} style={{ background: 'none', border: 'none', color: '#151413', fontSize: 20, cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 16, color: 'rgba(171,212,158,0.5)', fontSize: 12, lineHeight: 1.8, minHeight: 80 }}>
              Your Lucid companion is coming soon.
            </div>
          </div>
        )}

        {/* Drawer */}
        <Drawer title="Virtual Realm" showList={showList} onToggleList={() => setShowList(v => !v)}>
          {renderDrawerContent()}
        </Drawer>
      </div>

      <style jsx global>{`
        .jungle-map-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .jungle-map-container::-webkit-scrollbar-track { background: #151413; }
        .jungle-map-container::-webkit-scrollbar-thumb { background: #ABD49E; border-radius: 4px; }
      `}</style>
    </>
  );
}

// ── Lucid Dojo node ─────────────────────────────────────────────────────────
function LucidDojoNode({ onClick }) {
  return (
    <div onClick={onClick}
      style={{ width: 220, height: 200, backgroundColor: '#151413', border: '2px solid #ABD49E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: 52, marginBottom: 8 }}>⛩</span>
      <p style={{ color: '#ABD49E', fontWeight: 700, fontSize: 11, letterSpacing: 3, fontFamily: 'CodeSaver, monospace' }}>LUCID DOJO</p>
    </div>
  );
}

// ── Lucid High Club node ─────────────────────────────────────────────────────
function LucidHighClubNode({ onClick }) {
  return (
    <div onClick={onClick}
      style={{ width: 220, height: 200, background: 'linear-gradient(135deg, #1a0a2e, #2d1b69)', border: '2px solid #8B5CF6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: 52, marginBottom: 8 }}>🌙</span>
      <p style={{ color: '#C4B5FD', fontWeight: 700, fontSize: 11, letterSpacing: 3, fontFamily: 'CodeSaver, monospace' }}>LUCID HIGH CLUB</p>
    </div>
  );
}
