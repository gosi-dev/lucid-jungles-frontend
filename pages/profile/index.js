// DREAMING — Digital Plane (DREAM WORLD map)
//
// Ported verbatim from CONSOLIDATED/client/pages/dreaming.js. This is the *dream world*
// map and the counterpart to the real-world map on `/`. Faithful replica of OG's 2D
// jungle architecture:
//   - GRID_SIZE = 77px (Figma spec)
//   - Procedural jungle elements (big-trees, small-trees, palms, shrubs, rocks, flowers)
//   - Building nodes (CCStudios → /cappuccinostudiox, MOJ → /moj, Dojo → /dojo)
//   - User nodes (Bonzo → /bonzo, etc.)
//   - Kura node (home base → /kura)
//   - SVG connection paths from Kura to all entities
//   - HoverCardPro popups on entities (click-to-reveal + CTA)
//   - 3-state bottom drawer: CONNECTIONS / MISSIONS / FANBASES, each with filters
//
// Token note: CONSOLIDATED's tailwind maps primary=#151413 (charcoal) and
// secondary=#ABD49E (sage) — the exact inverse of rebuilt's config. The handful of
// colour classes in the node components were swapped (primary<->secondary) when
// porting so the rendered result is identical to CONSOLIDATED. The rest of the file
// already uses literal hex, which is token-agnostic and left untouched.
//
// The unused `Drawer` import from CONSOLIDATED was dropped: this page builds its own
// always-visible 3-state drawer inline (it needs tab state, not the simple list drawer).
import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaCaretRight, FaUserFriends, FaCrosshairs, FaUsers, FaChevronUp, FaChevronDown } from 'react-icons/fa';

// ─── Grid constants — 77px per grid cell ───
const GRID_SIZE = 77;

// ─── Entity placements on the grid ───
const MAP_ENTITIES = [
  { id: 'kura',      type: 'user',     gridX: 0,   gridY: 0,   name: 'YOUR KURA',        href: '/kura' },
  { id: 'bonzo',     type: 'user',     gridX: -3,  gridY: 7,   name: 'BONZO',            href: '/bonzo' },
  { id: 'moj',       type: 'community', gridX: -12, gridY: -5,  name: 'OLD SECRETARIAT',  href: '/moj' },
  { id: 'ccstudios', type: 'community', gridX: 8,   gridY: 3,   name: 'CAPPUCCINO STUDIOX', href: '/cappuccinostudiox' },
  { id: 'dojo',      type: 'community', gridX: 14,  gridY: -8,  name: "BONZO'S DOJO",     href: '/dojo' },

];

// ─── Entity sizing — communities get 5x5 (25 blocks), users get 1x1 ───
const getEntitySizing = (type) => {
  if (type === 'building') return { iconSize: 5, totalSpace: 5 };
  if (type === 'community') return { iconSize: 5, totalSpace: 5 };
  return { iconSize: 1, totalSpace: 1 }; // user — max 1x1 grid
};


