// lib/plan.js — the base as a *plan view*: tiers, rooms, and the rules that make
// placing furniture feel like a home instead of a sticker book.
//
// Why this file exists (LJ Prod Docs/LUCID_JUNGLES_BASE_PLAN.md):
//
//   Lagos Life's home is a first-class domain — /api/homes/u/:username, /api/room,
//   /api/knock, /api/visit — and its rooms are "the geography": you navigate the sim
//   by walking between them. Lucid Jungles already had a placeable layout per base
//   (HomeBase.roomLayout as JSON + furniture[] as equipped ids), so rooms are an
//   *extension* of that, not a second system. This module is the extension.
//
// Three things live here and nowhere else:
//
//   1. THE LADDER (TIERS). The Lagos housing ladder is the progression, because it
//      is legible, aspirational and free: ONE ROOM → FACE-ME-I-FACE-YOU → FLAT →
//      DUPLEX → COMPOUND. HomeBase.upgradeLevel already exists (Number, default 1)
//      and already persists; this file gives each level a plan.
//   2. THE RULES (canPlace / firstFreeSpot / sortForPlan). Room bounds, the desk's
//      reserved footprint, collisions, tier capacity, snapping and y-order. Without
//      these a plan view looks broken in ten minutes of dragging.
//   3. THE CONTRACT (parseRoomLayout / serializeRoomLayout). roomLayout v2 is a
//      strict superset of v1: `items` keeps meaning "things on the desk surface"
//      (so every saved base, and every check in scripts/verify-base.js, still
//      reads), and `floor` is the new array of things standing in the rooms.
//
// Nothing is fetched and nothing is invented: geometry, prices and sprites are the
// demo values the money/art pass replaces (see the notes at the bottom of each
// section) — the *shape* of the data is what is meant to survive.

// ─── Plan units ───────────────────────────────────────────────────────────────
// One plan unit is one pixel at scale 1, and the desk is 310×255 of them because
// that is its own coordinate space (DeskScene). A base is therefore always drawn
// as "the desk, in a room", at any zoom.
export const DESK_UNITS = { w: 310, h: 255 };
export const PLAN_SNAP = 12; // furniture lands on a 12-unit grid, like a floorplan
export const MAX_PLAN_SCALE = 1.55;

// ─── Themes ───────────────────────────────────────────────────────────────────
// HomeBase.theme already persists (jungle/sunset/midnight/neon — the same four
// pages/home/index.js offers). Until now it changed nothing on screen. It now
// picks the floor, the grid lines and the wall colour of the plan.
export const THEME_PALETTES = {
  jungle:   { key: 'jungle',   label: 'JUNGLE',   floor: '#151413', grid: 'rgba(171,212,158,0.16)', wall: '#ABD49E', ink: '#101010', accent: '#F4A261' },
  sunset:   { key: 'sunset',   label: 'SUNSET',   floor: '#1A1512', grid: 'rgba(244,162,97,0.20)',  wall: '#F4A261', ink: '#101010', accent: '#ABD49E' },
  midnight: { key: 'midnight', label: 'MIDNIGHT', floor: '#0F1622', grid: 'rgba(143,199,232,0.18)', wall: '#8FC7E8', ink: '#101010', accent: '#ABD49E' },
  neon:     { key: 'neon',     label: 'NEON',     floor: '#14101C', grid: 'rgba(183,156,247,0.20)', wall: '#B79CF7', ink: '#101010', accent: '#ABD49E' },
};

export const themePalette = (theme) => THEME_PALETTES[String(theme || '').toLowerCase()] || THEME_PALETTES.jungle;

