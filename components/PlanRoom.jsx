// components/PlanRoom.jsx — a base, from above.
//
// The base used to be a desk floating on the dream map: the desk *was* the home.
// This draws the other half of the idea — the rooms the desk stands in — as a plan
// view, at whatever tier HomeBase.upgradeLevel says the base has reached.
//
// Three properties matter, and they are why this is a component and not markup in
// pages/[username].js:
//
//   ONE DESK, ONE CONTAINER. The mounted DeskScene is passed in as `deskSlot` and
//   positioned at the desk's anchored corner. There is deliberately no second,
//   room-shaped editor: the same desk, the same drag, the same save, or the store
//   inside the base stops being the business.
//
//   THE RULES ARE VISIBLE. A drag asks lib/plan.js `canPlace` on every move and
//   paints the answer — sage when it will land, flare when it will not, with the
//   reason in words. Dropping an illegal position puts the item back.
//
//   PRESENCE IS CHEAP AND HONEST. The owner's monogram avatar stands in the room by
//   the desk (the visitor's own stands at the door) — a fixed spot, not a walkable
//   character. Walking is the post-MVP Sims move; "someone lives here" is this.
import { useEffect, useMemo, useRef, useState } from 'react';
import MockAvatar from './MockAvatar';
import {
  themePalette, roomsOnFloor, planBounds, deskRectFor, sortForPlan,
  snap, canPlace, furnitureById, DESK_UNITS, PLAN_SNAP,
} from '../lib/plan';

const FLARE = '#E9040C';