// ─── Seeded random (deterministic) ───
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// ─── Procedural jungle element generation (OG architecture, densified) ───
const generateMapElements = (minX, maxX, minY, maxY, allEntities) => {
  const components = [];
  const occupiedPositions = new Set();
  const bigTreePositions = new Set();

  const getEntityZone = (x, y) => {
    for (const entity of allEntities) {
      const sizing = getEntitySizing(entity.type);
      const iconSize = sizing.iconSize;
      const totalSpace = sizing.totalSpace;
      const spaceEndX = entity.gridX + totalSpace - 1;
      const spaceEndY = entity.gridY + totalSpace - 1;
      if (x < entity.gridX || x > spaceEndX || y < entity.gridY || y > spaceEndY) continue;
      const iconEndX = entity.gridX + iconSize - 1;
      const iconEndY = entity.gridY + iconSize - 1;
      if (entity.type === 'user') {
        if (x === entity.gridX && y === entity.gridY) return { zone: 'user-icon', entity, sizing };
        return { zone: 'user-buffer', entity, sizing };
      } else {
        const inIcon = x >= entity.gridX && x <= iconEndX && y >= entity.gridY && y <= iconEndY;
        if (inIcon) {
          const onEdge = x === entity.gridX || x === iconEndX || y === entity.gridY || y === iconEndY;
          return { zone: onEdge ? 'community-icon-border' : 'community-icon-center', entity, sizing };
        }
        return { zone: 'community-buffer', entity, sizing };
      }
    }
    return { zone: 'unoccupied' };
  };

  const checkNaturalCollision2x2 = (x, y) => {
    for (let dx = -1; dx <= 0; dx++)
      for (let dy = -1; dy <= 0; dy++)
        if (occupiedPositions.has(`${x + dx},${y + dy}`)) return true;
    return false;
  };

  const canBigTreeSpawn = (x, y) => {
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        if (bigTreePositions.has(`${x + dx},${y + dy}`)) return false;
    return true;
  };

  const isAdjacentToCommunityIcon = (x, y) => {
    for (let dx = -1; dx <= 0; dx++)
      for (let dy = -1; dy <= 0; dy++)
        for (let ax = -1; ax <= 1; ax++)
          for (let ay = -1; ay <= 1; ay++) {
            const z = getEntityZone(x + dx + ax, y + dy + ay);
            if (z.zone === 'community-icon-center' || z.zone === 'community-icon-border') return true;
          }
    return false;
  };

  // PASS 1: 2×2 trees on grid vertices — HIGHER DENSITY
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const seed = x * 1000 + y;
      const rand = seededRandom(seed);
      let canSpawnBigTree = true;
      let canSpawnSmallTree = true;
      let lowestSpawnChance = 1.0;
      let blocked = false;
      let touchesCommunityIcon = false;
      let allUnoccupied = true;

      for (let dx = -1; dx <= 0 && !blocked; dx++) {
        for (let dy = -1; dy <= 0 && !blocked; dy++) {
          const zoneInfo = getEntityZone(x + dx, y + dy);
          switch (zoneInfo.zone) {
            case 'user-icon':
            case 'community-icon-center':
              blocked = true;
              break;
            case 'community-icon-border':
              touchesCommunityIcon = true;
              canSpawnBigTree = false;
              allUnoccupied = false;
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.50);
              break;
            case 'community-buffer':
              canSpawnBigTree = false;
              allUnoccupied = false;
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.65);
              break;
            case 'user-buffer':
              allUnoccupied = false;
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.70);
              break;
            default:
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.92);
              break;
          }
        }
      }

      if (blocked) continue;

      if (touchesCommunityIcon && canSpawnSmallTree) {
        let allBorder = true;
        for (let dx = -1; dx <= 0; dx++)
          for (let dy = -1; dy <= 0; dy++) {
            const z = getEntityZone(x + dx, y + dy);
            if (z.zone !== 'community-icon-border') { allBorder = false; break; }
          }
        if (!allBorder) continue;
      }

      if (canSpawnBigTree && isAdjacentToCommunityIcon(x, y)) canSpawnBigTree = false;
      if (!allUnoccupied && checkNaturalCollision2x2(x, y)) continue;

      if (rand < lowestSpawnChance) {
        const typeRand = seededRandom(seed + 777);
        if (canSpawnBigTree && typeRand < 0.40 && (allUnoccupied || canBigTreeSpawn(x, y))) {
          const variant = seededRandom(seed + 999) < 0.5 ? 1 : 2;
          components.push({ id: `big-tree-${x}-${y}`, type: 'big-tree', variant, gridX: x, gridY: y });
          bigTreePositions.add(`${x},${y}`);
          for (let dx = -1; dx <= 0; dx++)
            for (let dy = -1; dy <= 0; dy++)
              occupiedPositions.add(`${x + dx},${y + dy}`);
        } else if (canSpawnSmallTree && typeRand >= 0.40) {
          const isPalm = seededRandom(seed + 888) < 0.20;
          const variant = seededRandom(seed + 777) < 0.5 ? 1 : 2;
          components.push({
            id: `${isPalm ? 'palm' : 'small-tree'}-${x}-${y}`,
            type: isPalm ? 'palm' : 'small-tree',
            variant: isPalm ? undefined : variant,
            gridX: x, gridY: y
          });
          for (let dx = -1; dx <= 0; dx++)
            for (let dy = -1; dy <= 0; dy++)
              occupiedPositions.add(`${x + dx},${y + dy}`);
        }
      }
    }
  }

  // PASS 2: 1×1 ground cover — HIGHER DENSITY
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const seed = x * 2000 + y + 5000;
      const rand = seededRandom(seed);
      const zoneInfo = getEntityZone(x, y);
      let spawnChance = 0;
      switch (zoneInfo.zone) {
        case 'user-icon':
        case 'community-icon-center':
        case 'community-icon-border':
          continue;
        case 'community-buffer':
          spawnChance = 0.50;
          break;
        case 'user-buffer':
          spawnChance = 0.60;
          break;
        default:
          spawnChance = 0.92;
          break;
      }
      if (occupiedPositions.has(`${x},${y}`)) continue;
      if (rand < spawnChance) {
        const typeRand = seededRandom(seed + 12345);
        let type;
        if (typeRand < 0.30) type = 'shrub';
        else if (typeRand < 0.55) type = 'rock';
        else if (typeRand < 0.80) type = 'flowers';
        else type = 'small-tree-extra';
        components.push({ id: `${type}-${x}-${y}`, type, gridX: x + 0.5, gridY: y + 0.5 });
        occupiedPositions.add(`${x},${y}`);
      }
    }
  }

  return components;
};

