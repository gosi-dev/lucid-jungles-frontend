// pages/[username].js — Entry Preview / User Base
// Design reference: /Frames/User-base/USER BASE/ (frames 2–11)
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import EventCard from '../components/EventCard';
import ProductsCard from '../components/ProductsCard';


const DESK_ITEMS = ['JOURNAL', 'RADIO', 'PORTFOLIO', 'SLUM BOOK'];

// Dream Desk asset SVGs
// Assets in: /public/Frames/User-base/USER BASE/Dream Desk assets/
const DD = '/Frames/User-base/USER%20BASE/Dream%20Desk%20assets';
const DESK = {
  TABLE:     `${DD}/Table.svg`,
  CHAIR:     `${DD}/Chair.svg`,
  COMPUTER:  `${DD}/Computer.svg`,
  JOURNAL:   `${DD}/Journal%202.svg`,
  RADIO:     `${DD}/Radio.svg`,
  PORTFOLIO: `${DD}/Portfolio.svg`,
  SLUMBOOK:  `${DD}/Slumbook.svg`,
  BOOKPILE:  `${DD}/Book%20Pile.svg`,
  BOXES:     `${DD}/Group%20of%20Boxes.svg`,
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
      <path d="M15 6.5H1M7 1L1 6.5L7 12" stroke="#ABD49E" strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <path d="M1 9L11 1L21 9V19H15V13H7V19H1V9Z" stroke="#ABD49E" strokeWidth="1.5" strokeLinejoin="miter"/>
    </svg>
  );
}
function IconTicket() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      <rect x="1" y="1" width="22" height="16" rx="1" stroke="#ABD49E" strokeWidth="1.5"/>
      <circle cx="12" cy="9" r="2.5" stroke="#ABD49E" strokeWidth="1.2"/>
    </svg>
  );
}
function IconStore() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M1 9H21V21H1V9Z" stroke="#ABD49E" strokeWidth="1.5"/>
      <path d="M1 9L4 2H18L21 9" stroke="#ABD49E" strokeWidth="1.5" strokeLinejoin="miter"/>
      <rect x="8" y="14" width="6" height="7" stroke="#ABD49E" strokeWidth="1.2"/>
    </svg>
  );
}
function IconQR() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="2" y="2" width="9" height="9" stroke="#ABD49E" strokeWidth="1.5"/>
      <rect x="5.5" y="5.5" width="2" height="2" fill="#ABD49E"/>
      <rect x="15" y="2" width="9" height="9" stroke="#ABD49E" strokeWidth="1.5"/>
      <rect x="18.5" y="5.5" width="2" height="2" fill="#ABD49E"/>
      <rect x="2" y="15" width="9" height="9" stroke="#ABD49E" strokeWidth="1.5"/>
      <rect x="5.5" y="18.5" width="2" height="2" fill="#ABD49E"/>
      <rect x="15" y="15" width="3" height="3" fill="#ABD49E"/>
      <rect x="20" y="15" width="3" height="3" fill="#ABD49E"/>
      <rect x="15" y="20" width="3" height="3" fill="#ABD49E"/>
      <rect x="20" y="20" width="3" height="3" fill="#ABD49E"/>
    </svg>
  );
}
function IconSmiley() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" stroke="#ABD49E" strokeWidth="1.5"/>
      <circle cx="8" cy="9" r="1.5" fill="#ABD49E"/>
      <circle cx="14" cy="9" r="1.5" fill="#ABD49E"/>
      <path d="M7 13.5C7.8 15.8 14.2 15.8 15 13.5" stroke="#ABD49E" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <path d="M0 7H18M12 1L18 7L12 13" stroke="#ABD49E" strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );
}
function IconVolume({ color = '#101010' }) {
  return (
    <svg width="19" height="17" viewBox="0 0 19 17" fill="none">
      <path d="M8 1L4 5H1V12H4L8 16V1Z" fill={color}/>
      <path d="M11.5 4C13.2 5.5 14 7 14 8.5C14 10 13.2 11.5 11.5 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <line x1="0" y1="1" x2="18" y2="1" stroke="#ABD49E" strokeWidth="1.5"/>
      <line x1="0" y1="7" x2="18" y2="7" stroke="#ABD49E" strokeWidth="1.5"/>
      <line x1="0" y1="13" x2="18" y2="13" stroke="#ABD49E" strokeWidth="1.5"/>
    </svg>
  );
}
function IconClose({ color = '#101010' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="1" y1="1" x2="13" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="square"/>
      <line x1="13" y1="1" x2="1" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );
}
function IconChevron({ up = false }) {
  return (
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
      <path d={up ? 'M1 6L6 1L11 6' : 'M1 1L6 6L11 1'} stroke="#101010" strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );
}