// ─── The ladder ───────────────────────────────────────────────────────────────
// A tier is: a number (what upgradeLevel stores), a Lagos name (what the property
// listing sells), rooms with doors drawn where you'd walk through, the desk's
// anchored corner, and how much of the base you may fill.
//
// `price` is the demo price in naira — see formatNaira. Checkout is not wired yet,
// so the upgrade screen says so out loud; what is real is that choosing a tier
// persists to HomeBase.upgradeLevel and the plan changes with it.
export const TIERS = [
  {
    level: 1,
    key: 'ONE_ROOM',
    name: 'ONE ROOM',
    tagline: 'Four walls, a yard light, and the desk that pays for the next one.',
    price: 0,
    slots: 4,
    plot: 1,
    floors: [{ no: 1, label: 'GROUND' }],
    rooms: [
      { id: 'main', label: 'MAIN ROOM', floor: 1, x: 0, y: 0, w: 660, h: 370, door: { wall: 'south', at: 300, w: 80 } },
    ],
    desk: { floor: 1, room: 'main', x: 20, y: 24 },
    openings: [{ x: 300, y: 364, w: 80, h: 6 }],
    includes: ['RUG', 'PLANT'],
  },
  {
    level: 2,
    key: 'FACE_ME',
    name: 'FACE-ME-I-FACE-YOU',
    tagline: 'A corridor, a room, and neighbours close enough to knock.',
    price: 180000,
    slots: 7,
    plot: 2,
    floors: [{ no: 1, label: 'GROUND' }],
    rooms: [
      { id: 'hall', label: 'CORRIDOR', floor: 1, x: 0, y: 0, w: 660, h: 130, door: { wall: 'south', at: 300, w: 80 } },
      { id: 'main', label: 'MAIN ROOM', floor: 1, x: 0, y: 130, w: 660, h: 400, door: { wall: 'north', at: 300, w: 80 } },
    ],
    desk: { floor: 1, room: 'main', x: 20, y: 154 },
    openings: [{ x: 300, y: 124, w: 80, h: 6 }, { x: 300, y: 524, w: 80, h: 6 }],
    includes: ['RUG', 'PLANT'],
  },
  {
    level: 3,
    key: 'FLAT',
    name: 'FLAT',
    tagline: 'Doors between the sleeping and the living. The first real quiet.',
    price: 950000,
    slots: 11,
    plot: 3,
    floors: [{ no: 1, label: 'GROUND' }],
    rooms: [
      { id: 'living', label: 'LIVING ROOM', floor: 1, x: 0, y: 0, w: 430, h: 430, door: { wall: 'south', at: 180, w: 80 } },
      { id: 'kitchen', label: 'KITCHEN', floor: 1, x: 430, y: 0, w: 230, h: 210, door: { wall: 'west', at: 90, w: 60 } },
      { id: 'bedroom', label: 'BEDROOM', floor: 1, x: 430, y: 210, w: 230, h: 220, door: { wall: 'west', at: 90, w: 60 } },
    ],
    desk: { floor: 1, room: 'living', x: 20, y: 24 },
    openings: [{ x: 180, y: 424, w: 80, h: 6 }, { x: 424, y: 90, w: 6, h: 60 }, { x: 424, y: 290, w: 6, h: 60 }],
    includes: ['RUG', 'PLANT'],
  },
  {
    level: 4,
    key: 'DUPLEX',
    name: 'DUPLEX',
    tagline: 'Two floors. The desk stays downstairs; the quiet goes up.',
    price: 3200000,
    slots: 16,
    plot: 4,
    floors: [{ no: 1, label: 'GROUND' }, { no: 2, label: 'UPSTAIRS' }],
    rooms: [
      { id: 'living', label: 'LIVING ROOM', floor: 1, x: 0, y: 0, w: 430, h: 430, door: { wall: 'south', at: 180, w: 80 } },
      { id: 'kitchen', label: 'KITCHEN', floor: 1, x: 430, y: 0, w: 230, h: 210, door: { wall: 'west', at: 90, w: 60 } },
      { id: 'store', label: 'STORE', floor: 1, x: 430, y: 210, w: 230, h: 220, door: { wall: 'west', at: 90, w: 60 } },
      { id: 'bedroom', label: 'BEDROOM', floor: 2, x: 0, y: 0, w: 340, h: 300, door: { wall: 'south', at: 140, w: 70 } },
      { id: 'bath', label: 'BATHROOM', floor: 2, x: 0, y: 300, w: 340, h: 130, door: { wall: 'north', at: 140, w: 70 } },
      { id: 'balcony', label: 'BALCONY', floor: 2, x: 340, y: 0, w: 320, h: 430, door: { wall: 'west', at: 180, w: 70 } },
    ],
    desk: { floor: 1, room: 'living', x: 20, y: 24 },
    openings: [
      { x: 180, y: 424, w: 80, h: 6 }, { x: 424, y: 90, w: 6, h: 60 }, { x: 424, y: 290, w: 6, h: 60 },
      { x: 140, y: 294, w: 70, h: 6 }, { x: 334, y: 180, w: 6, h: 70 },
    ],
    stairs: [{ floor: 1, x: 320, y: 320, w: 90, h: 90, to: 2 }, { floor: 2, x: 240, y: 180, w: 90, h: 90, to: 1 }],
    includes: ['RUG', 'PLANT'],
  },
  {
    level: 5,
    key: 'COMPOUND',
    name: 'COMPOUND',
    tagline: 'Your own gate, your own yard, a shop by the road and a BQ behind.',
    price: 12500000,
    slots: 24,
    plot: 6,
    floors: [{ no: 1, label: 'GROUND' }],
    rooms: [
      { id: 'yard', label: 'YARD', floor: 1, x: 380, y: 0, w: 280, h: 150, door: { wall: 'south', at: 100, w: 60 } },
      { id: 'bq', label: 'BQ', floor: 1, x: 0, y: 0, w: 200, h: 150, door: { wall: 'south', at: 70, w: 60 } },
      { id: 'shop', label: 'SHOP', floor: 1, x: 200, y: 0, w: 180, h: 150, door: { wall: 'south', at: 60, w: 60 } },
      { id: 'living', label: 'MAIN HOUSE', floor: 1, x: 0, y: 150, w: 430, h: 300, door: { wall: 'south', at: 180, w: 80 } },
      { id: 'bedroom', label: 'BEDROOM', floor: 1, x: 430, y: 150, w: 230, h: 300, door: { wall: 'west', at: 140, w: 60 } },
    ],
    desk: { floor: 1, room: 'living', x: 20, y: 174 },
    openings: [
      { x: 180, y: 444, w: 80, h: 6 }, { x: 70, y: 144, w: 60, h: 6 },
      { x: 260, y: 144, w: 60, h: 6 }, { x: 424, y: 270, w: 6, h: 60 },
    ],
    includes: ['RUG', 'PLANT'],
  },
];