// ─── SVG asset paths (OG jungle assets) ───
const IMAGE_PATHS = {
  'big-tree-1': '/jungle/Property%201=A.svg',
  'big-tree-2': '/jungle/Property%201=B.svg',
  'small-tree-1': '/jungle/Property%201=A%20(1).svg',
  'small-tree-2': '/jungle/Property%201=B%20(1).svg',
  'palm': '/jungle/Property%201=Palm%20Tree.svg',
  'shrub': '/jungle/Property%201=Shrubs.svg',
  'rock': '/jungle/Property%201=Rocks.svg',
  'flowers': '/jungle/Property%201=Flowers.svg',
  'small-tree-extra': '/jungle/Property%201=Shrubs.svg',
};

const getImagePath = (comp) => {
  if (comp.type === 'big-tree') return IMAGE_PATHS[`big-tree-${comp.variant || 1}`];
  if (comp.type === 'small-tree') return IMAGE_PATHS[`small-tree-${comp.variant || 1}`];
  return IMAGE_PATHS[comp.type];
};

// ─── HoverCardPro (OG's hover card) ───
function HoverCardPro({ className = '', hoverCardClassName = '', hoverCardContent, children, onHoverCardClick }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div className={`${className} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        onClick={onHoverCardClick}
        className={`absolute ${hoverCardClassName} ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } transition-opacity duration-100`}
      >
        {hoverCardContent}
      </div>
    </div>
  );
}

// ─── Map Node Components (OG's MapNodes.jsx) ───

// KuraNode — home base, 77x77 icon, navigates to /kura
function KuraNode({ onClick }) {
  return (
    <HoverCardPro
      className=""
      hoverCardContent={
        <div className="w-max h-12 p-0.5 bg-secondary flex flex-row items-center gap-1">
          <p className="h-full px-4 flex items-center justify-center text-secondary bg-primary">YOUR KURA</p>
          <p className="h-full flex flex-row items-center gap-4 text-primary border-[1.5px] border-primary px-4 cursor-pointer">
            ENTER HOME <FaCaretRight size={18} />
          </p>
        </div>
      }
      hoverCardClassName="!z-[999] cursor-pointer text-xl text-secondary -top-[20%] left-[80%] bg-primary"
      onHoverCardClick={() => null}
    >
      <div className="cursor-pointer transition-all duration-200 w-[77px] h-[77px] border-[#2B2B2B] bg-[#2B2B2B] hover:border-gray-400"
        onClick={onClick}
      >
        <img src="/Kura.svg" alt="KURA" className="w-full h-full" />

      </div>
    </HoverCardPro>
  );
}

// MojNode — Old Secretariat community building, 385x385 (5x5 grid), clickable popup → /moj
function MojNode({ onClick, size = 385 }) {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="relative cursor-pointer" style={{ width: size, height: size }} onClick={() => setShowPopup(v => !v)}>

      <img src="/assets/building/MOJ-HOME.png" alt="Structure" className="w-full h-full object-contain" />
      <div className={`${
        showPopup ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } absolute cursor-default w-[320px] h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: '100%', right: '0', zIndex: 9999 }}
      >
        <aside className="w-full flex flex-row items-start justify-start">
          <div className="aspect-[4/3] flex flex-col border-[2px] border-secondary">
            <h2 className="w-full h-12 flex items-center justify-start px-4 bg-primary text-secondary text-xl uppercase !text-center">
              Old Secretariat
            </h2>
            <div className="w-full h-full bg-secondary flex items-center justify-center text-primary text-center">
              <img src="/cathedral.png" alt="Old-Secretariat" className="w-full h-full object-cover" />
            </div>
          </div>
        </aside>
        <h2 className="w-full h-12 cursor-pointer flex items-center justify-between px-4 bg-secondary text-primary border-[2px] border-primary text-xl"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          EXPLORE LOCATION <FaCaretRight size={18} />
        </h2>
      </div>
    </div>
  );
}