// ─── Status Bar ────────────────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div style={{ height: 44, background: '#151413', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 16 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#E3E3E3' }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="#E3E3E3">
          <rect x="0" y="8" width="3" height="4"/><rect x="4.5" y="5" width="3" height="7"/>
          <rect x="9" y="2" width="3" height="10"/><rect x="13.5" y="0" width="3" height="12"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <circle cx="8" cy="11" r="1.2" fill="#E3E3E3"/>
          <path d="M5.5 8.5C6.3 7.7 7.1 7.3 8 7.3C8.9 7.3 9.7 7.7 10.5 8.5" stroke="#E3E3E3" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3 6C4.5 4.5 6.2 3.7 8 3.7C9.8 3.7 11.5 4.5 13 6" stroke="#E3E3E3" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M0.5 3.5C2.8 1.3 5.3 0 8 0C10.7 0 13.2 1.3 15.5 3.5" stroke="#E3E3E3" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 18, height: 9, border: '1.4px solid #E3E3E3', borderRadius: 2, padding: 1 }}>
            <div style={{ width: '75%', height: '100%', background: '#E3E3E3', borderRadius: 1 }}/>
          </div>
          <div style={{ width: 2, height: 5, background: '#E3E3E3', marginLeft: 1, borderRadius: 1 }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home',   label: 'HOME',   Icon: IconHome },
    { id: 'events', label: 'EVENTS', Icon: IconTicket },
    { id: 'store',  label: 'STORE',  Icon: IconStore },
  ];
  return (
    <div style={{ display: 'flex', height: 48, background: '#151413', flexShrink: 0 }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: active ? '0 0 50%' : '1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active ? '#ABD49E' : 'transparent',
            border: 'none', outline: 'none', cursor: 'pointer',
            transition: 'flex 0.2s ease, background 0.2s ease',
          }}>
            {active
              ? <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#101010', letterSpacing: '0.1em' }}>{label}</span>
              : <Icon />
            }
          </button>
        );
      })}
    </div>
  );
}