export const MAX_TIER = TIERS[TIERS.length - 1].level;

// A base whose HomeBase row does not exist yet is level 1, which is also the
// schema default — so the desk keeps standing in a room on a brand new base.
export const tierFor = (level) => {
  const n = Math.round(Number(level) || 1);
  return TIERS.find((t) => t.level === n) || TIERS[0];
};

export const tierAbove = (level) => {
  const n = Math.round(Number(level) || 1);
  return TIERS.find((t) => t.level === n + 1) || null;
};

// ─── The furniture catalogue ──────────────────────────────────────────────────
// Plan-view items, one per mock sprite in public/Frames/User-base/Plan view/.
//
// THIS IS THE MOCK-ASSET GAP, WRITTEN DOWN. The desk has 11 hand-drawn SVG
// assets; a plan view needs a top-down sprite and a footprint for every item you
// can own. The 12 here are drawn as placeholders in the existing ink/sage
// language, sized to their plan footprint (so width/height are the drop-in
// contract for real art), and priced in naira so the ladder has numbers to sell.
//
// `tier` is the level an item unlocks at: the rules layer refuses a GENERATOR in
// a ONE ROOM, which is what makes an upgrade mean something before the store's
// checkout exists.
const SPRITES = '/Frames/User-base/Plan%20view';

export const FURNITURE = [
  { id: 'RUG',        label: 'RUG',        w: 110, h: 76, tier: 1, price: 9500,    asset: `${SPRITES}/Rug.svg`,        best: 'anywhere' },
  { id: 'PLANT',      label: 'PLANT',      w: 30,  h: 30, tier: 1, price: 4500,    asset: `${SPRITES}/Plant.svg`,      best: 'a corner' },
  { id: 'SHELF',      label: 'SHELF',      w: 78,  h: 26, tier: 1, price: 24000,   asset: `${SPRITES}/Shelf.svg`,      best: 'against a wall' },
  { id: 'TABLE',      label: 'TABLE',      w: 62,  h: 44, tier: 1, price: 30000,   asset: `${SPRITES}/Table.svg`,      best: 'the middle' },
  { id: 'BED',        label: 'BED',        w: 96,  h: 78, tier: 2, price: 38000,   asset: `${SPRITES}/Bed.svg`,        best: 'the quiet end' },
  { id: 'WARDROBE',   label: 'WARDROBE',   w: 66,  h: 44, tier: 2, price: 52000,   asset: `${SPRITES}/Wardrobe.svg`,   best: 'a corner' },
  { id: 'SOFA',       label: 'SOFA',       w: 104, h: 44, tier: 2, price: 65000,   asset: `${SPRITES}/Sofa.svg`,       best: 'facing the TV' },
  { id: 'STOVE',      label: 'STOVE',      w: 42,  h: 34, tier: 3, price: 85000,   asset: `${SPRITES}/Stove.svg`,      best: 'the kitchen' },
  { id: 'TELEVISION', label: 'TELEVISION', w: 74,  h: 22, tier: 3, price: 95000,   asset: `${SPRITES}/Television.svg`, best: 'a wall' },
  { id: 'FRIDGE',     label: 'FRIDGE',     w: 40,  h: 36, tier: 3, price: 120000,  asset: `${SPRITES}/Fridge.svg`,     best: 'the kitchen' },
  { id: 'WATER TANK', label: 'WATER TANK', w: 34,  h: 34, tier: 4, price: 70000,   asset: `${SPRITES}/Water%20Tank.svg`, best: 'outside' },
  { id: 'GENERATOR',  label: 'GENERATOR',  w: 44,  h: 30, tier: 4, price: 150000,  asset: `${SPRITES}/Generator.svg`,  best: 'outside' },
];