function Room({ room, palette, children }) {
  return (
    <div
      data-room={room.id}
      style={{
        position: 'absolute', left: room.x, top: room.y, width: room.w, height: room.h,
        background: palette.floor,
        backgroundColor: palette.floor,
        backgroundImage: [
          `linear-gradient(to right, ${palette.grid} 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${palette.grid} 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: `${PLAN_SNAP}px ${PLAN_SNAP}px`,
        border: `2px solid ${palette.wall}`,
        boxSizing: 'content-box',
        marginLeft: -2, marginTop: -2,
      }}
    >
      <span style={{
        position: 'absolute', left: 6, top: 4, fontFamily: 'monospace', fontSize: 9,
        letterSpacing: '0.14em', color: palette.wall, opacity: 0.75, pointerEvents: 'none',
        textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>{room.label}</span>
      {children}
    </div>
  );
}

// A doorway is a hole in the wall with a leaf on it, which is all a plan view
// needs to read as "you can walk through here".
function Opening({ rect, palette, floorColor }) {
  const horizontal = rect.w >= rect.h;
  return (
    <>
      <div style={{
        position: 'absolute', left: rect.x - 2, top: rect.y - 2, width: rect.w + 4, height: rect.h + 4,
        background: floorColor, zIndex: 3, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: horizontal ? rect.x + 4 : rect.x - (rect.h / 2) + rect.h / 2,
        top: horizontal ? rect.y - (rect.w / 2) + rect.w / 2 : rect.y + 4,
        width: horizontal ? rect.w - 8 : 2,
        height: horizontal ? 2 : rect.h - 8,
        background: palette.wall, opacity: 0.9, zIndex: 4, pointerEvents: 'none',
        transform: horizontal ? 'none' : 'none',
      }} />
    </>
  );
}

export default function PlanRoom({
  tier,
  floorNo = 1,
  theme = 'jungle',
  items = [],
  editable = false,
  scale = 1,
  deskSlot = null,
  ownerUsername = '',
  viewerUsername = '',
  isSelf = true,
  visitorNote = null,
  selectedId = null,
  onCommit,
  onSelectItem,
}) {
  const palette = themePalette(theme);
  const bounds = planBounds(tier);
  const rooms = roomsOnFloor(tier, floorNo);
  const desk = deskRectFor(tier, floorNo);
  const stageRef = useRef(null);
  const itemsRef = useRef(items);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const [drag, setDrag] = useState(null);

  useEffect(() => { itemsRef.current = items; }, [items]);

  const placed = useMemo(
    () => sortForPlan(items.filter((item) => item && furnitureById(item.id) && Number(item.floor || 1) === Number(floorNo))),
    [items, floorNo]
  );

  // Where a person stands. The owner is beside the desk when the room has space and
  // in front of it when it does not; the visitor is just inside the door. Both are
  // single fixed spots — a walkable character is the post-MVP move, and pretending
  // otherwise would be a lie in the DOM.
  const doorRect = (room) => {
    if (!room || !room.door) return null;
    const d = room.door;
    const t = 6;
    if (d.wall === 'south') return { x: room.x + d.at, y: room.y + room.h - t / 2, w: d.w, h: t, wall: 'south' };
    if (d.wall === 'north') return { x: room.x + d.at, y: room.y - t / 2, w: d.w, h: t, wall: 'north' };
    if (d.wall === 'east') return { x: room.x + room.w - t / 2, y: room.y + d.at, w: t, h: d.w, wall: 'east' };
    return { x: room.x - t / 2, y: room.y + d.at, w: t, h: d.w, wall: 'west' };
  };

  const deskRoom = desk ? rooms.find((r) => r.id === desk.room) || rooms[0] : rooms[0];
  const door = doorRect(deskRoom);
  const AV = 42;

  const ownerSpot = useMemo(() => {
    if (!deskRoom) return { x: 24, y: 24 };
    const candidates = desk ? [
      { x: desk.x + DESK_UNITS.w + 12, y: desk.y + DESK_UNITS.h - AV - 34 },
      { x: desk.x + 20, y: desk.y + DESK_UNITS.h + 8 },
      { x: deskRoom.x + deskRoom.w - AV - 14, y: deskRoom.y + 14 },
    ] : [{ x: deskRoom.x + 14, y: deskRoom.y + 14 }];
    const fits = (s) => s.x >= deskRoom.x + 8 && s.y >= deskRoom.y + 8
      && s.x + AV <= deskRoom.x + deskRoom.w - 8 && s.y + AV + 14 <= deskRoom.y + deskRoom.h - 8;
    return candidates.find(fits) || { x: deskRoom.x + 14, y: deskRoom.y + deskRoom.h - AV - 26 };
  }, [deskRoom, desk]);

  const visitorSpot = useMemo(() => {
    if (!deskRoom || !door) return { x: ownerSpot.x + AV + 8, y: ownerSpot.y };
    const inside = 10;
    if (door.wall === 'south') return { x: door.x + door.w / 2 - AV / 2, y: deskRoom.y + deskRoom.h - AV - inside };
    if (door.wall === 'north') return { x: door.x + door.w / 2 - AV / 2, y: deskRoom.y + inside };
    if (door.wall === 'east') return { x: deskRoom.x + deskRoom.w - AV - inside, y: door.y + door.h / 2 - AV / 2 };
    return { x: deskRoom.x + inside, y: door.y + door.h / 2 - AV / 2 };
  }, [deskRoom, door, ownerSpot]);

  // ── Dragging furniture ──────────────────────────────────────────────────────
  // The listeners go on the window because the pointer leaves a 12-unit item almost
  // immediately at any zoom. Position arrives in plan units (screen ÷ scale), which
  // is why one drag feels the same on a phone and on a desktop.
  const handleStart = (event, item) => {
    if (!editable) return;
    const point = 'touches' in event ? event.touches[0] : event;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const px = (point.clientX - rect.left) / scale;
    const py = (point.clientY - rect.top) / scale;
    dragRef.current = {
      id: item.id, rot: item.rot || 0,
      offsetX: px - item.x, offsetY: py - item.y,
      startX: item.x, startY: item.y,
      x: item.x, y: item.y, valid: true, label: null,
    };
    movedRef.current = false;
    setDrag({ ...dragRef.current });
  };

  const draggingId = drag ? drag.id : null;

  useEffect(() => {
    if (!draggingId) return undefined;

    const move = (event) => {
      const current = dragRef.current;
      const stage = stageRef.current;
      if (!current || !stage) return;
      const point = 'touches' in event ? event.touches[0] : event;
      const rect = stage.getBoundingClientRect();
      const x = snap((point.clientX - rect.left) / scale - current.offsetX);
      const y = snap((point.clientY - rect.top) / scale - current.offsetY);
      if (x !== current.startX || y !== current.startY) movedRef.current = true;

      const verdict = canPlace({
        tier, floorNo, items: itemsRef.current, id: current.id, x, y, rot: current.rot, ignoreId: current.id,
      });
      current.x = x; current.y = y; current.valid = verdict.ok; current.label = verdict.label;
      setDrag({ ...current });
      if (event.cancelable) event.preventDefault();
    };

    const end = () => {
      const current = dragRef.current;
      dragRef.current = null;
      if (current && movedRef.current) {
        suppressClickUntilRef.current = Date.now() + 220;
        // A legal drop is a change to the base and is saved; an illegal one is not,
        // so the item simply reappears where it stood.
        if (current.valid) {
          onCommit?.(itemsRef.current.map((item) => (
            item.id === current.id ? { ...item, x: current.x, y: current.y } : item
          )));
        }
      }
      setDrag(null);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, [draggingId, floorNo, onCommit, scale, tier]);

  const showLabels = scale >= 0.7;
  const personStyle = (spot) => ({
    position: 'absolute', left: spot.x, top: spot.y, width: AV, zIndex: 820, pointerEvents: 'none',
  });
  const personLabel = (text, sub) => (showLabels ? (
    <>
      <div style={{
        marginTop: 3, fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em',
        color: palette.wall, textAlign: 'center', whiteSpace: 'nowrap',
      }}>{text}</div>
      <div style={{
        fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em',
        color: palette.wall, opacity: 0.65, textAlign: 'center', whiteSpace: 'nowrap',
      }}>{sub}</div>
    </>
  ) : null);

  return (
    <div
      ref={stageRef}
      data-plan-stage=""
      data-plan-tier={tier.level}
      data-plan-floor={floorNo}
      data-plan-scale={Number(scale.toFixed(3))}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        width: bounds.w, height: bounds.h,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        // Above the jungle: the plan is the base standing *on* the map, not a layer
        // under it. The trees are z-index 5–6 (see MapBackground), so the plan is 8.
        zIndex: 8,
      }}
    >
      {/* The plot: what a tier's footprint looks like from the map's point of view. */}
      <div style={{
        position: 'absolute', inset: -18,
        border: `2px dashed ${palette.wall}`, opacity: 0.32, pointerEvents: 'none',
        boxShadow: '0 40px 90px rgba(0,0,0,0.45)',
      }} />

      {rooms.map((room) => <Room key={room.id} room={room} palette={palette} />)}

      {(tier.openings || []).map((rect, i) => (
        <Opening key={`${rect.x}-${rect.y}-${i}`} rect={rect} palette={palette} floorColor={palette.floor} />
      ))}

      {(tier.stairs || []).filter((s) => s.floor === Number(floorNo)).map((s) => (
        <div key={`${s.x}-${s.y}-${s.to}`} style={{
          position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h,
          border: `1px dashed ${palette.wall}`, background: 'rgba(171,212,158,0.10)',
          zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/Frames/User-base/Plan%20view/Stairs.svg" alt="" aria-hidden="true" style={{ width: s.w * 0.7 }} />
          <span style={{
            position: 'absolute', bottom: 2, fontFamily: 'monospace', fontSize: 9,
            letterSpacing: '0.12em', color: palette.wall, opacity: 0.8,
          }}>TO FLOOR {s.to}</span>
        </div>
      ))}

      {/* The furniture, drawn lower-is-in-front so the plan reads in depth. */}
      {placed.map((item) => {
        const def = furnitureById(item.id);
        const live = drag && drag.id === item.id ? drag : null;
        const x = live ? live.x : item.x;
        const y = live ? live.y : item.y;
        const rot = (live ? live.rot : item.rot) || 0;
        const bad = Boolean(live && live.valid === false);
        return (
          <button
            key={item.id}
            type="button"
            data-plan-item={item.id}
            aria-label={editable ? `Move ${def.label} on the floor` : `Furniture ${def.label}`}
            onMouseDown={(e) => handleStart(e, { ...item, x, y })}
            onTouchStart={(e) => handleStart(e, { ...item, x, y })}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              if (Date.now() < suppressClickUntilRef.current || movedRef.current) return;
              onSelectItem?.(item.id);
            }}
            style={{
              position: 'absolute', left: x, top: y, width: def.w, height: def.h,
              transform: rot ? `rotate(${rot}deg)` : 'none',
              background: 'transparent', border: 'none', padding: 0, margin: 0,
              zIndex: 100 + Math.round(y),
              cursor: editable ? 'grab' : 'default',
              pointerEvents: editable ? 'auto' : 'none',
              outline: bad ? `2px solid ${FLARE}` : (selectedId === item.id ? `2px solid ${palette.wall}` : 'none'),
              outlineOffset: 2,
            }}
          >
            <img
              src={def.asset}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                width: '100%', height: '100%', display: 'block',
                // The art is not the handle. A mouse pressed on an <img> starts a
                // native image drag, and a native drag swallows every later
                // mousemove/mouseup — which is exactly how a floor drag used to move
                // an item on screen and then never commit it. (The desk's assets are
                // pointer-events:none for the same reason.)
                pointerEvents: 'none',
                filter: bad ? 'grayscale(1) opacity(0.55)' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
              }}
            />
          </button>
        );
      })}

      {/* The one desk. Same component, same drag, same save as before the rooms. */}
      {desk && deskSlot ? (
        <div
          data-plan-desk=""
          style={{
            position: 'absolute', left: desk.x, top: desk.y,
            width: DESK_UNITS.w, height: DESK_UNITS.h,
            zIndex: 100 + Math.round(desk.y),
            pointerEvents: 'auto',
          }}
        >
          {deskSlot}
        </div>
      ) : null}

      {/* Someone lives here: the owner by the desk, the visitor at the door. */}
      <div data-presence="owner" aria-label={`${ownerUsername || 'the owner'} is at home`} style={personStyle(ownerSpot)}>
        <MockAvatar
          username={ownerUsername}
          size={AV}
          radius={8}
          style={{ border: `2px solid ${palette.wall}`, boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}
        />
        {personLabel(`@${String(ownerUsername || '').toUpperCase()}`, 'AT HOME')}
      </div>

      {!isSelf && viewerUsername ? (
        <div data-presence="visitor" aria-label="you are standing at the door" style={personStyle(visitorSpot)}>
          <MockAvatar
            username={viewerUsername}
            size={AV}
            radius={8}
            style={{ border: `2px dashed ${palette.wall}`, opacity: 0.94 }}
          />
          {personLabel('YOU', visitorNote ? 'YOU KNOCKED' : 'AT THE DOOR')}
        </div>
      ) : null}

      {drag && drag.valid === false && drag.label ? (
        <div style={{
          position: 'absolute',
          left: Math.max(0, Math.min(bounds.w - 220, drag.x)),
          top: Math.max(0, drag.y - 28),
          background: '#101010', border: `1px solid ${FLARE}`, color: FLARE,
          fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '4px 8px', zIndex: 900, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>{drag.label}</div>
      ) : null}

      {editable && placed.length === 0 && !drag ? (
        <div data-plan-hint="" style={{
          position: 'absolute', left: '50%', top: desk ? desk.y + DESK_UNITS.h + 24 : 24,
          transform: 'translateX(-50%)', fontFamily: 'monospace', fontSize: 12,
          letterSpacing: '0.14em', color: palette.wall, opacity: 0.7, zIndex: 810,
          pointerEvents: 'none', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>Tap + to furnish the room</div>
      ) : null}
    </div>
  );
}