// ─── Map Background ────────────────────────────────────────────────────────────
// Renders static jungle trees at percentage positions of the frozen canvas
// (cw × ch). Positions are computed once from the frozen dimensions and never
// change on viewport resize — the canvas itself is frozen, so the trees are
// frozen with it.
function MapBackground({ cw, ch }) {
  // Each entry: [leftFrac, topFrac, widthFrac, src, zIndex]
  const TREES = [
    // ── Top band ──────────────────────────────────────────────────────────────
    [-0.05, -0.07, 0.30, '/jungle/Property%201=A.svg',           3],
    [ 0.22, -0.08, 0.19, '/jungle/Property%201=A%20(1).svg',     3],
    [ 0.37, -0.08, 0.22, '/jungle/Property%201=Palm%20Tree.svg', 3],
    [ 0.56, -0.08, 0.19, '/jungle/Property%201=B%20(1).svg',     3],
    [ 0.73, -0.07, 0.30, '/jungle/Property%201=B.svg',           3],
    // ── Left column ───────────────────────────────────────────────────────────
    [-0.08,  0.13, 0.27, '/jungle/Property%201=A.svg',           3],
    [-0.06,  0.28, 0.18, '/jungle/Property%201=A%20(1).svg',     3],
    [-0.05,  0.44, 0.21, '/jungle/Property%201=Shrubs.svg',      2],
    [-0.06,  0.58, 0.18, '/jungle/Property%201=B%20(1).svg',     3],
    [-0.06,  0.72, 0.25, '/jungle/Property%201=B.svg',           3],
    // ── Right column ──────────────────────────────────────────────────────────
    [ 0.78,  0.11, 0.28, '/jungle/Property%201=B.svg',           3],
    [ 0.83,  0.25, 0.17, '/jungle/Property%201=B%20(1).svg',     3],
    [ 0.84,  0.42, 0.18, '/jungle/Property%201=Shrubs.svg',      2],
    [ 0.82,  0.57, 0.17, '/jungle/Property%201=A%20(1).svg',     3],
    [ 0.77,  0.70, 0.25, '/jungle/Property%201=A.svg',           3],
    // ── Bottom band ───────────────────────────────────────────────────────────
    [-0.04,  0.82, 0.27, '/jungle/Property%201=A.svg',           3],
    [ 0.19,  0.86, 0.18, '/jungle/Property%201=A%20(1).svg',     3],
    [ 0.38,  0.87, 0.21, '/jungle/Property%201=Palm%20Tree.svg', 3],
    [ 0.61,  0.86, 0.18, '/jungle/Property%201=B%20(1).svg',     3],
    [ 0.72,  0.82, 0.27, '/jungle/Property%201=B.svg',           3],
    // ── Interior accents ──────────────────────────────────────────────────────
    [ 0.12,  0.38, 0.12, '/jungle/Property%201=Rocks.svg',       2],
    [ 0.73,  0.33, 0.10, '/jungle/Property%201=Flowers.svg',     2],
    [ 0.09,  0.60, 0.14, '/jungle/Property%201=Flowers.svg',     2],
    [ 0.75,  0.58, 0.12, '/jungle/Property%201=Rocks.svg',       2],
  ];

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {/* Faint grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(to right,rgba(171,212,158,0.06) 1px,transparent 1px),
                          linear-gradient(to bottom,rgba(171,212,158,0.06) 1px,transparent 1px)`,
        backgroundSize: '80px 80px',
        zIndex: 1,
      }}/>
      {TREES.map(([lf, tf, wf, src, z], i) => (
        <img
          key={i} src={src} alt=""
          style={{
            position: 'absolute',
            left: lf * cw, top: tf * ch,
            width: wf * cw, height: 'auto',
            zIndex: z,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.85))',
          }}
        />
      ))}
    </div>
  );
}

// ─── Desk Scene ────────────────────────────────────────────────────────────────
// Exact replica of 8.svg desk arrangement (top-down perspective).
// Coordinate origin: top-left. y=0 = back of desk (far from viewer).
// Layout:
//   z=2  Table (top:0, w=300) — desk surface
//   z=3  Computer (top:0, right:10) — back-right on table
//   z=3  Portfolio (top:20, left:12) — left of table, rotated -8°
//   z=4  Journal (top:30, left:110) — centre of table, slightly in front of portfolio
//   z=3  Book Pile (top:100, left:18) — floor, front-left of desk
//   z=3  Chair (top:140, left:128) — floor, front-centre-right, rotated -12°
function DeskScene({ activeDeskItem, onDeskClick }) {
  return (
    <div
      onClick={onDeskClick}
      style={{ position: 'relative', width: 310, height: 255, cursor: onDeskClick ? 'pointer' : 'default' }}
    >
      {/* Table surface — full width, back of scene */}
      <img src={DESK.TABLE} alt="" aria-hidden="true" style={{
        position: 'absolute', width: 300, top: 0, left: 5,
        zIndex: 2, pointerEvents: 'none',
      }}/>

      {/* Computer — back-right of table (monitor at back, keyboard at front) */}
      <img src={DESK.COMPUTER} alt="" aria-hidden="true" style={{
        position: 'absolute', height: 112, width: 'auto', top: 0, right: 10,
        zIndex: 3, pointerEvents: 'none',
      }}/>

      {/* Portfolio — left of table, slight counter-clockwise tilt */}
      <img src={DESK.PORTFOLIO} alt="" aria-hidden="true" style={{
        position: 'absolute', height: 92, width: 'auto', top: 18, left: 12,
        zIndex: 3, pointerEvents: 'none',
        transform: 'rotate(-8deg)', transformOrigin: 'center bottom',
      }}/>

      {/* Journal — centre of table, slightly in front of portfolio */}
      <img src={DESK.JOURNAL} alt="" aria-hidden="true" style={{
        position: 'absolute', height: 80, width: 'auto', top: 28, left: 110,
        zIndex: 4, pointerEvents: 'none',
      }}/>

      {/* Book pile — front-left floor (in front of desk, closer to viewer) */}
      <img src={DESK.BOOKPILE} alt="" aria-hidden="true" style={{
        position: 'absolute', height: 54, width: 'auto', top: 20, left: 18,
        zIndex: 3, pointerEvents: 'none',
      }}/>

      {/* Chair — front-centre-right floor, slight rotation matching reference */}
      <img src={DESK.CHAIR} alt="" aria-hidden="true" style={{
        position: 'absolute', width: 88, top: 100, left: 128,
        zIndex: 1, pointerEvents: 'none',
        transform: 'rotate(-12deg)', transformOrigin: 'center center',
      }}/>
    </div>
  );
}