export const FURNITURE_BY_ID = FURNITURE.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});

export const furnitureById = (id) => FURNITURE_BY_ID[id] || null;

// What a new base already owns. The plan should not open empty: two items on the
// floor is the difference between "a room" and "a rectangle".
export const FREE_FURNITURE = ['RUG', 'PLANT'];

// ─── Money ────────────────────────────────────────────────────────────────────
// The real store prices items as strings ('90 DT' — see DESK_CUSTOMIZER_ITEMS in
// pages/[username].js) and ownedDeskItems is component state that resets. The
// catalogue above is the fix's shape: a number, in naira, on the item and on the
// tier. Checkout is still not wired, and every screen that shows a price says so.
export const formatNaira = (value) => {
  const n = Math.max(0, Math.round(Number(value) || 0));
  return `₦${n.toLocaleString('en-NG')}`;
};

// ─── Geometry ─────────────────────────────────────────────────────────────────
// Everything the plan draws is derived from the tier: no page carries its own copy
// of a room list, so a fourth scale (the plot, in MapPosition terms) can be added
// without touching the renderer.
export const roomsOnFloor = (tier, floorNo) => tier.rooms.filter((r) => r.floor === Number(floorNo || 1));

export const planBounds = (tier) => tier.rooms.reduce(
  (acc, r) => ({ w: Math.max(acc.w, r.x + r.w), h: Math.max(acc.h, r.y + r.h) }),
  { w: 0, h: 0 }
);

// Where the desk stands, in plan units. Anchored rather than draggable: the desk
// is the base's centre of gravity (every drawer, the customiser and the store hang
// off it), so it stays put and the furniture arranges itself around it.
export const deskRectFor = (tier, floorNo = 1) => {
  const anchor = tier.desk;
  if (Number(floorNo || 1) !== anchor.floor) return null;
  return { x: anchor.x, y: anchor.y, w: DESK_UNITS.w, h: DESK_UNITS.h, room: anchor.room };
};

// The floor space furniture may never use: the desk's footprint (with a small
// breathing margin) and the stairs. A plan view where things can sit inside the
// desk reads as broken immediately.
export const reservedRects = (tier, floorNo = 1) => {
  const rects = [];
  const desk = deskRectFor(tier, floorNo);
  if (desk) rects.push({ ...desk, pad: 10, kind: 'desk' });
  (tier.stairs || []).filter((s) => s.floor === Number(floorNo || 1))
    .forEach((s) => rects.push({ x: s.x, y: s.y, w: s.w, h: s.h, pad: 0, kind: 'stairs' }));
  return rects;
};

export const itemRect = (item, def = furnitureById(item && item.id)) => {
  if (!def) return null;
  const rotated = Number(item && item.rot) % 180 !== 0;
  return { x: Number(item.x) || 0, y: Number(item.y) || 0, w: rotated ? def.h : def.w, h: rotated ? def.w : def.h };
};

export const snap = (value) => Math.round((Number(value) || 0) / PLAN_SNAP) * PLAN_SNAP;

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// y-order: whatever stands lower on the plan is drawn in front, which is the one
// z-rule a plan view needs to stop looking like stickers.
export const sortForPlan = (items = []) => [...items].sort((a, b) => (Number(a.y) || 0) - (Number(b.y) || 0));

export const roomAt = (tier, floorNo, x, y) => roomsOnFloor(tier, floorNo)
  .find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;