// CCStudiosNode — Cappuccino Studiox community building, 385x385 (5x5 grid), clickable popup → /cappuccinostudiox
function CCStudiosNode({ onClick, size = 385 }) {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="relative cursor-pointer" style={{ width: size, height: size }} onClick={() => setShowPopup(v => !v)}>

      <img src="/assets/building/CC-Studios.png" alt="CC Studios" className="w-full h-full object-contain" />
      <div className={`${
        showPopup ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } absolute cursor-default w-[320px] h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: '100%', right: '0', zIndex: 9999 }}
      >
        <aside className="w-full flex flex-row items-start justify-start">
          <div className="aspect-[4/3] flex flex-col border-[2px] border-secondary">
            <h2 className="w-full h-12 flex items-center justify-start px-4 bg-primary text-secondary text-xl uppercase !text-center">
              Cappuccino Studiox
            </h2>
            <div className="w-full h-full bg-secondary flex items-center justify-center text-primary text-center">
              <img src="/CC-Studios-popup.png" alt="Cappuccino-Studiox" className="w-full h-full object-cover" />
            </div>
          </div>
        </aside>
        <h2 className="w-full h-12 cursor-pointer flex items-center justify-between px-4 bg-secondary text-primary border-[2px] border-primary text-xl"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          EXPLORE LOCATION <FaCaretRight size={18} />
        </h2>
      </div>
    </div>
  );
}

// BonzoNode2 — user node, click to reveal CTA, then visit friend base
function BonzoNode2({ onVisit }) {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="relative cursor-pointer w-[77px] h-[77px]" onClick={() => setShowPopup(v => !v)}>
      <div className="cursor-pointer transition-all duration-200 w-[77px] h-[77px]">
        <img src="/Bonzo.svg" alt="BONZO" className="w-full h-full" />
      </div>

      <div
        className={`${
          showPopup ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } absolute cursor-default w-max h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: '105%', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}
      >
        <div className="w-max h-12 p-0.5 bg-secondary flex flex-row items-center gap-1">
          <p className="h-full px-4 flex items-center justify-center text-secondary bg-primary whitespace-nowrap">BONZO</p>
          <button
            type="button"
            className="h-full flex flex-row items-center gap-4 text-primary border-[1.5px] border-primary px-4 whitespace-nowrap bg-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onVisit();
            }}
          >
            VISIT FRIEND <FaCaretRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// DojoNode — community building, 385x385 (5x5 grid), with popup → /dojo