// ─── Dream Desk Popup ─────────────────────────────────────────────────────────
// Triggered when user taps the desk. Exact replica of frame 7 popup:
//   Header:    135×32  #ABD49E   "DREAM DESK ▼"   (x=199, y=386)
//   JOURNAL:   135×30  #101010   (y=418, gap=5)
//   RADIO:     135×38  #101010   (y=453, gap=5)
//   PORTFOLIO: 135×38  #101010   (y=496, gap=5)
//   SLUM BOOK: 135×38  #101010   (y=539)
// Backdrop overlay closes popup on outside click.
function DreamDeskPopup({ activeDeskItem, setActiveDeskItem, onClose, style = {} }) {
  const rows = [
    { item: 'JOURNAL',   h: 30 },
    { item: 'RADIO',     h: 38 },
    { item: 'PORTFOLIO', h: 38 },
    { item: 'SLUM BOOK', h: 38 },
  ];
  return (
    <div style={{ width: 135, ...style }}>
      {/* Header */}
      <div style={{
        height: 32, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', paddingInline: 10,
        background: '#ABD49E',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#101010', letterSpacing: '0.08em' }}>DREAM DESK</span>
        <span style={{ fontSize: 9, color: '#101010' }}>▼</span>
      </div>
      {/* Items — 5px gap between each row (shows dark bg behind) */}
      {rows.map(({ item, h }) => (
        <button
          key={item}
          onClick={() => { setActiveDeskItem(item); onClose(); }}
          style={{
            display: 'block', width: '100%', height: h,
            marginTop: 5,
            background: '#101010', border: '1px solid rgba(171,212,158,0.18)',
            color: '#ABD49E', fontFamily: 'monospace', fontSize: 10,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            textAlign: 'left', paddingInline: 10, cursor: 'pointer',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ─── Home Scene ───────────────────────────────────────────────────────────────
// Frozen-canvas approach: captures the container size ONCE on mount, then
// renders everything (jungle + desk + popup) inside a fixed-size div that is
// always centred in the container. When the browser window is resized, the
// container clips or expands around the fixed canvas — no reflow, nothing moves.
function HomeScene({ activeDeskItem, setActiveDeskItem }) {
  const [deskPopupOpen, setDeskPopupOpen] = useState(false);
  const containerRef = useRef(null);
  const [frozen, setFrozen] = useState(null); // { w, h } — captured once

  useEffect(() => {
    const el = containerRef.current;
    if (el && !frozen) setFrozen({ w: el.offsetWidth, h: el.offsetHeight });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#151413' }}
    >
      {frozen && (
        // One unified frozen canvas — centred, fixed size, never resizes.
        // Clicking anywhere on it (except popup) closes any open popup.
        <div
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: frozen.w, height: frozen.h,
          }}
          onClick={() => setDeskPopupOpen(false)}
        >
          <MapBackground cw={frozen.w} ch={frozen.h} />

          {/* Dream desk — centred in the frozen canvas */}
          <div
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 4 }}
            onClick={e => { e.stopPropagation(); setDeskPopupOpen(true); }}
          >
            <DeskScene activeDeskItem={activeDeskItem} onDeskClick={null} />
          </div>

          {/* Dream Desk popup — to the right of the desk */}
          {deskPopupOpen && (
            <div
              style={{ position: 'absolute', left: `calc(50% + 170px)`, top: `calc(50% - 100px)`, zIndex: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <DreamDeskPopup
                activeDeskItem={activeDeskItem}
                setActiveDeskItem={setActiveDeskItem}
                onClose={() => setDeskPopupOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
// Uses the shared EventCard component designed to spec.
const MOCK_EVENTS = [
  { _id: '1', coverImage: null, title: 'ENTERTAINMENT WEEK AFRICA 2025', location: 'LANDMARK CENTER, VI LAGOS', date: '2025-11-22', time: '10:00AM', price: 'FREE', tags: ['PARTY', 'CONFERENCE', 'TRADE FAIR'] },
  { _id: '2', coverImage: null, title: 'LUCID JUNGLES LAUNCH PARTY',    location: 'ART TECH HUB, IKEJA',         date: '2025-12-15', time: '8:00PM',  price: '₦5,000', tags: ['MUSIC', 'NETWORKING', 'ART'] },
];

function EventsTab({ events }) {
  const items = (events && events.length) ? events : MOCK_EVENTS;
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#151413', paddingTop: 8 }}>
      {items.map(ev => <EventCard key={ev._id} event={ev}/>)}
    </div>
  );
}

// ─── Store Tab ────────────────────────────────────────────────────────────────
// Uses the shared ProductsCard component designed to spec.
const MOCK_PRODUCTS = [
  { _id: '1', image: null, title: 'Porsche 911 Mod',         description: 'Modified Classic Porsche 911', discount: '10% Off',   price: '₦300,000,000', time: '20 DAYS',        tags: ['CUSTOM', 'VEHICLES'] },
  { _id: '2', image: null, title: 'Handcrafted Leather Bag', description: 'Premium leather, made to order', discount: null,        price: '₦45,000',       time: 'MADE TO ORDER', tags: ['FASHION', 'HANDMADE'] },
  { _id: '3', image: null, title: 'Digital Art Print',       description: 'High-res digital artwork',       discount: null,        price: '₦12,000',       time: 'INSTANT DL',    tags: ['ART', 'DIGITAL'] },
];

function StoreTab({ items }) {
  const products = (items && items.length) ? items : MOCK_PRODUCTS;
  if (!products || products.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#151413' }}>
        <p style={{ fontFamily: 'Averia Sans Libre, sans-serif', fontSize: 14, color: '#ABD49E', textAlign: 'center', padding: '0 32px' }}>
          Available Products and Services
        </p>
      </div>
    );
  }
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#151413', paddingTop: 4 }}>
      <p style={{ padding: '8px 16px 6px', fontFamily: 'monospace', fontSize: 10, color: '#ABD49E', letterSpacing: '0.05em' }}>
        Available Products and Services
      </p>
      {products.map(p => <ProductsCard key={p._id} product={p}/>)}
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
// Frame 5/6: message thread that replaces the profile drawer content
function ChatPanel({ profile, onClose }) {
  const [message, setMessage] = useState('');
  const mockMessages = [
    { id: 1, them: true,  text: 'Hiya Chukwuka, was a pleasure meeting you today.' },
    { id: 2, them: false, text: "Fam! I'm really glad I came outside, and scanned that code." },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#151413' }}>
      {/* Chevron handle */}
      <div style={{ height: 18, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 32, height: 3, background: '#ABD49E' }}/>
      </div>
      {/* Header */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, paddingInline: 12, background: '#ABD49E', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: '#101010', flexShrink: 0, overflow: 'hidden' }}>
          {profile.avatar && <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
        </div>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#101010', fontWeight: 700, letterSpacing: '0.05em' }}>{profile.displayName}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <IconClose color="#101010"/>
        </button>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mockMessages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: msg.them ? 'flex-start' : 'flex-end' }}>
            {msg.them && <svg width="6" height="8" viewBox="0 0 6 8" style={{ flexShrink: 0, marginRight: 4 }}><path d="M6 4L0 0V8L6 4Z" fill="#ABD49E"/></svg>}
            <div style={{
              maxWidth: '84%', padding: '8px 12px',
              background: msg.them ? '#ABD49E' : 'transparent',
              border: msg.them ? 'none' : '1px solid #ABD49E',
              fontFamily: 'Averia Sans Libre, sans-serif', fontSize: 13,
              color: msg.them ? '#101010' : '#E3E3E3', lineHeight: 1.45,
            }}>{msg.text}</div>
            {!msg.them && <svg width="6" height="8" viewBox="0 0 6 8" style={{ flexShrink: 0, marginLeft: 4 }}><path d="M0 4L6 0V8L0 4Z" fill="#ABD49E"/></svg>}
          </div>
        ))}
      </div>
      {/* Input */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(171,212,158,0.25)', flexShrink: 0 }}>
        <input value={message} onChange={e => setMessage(e.target.value)} style={{
          flex: 1, height: 44, padding: '0 12px', background: 'transparent',
          border: 'none', outline: 'none', color: '#ABD49E', fontFamily: 'monospace', fontSize: 12,
        }}/>
        <button style={{
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', borderLeft: '1px solid rgba(171,212,158,0.25)', cursor: 'pointer',
        }}>
          <IconSend/>
        </button>
      </div>
    </div>
  );
}

// ─── Profile Drawer ───────────────────────────────────────────────────────────
// Collapsed (64px): green strip — photo + name + chevron
// Open (360px): avatar 97×97, name, stats, XP bar, bio, action button
// Chat mode: ChatPanel replaces drawer content
function ProfileDrawer({ open, onToggle, onClose, profile, connectionState, onConnect, chatOpen, onChatToggle }) {

  if (chatOpen) {
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 380, background: '#151413', zIndex: 200 }}>
        <ChatPanel profile={profile} onClose={onChatToggle}/>
      </div>
    );
  }

  const isPending   = connectionState === 'pending';
  const isConnected = connectionState === 'connected';

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#151413', zIndex: 200 }}>
      {/* Collapsed strip — always visible */}
      <button onClick={onToggle} style={{
        width: '100%', height: 64, display: 'flex', alignItems: 'center',
        paddingInline: 12, gap: 12, background: '#ABD49E',
        border: 'none', cursor: 'pointer', position: 'relative',
      }}>
        {/* Chevron centered at top */}
        <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)' }}>
          <IconChevron up={open}/>
        </div>
        {/* Photo — 50px, fills most of strip height */}
        <div style={{ width: 50, height: 50, background: '#101010', flexShrink: 0, overflow: 'hidden', marginTop: 10 }}>
          {profile.avatar && <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
        </div>
        {/* Name */}
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#101010', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 10, textAlign: 'left' }}>
          {profile.displayName}
        </span>
        {/* X button — closes/collapses drawer */}
        <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ marginTop: 10, display: 'flex', alignItems: 'center', padding: 4, cursor: 'pointer' }}>
          <IconClose color="#101010"/>
        </div>
      </button>

      {open && (
        <div style={{ background: '#151413' }}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px 0' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <IconClose color="#ABD49E"/>
            </button>
          </div>

          {/* Avatar (97×97) + name + stats */}
          <div style={{ display: 'flex', gap: 14, padding: '0 16px 14px' }}>
            <div style={{ width: 97, height: 97, background: '#ABD49E', flexShrink: 0, overflow: 'hidden' }}>
              {profile.avatar && <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
              <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#ABD49E', fontWeight: 700, letterSpacing: '0.05em' }}>
                {profile.displayName}
              </p>
              <div style={{ display: 'flex' }}>
                {[
                  { value: profile.moments,    label: 'MOMENTS' },
                  { value: profile.connections, label: 'CONNECTIONS' },
                  { value: profile.followers,   label: 'FOLLOWERS' },
                ].map(({ value, label }, i) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(171,212,158,0.3)' : 'none' }}>
                    <p style={{ fontFamily: 'monospace', fontSize: 14, color: '#ABD49E', fontWeight: 700 }}>{value}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 7, color: '#ABD49E', letterSpacing: '0.05em', marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* XP bar — 149px green (rank) + 206px dark (XP count) = 355px total @ x=28 */}
          {/* Implemented as flex with ratio matching frame measurements */}
          <div style={{ margin: '0 16px 12px', display: 'flex', border: '1px solid rgba(171,212,158,0.25)' }}>
            <div style={{ flex: profile.xpCurrent, height: 28, display: 'flex', alignItems: 'center', paddingInline: 8, background: '#ABD49E', overflow: 'hidden' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#101010', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
                {profile.xpRank}
              </span>
            </div>
            <div style={{ flex: profile.xpMax - profile.xpCurrent, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingInline: 8, background: '#151413' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#ABD49E', letterSpacing: '0.06em' }}>
                {profile.xpCurrent}/{profile.xpMax} XP
              </span>
            </div>
          </div>

          {/* Bio */}
          <div style={{ margin: '0 16px 14px' }}>
            <p style={{ fontFamily: 'Averia Sans Libre, sans-serif', fontSize: 13, color: '#E3E3E3', lineHeight: 1.55 }}>
              {profile.bio}
            </p>
          </div>

          {/* Action button — 380×30 in frame, full content-width */}
          <div style={{ padding: '0 16px 16px' }}>
            <button onClick={!isPending && !isConnected ? onConnect : undefined} style={{
              width: '100%', height: 30,
              background: isPending || isConnected ? 'transparent' : '#ABD49E',
              border: isPending || isConnected ? '1px solid rgba(171,212,158,0.5)' : 'none',
              color: isPending || isConnected ? '#ABD49E' : '#101010',
              fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em',
              cursor: isPending ? 'default' : 'pointer',
            }}>
              {isPending ? 'REQUEST SENT' : isConnected ? 'CONNECTED' : 'CONNECT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Connected View — Full-screen immersive map ───────────────────────────────
// Same frozen-canvas pattern as HomeScene but full-screen (100dvh).
// Non-scrolling UI overlays (border frame, volume, menu, back button) are
// positioned in the outer container — they never enter the frozen canvas.
function ConnectedView({ profile }) {
  const router = useRouter();
  const [activeDeskItem, setActiveDeskItem] = useState(null);
  const [deskPopupOpen, setDeskPopupOpen] = useState(false);
  const containerRef = useRef(null);
  const [frozen, setFrozen] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el && !frozen) setFrozen({ w: el.offsetWidth, h: el.offsetHeight });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // Outer container — full screen, overflow hidden
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#151413' }}>

      {/* Frozen jungle canvas */}
      {frozen && (
        <div
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: frozen.w, height: frozen.h,
          }}
          onClick={() => setDeskPopupOpen(false)}
        >
          <MapBackground cw={frozen.w} ch={frozen.h} />

          {/* Dream desk */}
          <div
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 4 }}
            onClick={e => { e.stopPropagation(); setDeskPopupOpen(true); }}
          >
            <DeskScene activeDeskItem={activeDeskItem} onDeskClick={null} />
          </div>

          {deskPopupOpen && (
            <div
              style={{ position: 'absolute', left: `calc(50% + 170px)`, top: `calc(50% - 100px)`, zIndex: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <DreamDeskPopup
                activeDeskItem={activeDeskItem}
                setActiveDeskItem={setActiveDeskItem}
                onClose={() => setDeskPopupOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── UI overlays — live in the outer container, never scroll ── */}

      {/* Inner border frame */}
      <div style={{
        position: 'absolute', top: 13, left: 13, right: 13, bottom: 13,
        border: '1px solid rgba(171,212,158,0.1)', pointerEvents: 'none', zIndex: 2,
      }}/>

      {/* Desktop: Base name label */}
      <div className="hidden md:flex" style={{
        position: 'absolute', top: 52, left: 77, width: 270, height: 45,
        background: '#ABD49E', alignItems: 'center', paddingInline: 14, gap: 8, zIndex: 10,
      }}>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#101010', fontWeight: 700, letterSpacing: '0.05em' }}>
          {profile.displayName}&apos;S BASE
        </span>
        <span style={{ fontSize: 9, color: '#101010' }}>▼</span>
      </div>

      {/* Top-right: volume + menu */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 10 }}>
        <button style={{ width: 37, height: 37, background: '#ABD49E', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
          <IconVolume color="#101010"/>
        </button>
        <button style={{ width: 34, height: 34, background: '#101010', border: '1px solid rgba(171,212,158,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconMenu/>
        </button>
      </div>

      {/* Desktop: bottom-right action icons */}
      <div className="hidden md:flex" style={{ position: 'absolute', bottom: 60, right: 16, flexDirection: 'column', gap: 4, zIndex: 10 }}>
        <button style={{ width: 44, height: 44, background: '#101010', border: '1px solid #ABD49E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconSmiley/>
        </button>
        <button style={{ width: 44, height: 44, background: '#101010', border: '1px solid rgba(171,212,158,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="2" x2="9" y2="16" stroke="#ABD49E" strokeWidth="1.5"/><line x1="2" y1="9" x2="16" y2="9" stroke="#ABD49E" strokeWidth="1.5"/></svg>
        </button>
        <button style={{ width: 44, height: 44, background: '#101010', border: '1px solid rgba(171,212,158,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none"><rect x="3" y="7" width="12" height="13" stroke="#ABD49E" strokeWidth="1.5"/><path d="M6 7V5H12V7" stroke="#ABD49E" strokeWidth="1.5"/></svg>
        </button>
      </div>

      {/* Back */}
      <button onClick={() => router.back()} style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 10,
        background: 'rgba(13,16,9,0.80)', border: '1px solid rgba(171,212,158,0.4)',
        padding: '8px 14px', display: 'flex', alignItems: 'center', cursor: 'pointer',
      }}>
        <IconBack/>
      </button>
    </div>
  );
}
// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UserBase() {
  const router = useRouter();
  const { username } = router.query;
  const currentUser = useSelector(state => state.register);

  const [activeTab, setActiveTab]             = useState('home');
  const [drawerOpen, setDrawerOpen]           = useState(false);
  const [chatOpen, setChatOpen]               = useState(false);
  const [activeDeskItem, setActiveDeskItem]   = useState(null);
  const [connectionState, setConnectionState] = useState('stranger'); // stranger | pending | connected

  const profile = {
    username:    username || '',
    displayName: (username || 'USER').toUpperCase(),
    avatar:      null,
    bio:         'Exploring creativity, technology, and human connection through immersive experiences across events, art, and play.',
    moments:     300,
    connections: 1279,
    followers:   '29.7K',
    xpRank:      'NOVICE EXPLORER',
    xpCurrent:   44,
    xpMax:       100,
    isPublic:    true,
  };

  if (connectionState === 'connected') {
    return (
      <>
        <Head><title>{profile.displayName}&apos;s Base</title></Head>
        <ConnectedView profile={profile}/>
      </>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', width: '100%',
      background: '#151413', overflow: 'hidden',
    }}>
      <Head><title>Entry Preview — {profile.displayName}</title></Head>

      {/* Header */}
      <div style={{ height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', paddingInline: 16, background: '#151413', position: 'relative' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }} aria-label="Back">
          <IconBack/>
        </button>
        <span style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'monospace', fontSize: 14, color: '#ABD49E',
          letterSpacing: '0.06em',
        }}>
          Entry Preview
        </span>
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab}/>

      {/* Divider */}
      <div style={{ height: 1, background: '#ABD49E', flexShrink: 0 }}/>

      {/* Content — flex-1, position:relative so QR/Smiley are viewport-anchored */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'home'   && <HomeScene activeDeskItem={activeDeskItem} setActiveDeskItem={setActiveDeskItem}/>}
        {activeTab === 'events' && <EventsTab/>}
        {activeTab === 'store'  && <StoreTab/>}

        {/* QR / Smiley — float over the map but DON'T live inside the scroll container */}
        {activeTab === 'home' && (
          <>
            <button aria-label="Share QR code" style={{
              position: 'absolute', right: 0, top: '48%',
              width: 54, height: 54, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            }}>
              <IconQR/>
            </button>
            <button aria-label="Profile" style={{
              position: 'absolute', right: 0, top: 'calc(48% + 54px)',
              width: 52, height: 52, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            }}>
              <IconSmiley/>
            </button>
          </>
        )}

        {/* Floating smiley on events/store */}
        {(activeTab === 'events' || activeTab === 'store') && (
          <button style={{
            position: 'absolute', bottom: 14, right: 14, width: 38, height: 38,
            background: '#151413', border: '1px solid #ABD49E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 5,
          }}>
            <IconSmiley/>
          </button>
        )}
      </div>

      <ProfileDrawer
        open={drawerOpen}
        onToggle={() => { setDrawerOpen(d => !d); setChatOpen(false); }}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        connectionState={connectionState}
        onConnect={() => setConnectionState('pending')}
        chatOpen={chatOpen}
        onChatToggle={() => setChatOpen(c => !c)}
      />
    </div>
  );
}