// ─── The rules layer ──────────────────────────────────────────────────────────
// Five refusals, each with copy a person can act on. `canPlace` is pure: the same
// call answers "may I drop it here?" during a drag and "is the saved layout still
// legal?" after an upgrade moves the walls.
export const PLACE_REASONS = {
  OUT_OF_ROOM: 'Not inside a room on this floor',
  DESK_SPACE: 'The desk stands there',
  OCCUPIED: 'Something already stands there',
  FULL: 'This tier is full — store something or upgrade',
  TIER_LOCKED: 'Unlocks at a bigger home',
  UNKNOWN: 'That item is not in the catalogue',
};

export function canPlace({
  tier, floorNo = 1, items = [], id, x, y, rot = 0, ignoreId = null, countOnly = false,
}) {
  const def = furnitureById(id);
  if (!def) return { ok: false, reason: 'UNKNOWN', label: PLACE_REASONS.UNKNOWN };
  if (def.tier > tier.level) return { ok: false, reason: 'TIER_LOCKED', label: `${PLACE_REASONS.TIER_LOCKED} (${def.tier})` };

  const moving = ignoreId || id;
  const standing = items.filter((i) => i && i.id !== moving);
  const held = standing.filter((i) => furnitureById(i.id));
  if (!countOnly && held.length >= tier.slots) {
    return { ok: false, reason: 'FULL', label: PLACE_REASONS.FULL };
  }

  const rect = itemRect({ id, x, y, rot }, def);
  const inside = roomsOnFloor(tier, floorNo).some(
    (r) => rect.x >= r.x && rect.y >= r.y && rect.x + rect.w <= r.x + r.w && rect.y + rect.h <= r.y + r.h
  );
  if (!inside) return { ok: false, reason: 'OUT_OF_ROOM', label: PLACE_REASONS.OUT_OF_ROOM };

  const blocked = reservedRects(tier, floorNo)
    .find((r) => overlaps(rect, { x: r.x - r.pad, y: r.y - r.pad, w: r.w + r.pad * 2, h: r.h + r.pad * 2 }));
  if (blocked) {
    return { ok: false, reason: blocked.kind === 'stairs' ? 'OCCUPIED' : 'DESK_SPACE', label: blocked.kind === 'stairs' ? 'The stairs are there' : PLACE_REASONS.DESK_SPACE };
  }

  const clash = standing
    .filter((i) => Number(i.floor ?? 1) === Number(floorNo))
    .some((other) => {
      const otherRect = itemRect(other);
      return otherRect && overlaps(rect, otherRect);
    });
  if (clash) return { ok: false, reason: 'OCCUPIED', label: PLACE_REASONS.OCCUPIED };

  return { ok: true, reason: null, label: null, rect };
}

// The next legal spot, scanned on the snap grid from the door inwards. Deterministic
// on purpose: the probe can ask for a spot and then find the item there.
export function firstFreeSpot({ tier, floorNo = 1, items = [], id }) {
  const def = furnitureById(id);
  if (!def) return null;
  const rooms = roomsOnFloor(tier, floorNo);
  for (const room of rooms) {
    for (let y = room.y + PLAN_SNAP; y + def.h <= room.y + room.h - PLAN_SNAP; y += PLAN_SNAP) {
      for (let x = room.x + PLAN_SNAP; x + def.w <= room.x + room.w - PLAN_SNAP; x += PLAN_SNAP) {
        if (canPlace({ tier, floorNo, items, id, x, y }).ok) return { x, y };
      }
    }
  }
  // A smaller room may still take it rotated a quarter turn.
  for (const room of rooms) {
    for (let y = room.y + PLAN_SNAP; y + def.w <= room.y + room.h - PLAN_SNAP; y += PLAN_SNAP) {
      for (let x = room.x + PLAN_SNAP; x + def.h <= room.x + room.w - PLAN_SNAP; x += PLAN_SNAP) {
        if (canPlace({ tier, floorNo, items, id, x, y, rot: 90 }).ok) return { x, y, rot: 90 };
      }
    }
  }
  return null;
}

export const floorOf = (item) => Number((item && item.floor) || 1);

// ─── The contract: roomLayout v2 ──────────────────────────────────────────────
// v1 was `{version:1, items:[{id,x,y,zIndex}]}` — the desk. v2 keeps that field
// exactly as it was and adds the rooms:
//
//   { version: 2, tier: 2, floorNo: 1,
//     items: [{ id:'JOURNAL', x, y, zIndex }],           // on the desk surface
//     floor: [{ id:'RUG', x, y, rot, floor }] }          // standing in a room
//
// A v1 reader (an older client, or scripts/verify-base.js) still finds `items`
// and still understands every saved base. A v2 reader treats a v1 document as
// "desk only, no furniture" rather than as a reason to refuse to draw.
export const PLAN_LAYOUT_VERSION = 2;