function DojoNode({ onClick, size = 385 }) {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="relative cursor-pointer" style={{ width: size, height: size }} onClick={() => setShowPopup(v => !v)}>

      <div className="w-full h-full flex flex-col items-center justify-center bg-[#2B2B2B] border-2 border-[#2B2B2B]">
        <span className="text-[#FFFFFF] text-xl">⛩</span>

      </div>
      <div className={`${
        showPopup ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } absolute cursor-default w-[280px] h-max flex flex-col gap-1 transition-opacity duration-100`}
        style={{ bottom: '105%', right: '0', zIndex: 9999 }}
      >
        <aside className="w-full flex flex-row items-start justify-start">
          <div className="w-full flex flex-col border-[2px] border-secondary">
            <h2 className="w-full h-10 flex items-center justify-start px-4 bg-primary text-secondary text-base uppercase">
              Bonzo's Dojo
            </h2>
            <div className="w-full bg-[#151413] flex items-center justify-center text-[#ABD49E] text-xs px-4 py-4 text-center leading-relaxed">
              A private fitness Fanbase. Join to get your AI weekly programme and track your body shape journey.
            </div>
          </div>
        </aside>
        <h2 className="w-full h-12 cursor-pointer flex items-center justify-between px-4 bg-secondary text-primary border-[2px] border-primary text-base"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          ENTER DOJO <FaCaretRight size={18} />
        </h2>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function DreamingPage() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [drawerState, setDrawerState] = useState(0); // 0=collapsed, 1=expanded, 2=fully expanded
  const [hasDragged, setHasDragged] = useState(false);
  const [drawerMode, setDrawerMode] = useState('connections'); // 'connections' | 'missions' | 'fanbases'
  const [connectionFilter, setConnectionFilter] = useState('all'); // 'all' | 'dreamers' | 'communities'
  const [missionFilter, setMissionFilter] = useState('all'); // 'all' | 'daily' | 'weekly' | 'monthly'
  const [fanbaseFilter, setFanbaseFilter] = useState('all'); // 'all' | 'free' | 'standard' | 'premium'




  useEffect(() => {
    const timer = setTimeout(() => setHasDragged(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate dynamic map bounds from entities
  const mapBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    MAP_ENTITIES.forEach((e) => {
      const s = getEntitySizing(e.type);
      minX = Math.min(minX, e.gridX);
      maxX = Math.max(maxX, e.gridX + s.totalSpace - 1);
      minY = Math.min(minY, e.gridY);
      maxY = Math.max(maxY, e.gridY + s.totalSpace - 1);
    });
    const buffer = 8;
    const mnX = Math.floor(minX - buffer);
    const mxX = Math.floor(maxX + buffer);
    const mnY = Math.floor(minY - buffer);
    const mxY = Math.floor(maxY + buffer);
    const rangeX = mxX - mnX;
    const rangeY = mxY - mnY;
    const maxRange = Math.max(rangeX, rangeY);
    const minCoord = Math.min(mnX, mnY);
    const maxCoord = minCoord + maxRange;
    return {
      minGridCoord: minCoord,
      maxGridCoord: maxCoord,
      mapSize: maxRange * GRID_SIZE,
      gridOffset: -minCoord * GRID_SIZE,
    };
  }, []);

  const { mapSize: MAP_SIZE, gridOffset: GRID_OFFSET } = mapBounds;

  // Generate procedural jungle elements
  const naturalComponents = useMemo(() => {
    return generateMapElements(
      mapBounds.minGridCoord, mapBounds.maxGridCoord,
      mapBounds.minGridCoord, mapBounds.maxGridCoord,
      MAP_ENTITIES
    );
  }, [mapBounds]);

  // Pre-compute pixel positions for all natural elements
  const naturalWithPositions = useMemo(() => {
    return naturalComponents.map((comp) => {
      const x = GRID_OFFSET + comp.gridX * GRID_SIZE;
      const y = GRID_OFFSET + comp.gridY * GRID_SIZE;
      let size;
      if (comp.type === 'big-tree') size = GRID_SIZE * 1.5;
      else if (comp.type === 'small-tree') size = GRID_SIZE * 0.7;
      else if (comp.type === 'palm') size = GRID_SIZE * 0.8;
      else if (comp.type === 'small-tree-extra') size = GRID_SIZE * 0.5;
      else size = GRID_SIZE * 0.5;
      return { ...comp, px: x, py: y, size };
    });
  }, [naturalComponents, GRID_OFFSET]);

  // Center on Kura (HOME) at (0,0) after mount
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        const container = mapRef.current;
        const homeX = GRID_OFFSET;
        const homeY = GRID_OFFSET;
        container.scrollLeft = homeX - container.clientWidth / 2;
        container.scrollTop = homeY - container.clientHeight / 2;
      }, 100);
    }
  }, [GRID_OFFSET]);

  const getPosition = (gridX, gridY) => ({
    x: GRID_OFFSET + gridX * GRID_SIZE,
    y: GRID_OFFSET + gridY * GRID_SIZE,
  });

  // Pre-compute stable entity positions — users 1x1 (77px), communities 5x5 (385px)
  const entityPositions = useMemo(() => {
    return MAP_ENTITIES.map((entity) => {
      const sizing = getEntitySizing(entity.type);
      const nodeSize = sizing.iconSize * GRID_SIZE;
      const x = GRID_OFFSET + entity.gridX * GRID_SIZE;
      const y = GRID_OFFSET + entity.gridY * GRID_SIZE;
      return { ...entity, x, y, nodeWidth: nodeSize, nodeHeight: nodeSize };
    });
  }, [GRID_OFFSET]);


  const handleEntityClick = (entity) => {
    if (entity.href) router.push(entity.href);
  };

  return (
    <>
      <Head>
        <title>DREAMING | Lucid Jungles — Digital Plane</title>
        <link rel="preload" as="image" href="/jungle/Property%201=A.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=B.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=A%20(1).svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=B%20(1).svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Palm%20Tree.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Shrubs.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Rocks.svg" />
        <link rel="preload" as="image" href="/jungle/Property%201=Flowers.svg" />
      </Head>

      <main className="bleed-nav relative w-[100dvw] h-[100dvh] font-CodeSaver" style={{ backgroundColor: '#2B2B2B' }}>

        {/* ── Scrollable jungle map container ── */}
        <div
          ref={mapRef}
          className="jungle-map-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            background: '#2B2B2B',

          }}
        >
          {/* Map content — sized to fit all entities + buffer */}
          <div
            style={{
              position: 'relative',
              width: `${MAP_SIZE}px`,
              height: `${MAP_SIZE}px`,
              minWidth: `${MAP_SIZE}px`,
              minHeight: `${MAP_SIZE}px`,
            }}
          >
            {/* Foliage background pattern */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2316a34a' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                opacity: 0.4,
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />

            {/* Uniform white grid lines — every single grid line, same thickness */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: [
                  'linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
                  'linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
                ].join(', '),
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />





            {/* SVG dashed paths connecting entities to Kura */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 15,
              }}
            >
              {MAP_ENTITIES.filter((e) => e.id !== 'kura').map((entity) => {
                const kuraPos = getPosition(0, 0);
                const entityData = entityPositions.find(e => e.id === entity.id);
                // Path goes from center of Kura (77/2 = 38) to center of entity node
                const centerX = entityData.x + entityData.nodeWidth / 2;
                const centerY = entityData.y + entityData.nodeHeight / 2;
                return (
                  <line
                    key={`path-${entity.id}`}
                    x1={kuraPos.x + 38}
                    y1={kuraPos.y + 38}
                    x2={centerX}
                    y2={centerY}
                    stroke="rgba(255, 255, 255, 0.2)"

                    strokeWidth="2"
                    strokeDasharray="8,6"
                  />
                );
              })}
            </svg>


            {/* Procedural natural elements */}
            {naturalWithPositions.map((comp) => (
              <img
                key={comp.id}
                src={getImagePath(comp)}
                alt=""
                decoding="async"
                style={{
                  position: 'absolute',
                  left: comp.px,
                  top: comp.py,
                  width: comp.size,
                  height: comp.size,
                  transform: 'translate(-50%, -50%)',
                  zIndex: comp.type.includes('tree') || comp.type === 'palm' || comp.type === 'big-tree' ? 35 : 32,
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Entity components — users 1x1 (77px), communities 5x5 (385px) */}
            {entityPositions.map((entity) => (
              <div
                key={entity.id}
                style={{
                  position: 'absolute',
                  left: entity.x,
                  top: entity.y,
                  width: entity.nodeWidth,
                  height: entity.nodeHeight,
                  zIndex: entity.type === 'community' ? 50 : 40,
                  overflow: 'visible',
                }}
              >
                {entity.id === 'kura' && <KuraNode onClick={() => handleEntityClick(entity)} />}
                {entity.id === 'moj' && <MojNode onClick={() => handleEntityClick(entity)} />}
                {entity.id === 'ccstudios' && <CCStudiosNode onClick={() => handleEntityClick(entity)} />}
                {entity.id === 'bonzo' && <BonzoNode2 onVisit={() => handleEntityClick(entity)} />}
                {entity.id === 'dojo' && <DojoNode onClick={() => handleEntityClick(entity)} />}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#151413',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: 3,
                    fontSize: 7,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255, 255, 255, 0.3)',

                    fontFamily: 'CodeSaver, monospace',
                    letterSpacing: 0.5,
                    zIndex: 41,
                  }}
                >
                  {entity.name}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Explore hint toast */}
        <div
          className={`absolute bottom-[8%] left-1/2 -translate-x-1/2 z-50 w-max h-max px-6 py-4 transition-all ease-in-out duration-500 text-sm md:text-lg font-semibold pointer-events-none ${
            hasDragged ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundColor: '#151413',
            color: '#ABD49E',
            border: '1px solid #ABD49E',
            borderRadius: '4px',
            fontFamily: 'CodeSaver, monospace',
          }}
        >
          SCROLL TO EXPLORE THE JUNGLE MAP
        </div>

        {/* ── Floating right-side action panel ── */}
        <button
          aria-label="Scan QR code"
          style={{
            position: 'fixed',
            right: 12,
            top: 600,
            width: 54,
            height: 54,
            backgroundColor: '#151413',
            border: '2px solid #ABD49E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 200,
            boxShadow: '4px 5px 8px rgba(0,0,0,0.4)',
            padding: 0,
          }}
        >
          <svg width="34" height="34" viewBox="346 600 54 54" style={{ display: 'block' }}>
            <path d="M391.004 637.427H389.102V643.11H391.004V637.427Z" fill="#ABD49E"/>
            <path d="M391.004 610.89H389.102V616.586H391.004V610.89Z" fill="#ABD49E"/>
            <path d="M389.101 609H383.418V610.89H389.101V609Z" fill="#ABD49E"/>
            <path d="M389.101 643.11H383.418V645H389.101V643.11Z" fill="#ABD49E"/>
            <path d="M385.31 614.689H360.676V639.323H385.31V614.689ZM377.737 624.165H379.627V629.848H373.944V627.958H377.737V624.165ZM370.151 616.592H375.834V618.482H370.151V616.592ZM370.151 620.372H375.834V626.055H373.944V622.275H370.151V620.372ZM370.151 624.165H372.054V629.848H370.151V624.165ZM368.261 637.433H362.578V631.75H368.261V637.433ZM368.261 627.958H364.469V629.848H362.578V624.165H364.469V626.055H368.261V627.958ZM368.261 624.165H366.371V620.372H368.261V624.165ZM368.261 618.482H364.469V622.275H362.578V616.586H368.261V618.482ZM375.834 637.433H373.944V635.531H375.834V637.433ZM375.834 633.64H372.054V637.433H370.151V631.75H375.834V633.64ZM383.42 637.433H377.737V631.75H383.42V637.433ZM383.42 629.848H381.53V624.165H383.42V629.848ZM383.42 622.275H377.737V616.586H383.42V622.275Z" fill="#ABD49E"/>
            <path d="M381.528 633.634H379.625V635.524H381.528V633.634Z" fill="#ABD49E"/>
            <path d="M381.528 618.476H379.625V620.366H381.528V618.476Z" fill="#ABD49E"/>
            <path d="M366.371 633.634H364.469V635.524H366.371V633.634Z" fill="#ABD49E"/>
            <path d="M362.577 643.11H356.895V645H362.577V643.11Z" fill="#ABD49E"/>
            <path d="M362.577 609H356.895V610.89H362.577V609Z" fill="#ABD49E"/>
            <path d="M356.895 637.427H354.992V643.11H356.895V637.427Z" fill="#ABD49E"/>
            <path d="M356.895 610.89H354.992V616.586H356.895V610.89Z" fill="#ABD49E"/>
          </svg>
        </button>

        <button
          aria-label="Your Kura"
          style={{
            position: 'fixed',
            right: 12,
            top: 655,
            width: 52,
            height: 52,
            backgroundColor: '#151413',
            border: '2px solid #ABD49E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 200,
            boxShadow: '4px 5px 8px rgba(0,0,0,0.4)',
            padding: 0,
          }}
        >
          <svg width="32" height="32" viewBox="347 655 52 52" style={{ display: 'block' }}>
            <path d="M375.465 675.873C375.465 677.48 376.731 678.746 378.338 678.746C379.945 678.746 381.211 677.48 381.211 675.873C381.211 674.266 379.945 673 378.338 673C376.731 673 375.465 674.266 375.465 675.873Z" fill="#ABD49E"/>
            <path d="M367.871 688.446L365.617 684.875H379.053L376.798 688.446H367.871Z" fill="#ABD49E"/>
            <path d="M363.703 675.873C363.703 677.48 364.969 678.746 366.576 678.746C368.183 678.746 369.449 677.48 369.449 675.873C369.449 674.266 368.183 673 366.576 673C364.969 673 363.703 674.266 363.703 675.873Z" fill="#ABD49E"/>
          </svg>
        </button>

        {/* ── Always-Visible Bottom Drawer (3-state like waking page) ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40"
          style={{ bottom: '75px' }}
        >
          <div className="bg-[#151413] border-t border-[#ABD49E]/20 rounded-t-xl"
            style={{
              maxHeight: drawerState === 0 ? 'auto' : drawerState === 1 ? '55vh' : 'calc(100vh - 120px)',
              transition: 'max-height 0.3s ease-in-out'
            }}
          >
            {/* ── Clickable Handle (cycles 0→1→2→0) ── */}
            <div className="flex flex-col items-center pt-2 pb-1 cursor-pointer hover:bg-[#ABD49E]/5 transition-colors"
              onClick={() => setDrawerState(prev => prev === 2 ? 0 : prev + 1)}
            >
              <div className="w-10 h-1 bg-[#ABD49E]/30 rounded-full mb-1" />
              {drawerState === 0 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#ABD49E]/30">
                  <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {drawerState === 1 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#ABD49E]/50">
                  <path d="M3 8L6 5L9 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {drawerState === 2 && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#ABD49E]/50">
                  <path d="M3 8L6 5L9 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            {/* ── Drawer tabs (always visible) ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#ABD49E]/10 flex-shrink-0">
              <div className="flex gap-4">
                {['connections', 'missions', 'fanbases'].map(tab => (
                  <button key={tab} onClick={() => setDrawerMode(tab)}
                    className={`text-[9px] font-bold tracking-wider pb-1 border-b-2 transition-colors ${
                      drawerMode === tab ? 'text-[#ABD49E] border-[#ABD49E]' : 'text-[#ABD49E]/40 border-transparent'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="text-[8px] text-[#ABD49E]/30 tracking-wider">
                {MAP_ENTITIES.length - 1} LOCATIONS
              </span>
            </div>

            {/* ── Content (only visible when expanded) ── */}
            {drawerState > 0 && (
              <div className="overflow-y-auto px-4 pb-20" style={{
                maxHeight: drawerState === 2 ? 'calc(100vh - 280px)' : 'calc(55vh - 160px)'
              }}>
                {/* ── CONNECTIONS TAB ── */}
                {drawerMode === 'connections' && (
                  <div className="py-3">
                    {/* Connection type filters */}
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
                      {[
                        { key: 'all', label: 'ALL' },
                        { key: 'dreamers', label: 'DREAMERS' },
                        { key: 'communities', label: 'COMMUNITIES' },
                      ].map(f => (
                        <button key={f.key} onClick={() => setConnectionFilter(f.key)}
                          className={`text-[8px] font-bold tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                            connectionFilter === f.key
                              ? 'bg-[#ABD49E] text-[#151413]'
                              : 'bg-transparent border border-[#ABD49E]/20 text-[#ABD49E]/50 hover:border-[#ABD49E]/40'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {MAP_ENTITIES.filter(e => {
                        if (e.id === 'kura') return false;
                        if (connectionFilter === 'all') return true;
                        if (connectionFilter === 'dreamers') return e.type === 'user';
                        if (connectionFilter === 'communities') return e.type === 'community';
                        return true;
                      }).map(entity => (
                        <div
                          key={entity.id}
                          onClick={() => handleEntityClick(entity)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#ABD49E]/5 transition-colors border border-transparent hover:border-[#ABD49E]/20"
                        >
                          <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded ${
                            entity.type === 'community' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#ABD49E]/20 text-[#ABD49E]'
                          }`}>
                            {entity.type === 'community' ? '⬡' : '✦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate text-[#ABD49E]">{entity.name}</div>
                            <div className="text-[9px] text-[#ABD49E]/40 uppercase tracking-wider">{entity.type}</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#ABD49E]/30">
                            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── MISSIONS TAB ── */}
                {drawerMode === 'missions' && (
                  <div className="py-3">
                    {/* Mission time filters */}
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
                      {[
                        { key: 'all', label: 'ALL' },
                        { key: 'daily', label: 'DAILY' },
                        { key: 'weekly', label: 'WEEKLY' },
                        { key: 'monthly', label: 'MONTHLY' },
                      ].map(f => (
                        <button key={f.key} onClick={() => setMissionFilter(f.key)}
                          className={`text-[8px] font-bold tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                            missionFilter === f.key
                              ? 'bg-[#ABD49E] text-[#151413]'
                              : 'bg-transparent border border-[#ABD49E]/20 text-[#ABD49E]/50 hover:border-[#ABD49E]/40'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {(missionFilter === 'all' || missionFilter === 'daily') && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#ABD49E]/10">
                          <div className="w-8 h-8 flex items-center justify-center bg-[#ABD49E]/10 text-[#ABD49E] text-xs rounded">!</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#ABD49E]">Daily Login Streak</div>
                            <div className="text-[9px] text-[#ABD49E]/40">Log in every day to build your streak</div>
                          </div>
                          <div className="text-[9px] text-[#ABD49E]/30">3/7</div>
                        </div>
                      )}
                      {(missionFilter === 'all' || missionFilter === 'weekly') && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#ABD49E]/10">
                          <div className="w-8 h-8 flex items-center justify-center bg-[#ABD49E]/10 text-[#ABD49E] text-xs rounded">!</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#ABD49E]">Explore the Jungle</div>
                            <div className="text-[9px] text-[#ABD49E]/40">Discover all locations on the map</div>
                          </div>
                          <div className="text-[9px] text-[#ABD49E]/30">0/5</div>
                        </div>
                      )}
                      {(missionFilter === 'all' || missionFilter === 'monthly') && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#ABD49E]/10">
                          <div className="w-8 h-8 flex items-center justify-center bg-[#ABD49E]/10 text-[#ABD49E] text-xs rounded">!</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#ABD49E]">Visit Old Secretariat</div>
                            <div className="text-[9px] text-[#ABD49E]/40">Explore the MOJ building</div>
                          </div>
                          <div className="text-[9px] text-[#ABD49E]/30">0/1</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── FANBASES TAB ── */}
                {drawerMode === 'fanbases' && (
                  <div className="py-3">
                    {/* Fanbase tier filters */}
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
                      {[
                        { key: 'all', label: 'ALL' },
                        { key: 'free', label: 'FREE' },
                        { key: 'standard', label: 'STANDARD' },
                        { key: 'premium', label: 'PREMIUM' },
                      ].map(f => (
                        <button key={f.key} onClick={() => setFanbaseFilter(f.key)}
                          className={`text-[8px] font-bold tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                            fanbaseFilter === f.key
                              ? 'bg-[#ABD49E] text-[#151413]'
                              : 'bg-transparent border border-[#ABD49E]/20 text-[#ABD49E]/50 hover:border-[#ABD49E]/40'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {(fanbaseFilter === 'all' || fanbaseFilter === 'free') && (
                        <div
                          onClick={() => router.push('/dojo')}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#ABD49E]/5 transition-colors border border-transparent hover:border-[#ABD49E]/20"
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded">⛩</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#ABD49E]">Bonzo's Dojo</div>
                            <div className="text-[9px] text-[#ABD49E]/40">A private fitness Fanbase. Join to get your AI weekly programme and track your body shape journey. · Free</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#ABD49E]/30">
                            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {(fanbaseFilter === 'all' || fanbaseFilter === 'standard') && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#ABD49E]/10 opacity-50">
                          <div className="w-8 h-8 flex items-center justify-center bg-[#ABD49E]/10 text-[#ABD49E] text-xs rounded">?</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#ABD49E]">Coming Soon</div>
                            <div className="text-[9px] text-[#ABD49E]/40">Standard Fanbase — Unlock exclusive content and community features</div>
                          </div>
                        </div>
                      )}
                      {(fanbaseFilter === 'all' || fanbaseFilter === 'premium') && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#ABD49E]/10 opacity-50">
                          <div className="w-8 h-8 flex items-center justify-center bg-[#ABD49E]/10 text-[#ABD49E] text-xs rounded">?</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#ABD49E]">Coming Soon</div>
                            <div className="text-[9px] text-[#ABD49E]/40">Premium Fanbase — VIP access, direct messaging, and early drops</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>



      </main>

      <style jsx global>{`
        .jungle-map-container {
          scrollbar-width: thin;
          scrollbar-color: #ABD49E #151413;
          cursor: grab;
          touch-action: pan-x pan-y;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .jungle-map-container:active {
          cursor: grabbing;
        }
        .jungle-map-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .jungle-map-container::-webkit-scrollbar-track {
          background: #151413;
        }
        .jungle-map-container::-webkit-scrollbar-thumb {
          background-color: #ABD49E;
          border-radius: 5px;
          border: 2px solid #151413;
        }
        .jungle-map-container::-webkit-scrollbar-corner {
          background: #151413;
        }
      `}</style>
    </>
  );
}