export function parseRoomLayout(raw) {
  if (typeof raw !== 'string' || !raw.trim().startsWith('{')) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;

    const items = parsed.items
      .filter((item) => item && item.id)
      .map((item) => ({ id: item.id, x: Number(item.x) || 0, y: Number(item.y) || 0, zIndex: item.zIndex }));

    const floorItems = (Array.isArray(parsed.floor) ? parsed.floor : [])
      .filter((item) => item && furnitureById(item.id))
      .map((item) => ({
        id: item.id,
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        rot: Number(item.rot) || 0,
        floor: Number(item.floor) || 1,
      }));

    return {
      version: Number(parsed.version) || 1,
      tier: Number(parsed.tier) || null,
      floorNo: Number(parsed.floorNo) || 1,
      items,
      floor: floorItems,
    };
  } catch {
    // Unreadable is treated as "nothing saved", never as a crash: a base is
    // somebody's home, and a bad byte must not blank it.
    return null;
  }
}

export const serializeRoomLayout = ({ tier, deskItems = [], floorItems = [], floorNo = 1 }) => JSON.stringify({
  version: PLAN_LAYOUT_VERSION,
  tier: Math.round(Number(tier) || 1),
  floorNo: Math.round(Number(floorNo) || 1),
  items: deskItems.map(({ id, x, y, zIndex }) => ({
    id, x: Math.round(Number(x) || 0), y: Math.round(Number(y) || 0), zIndex,
  })),
  floor: floorItems.map(({ id, x, y, rot, floor }) => ({
    id,
    x: Math.round(Number(x) || 0),
    y: Math.round(Number(y) || 0),
    rot: Math.round(Number(rot) || 0),
    floor: Math.round(Number(floor) || 1),
  })),
});

// ─── Ownership ────────────────────────────────────────────────────────────────
// HomeBase.furniture is "what is equipped on this base" — the desk ids and the
// floor ids both live in it, which is why a placed item survives a reload without
// any new collection. `MYSTORE` / real purchases are the money pass; `extra` is
// the demo checkout the base page holds in component state, and it is labelled as
// such everywhere it is offered.
export const ownedFurnitureIds = (home, extra = []) => {
  const equipped = home && Array.isArray(home.furniture) ? home.furniture : [];
  return Array.from(new Set([
    ...FREE_FURNITURE,
    ...equipped.filter((id) => furnitureById(id)),
    ...extra.filter((id) => furnitureById(id)),
  ]));
};

export const equippedIds = (home) => (home && Array.isArray(home.furniture) ? home.furniture : []);

// Old bases carry ids and no positions (v1 `furniture` only). Rather than show an
// empty room, the ids are placed by the same rules a drag obeys — deterministic,
// so a reload cannot shuffle somebody's furniture.
export function placeAll({ tier, floorNo = 1, ids = [], items = [] }) {
  return ids.reduce((acc, id) => {
    const spot = firstFreeSpot({ tier, floorNo, items: acc, id });
    if (!spot) return acc;
    return [...acc, { id, x: spot.x, y: spot.y, rot: spot.rot || 0, floor: Number(floorNo) || 1 }];
  }, items);
}

export const slotsUsed = (items = []) => items.filter((i) => furnitureById(i && i.id)).length;

// ─── Scale ────────────────────────────────────────────────────────────────────
// One number decides how big a base is drawn, and both the plan and the desk's
// drag maths read it from here — a drag of one screen pixel must move an item one
// screen pixel at any zoom, and that only stays true if there is one scale.
export function planScaleFor(tier, canvas = {}) {
  const bounds = planBounds(tier);
  const w = Number(canvas.w) || 0;
  const h = Number(canvas.h) || 0;
  if (!bounds.w || !bounds.h || !w || !h) return 1;
  const narrow = w < 700;
  const gutterX = narrow ? 20 : 96;
  const gutterY = narrow ? 128 : 190;
  const fit = Math.min((w - gutterX) / bounds.w, (h - gutterY) / bounds.h);
  return Math.max(0.28, Math.min(MAX_PLAN_SCALE, fit));
}
