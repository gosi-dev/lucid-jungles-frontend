// [username].js — User Base (fusion of OG's [username].js + Kura + Dreamlog + Dojo)
// Design: Frozen-canvas jungle map with dream desk, profile drawer, tabs for
// HOME (desk + jungle), KURA (AI companion), DREAMS (journal), DOJO (fitness)
// The jungle trees around the user icon match the dreaming.js procedural map.

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import { useHideBottomNav } from '../hooks/useHideBottomNav';
// Kept from rebuilt's previous /[username].js (commit da91698): the dynamic
// single-segment route must not fabricate a base for a typo. See the route gate
// at the bottom of this file.
import NotFoundScreen from '../components/NotFoundScreen';
import { useUsernameLookup, USER_LOOKUP } from '../hooks/useUsernameLookup';
import { useBaseLookup, BASE_LOOKUP } from '../hooks/useBaseLookup';
import MockAvatar from '../components/MockAvatar';
import VitalBars, { deriveVitals } from '../components/VitalBars';
// The base as a plan view: tiers, rooms and the rules that make placing furniture
// feel like a home. One engine, four scales — the desk below is still the same desk.
import PlanRoom from '../components/PlanRoom';
import {
  FURNITURE, FREE_FURNITURE, tierFor, planScaleFor,
  canPlace, firstFreeSpot, furnitureById, floorOf, formatNaira, ownedFurnitureIds,
  placeAll, roomsOnFloor, slotsUsed,
  parseRoomLayout, serializeRoomLayout, deskRectFor, planBounds,
} from '../lib/plan';
import {
  FaCaretRight, FaChevronUp, FaChevronDown, FaUserFriends,
  Sparkles, Send, Heart, MessageCircle, Zap, ArrowLeft,
  BookOpen, Plus, Moon, Star, Dumbbell, Target, Clock, Flame,
  User, Settings, Ticket, ShoppingBag, LogOut, ChevronRight,
} from 'lucide-react';

// ─── Grid constants (matching dreaming.js) ───
const GRID_SIZE = 77;

// A follower count belongs in the drawer strip as 29.7K, not 29700.
const formatCount = (value) => {
  const n = Number(value) || 0;
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
};

// ─── Seeded random (deterministic, matching dreaming.js) ───
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// ─── Entity sizing (matching dreaming.js) ───
const getEntitySizing = (type) => {
  if (type === 'building') return { iconSize: 5, totalSpace: 5 };
  if (type === 'community') return { iconSize: 5, totalSpace: 5 };
  return { iconSize: 1, totalSpace: 1 };
};

// ─── Full world entities (same coordinates as dreaming.js) ───
const MAP_ENTITIES = [
  { id: 'kura', type: 'user', gridX: 0, gridY: 0, name: 'YOUR KURA', href: '/kura' },
  { id: 'bonzo', type: 'user', gridX: -3, gridY: 7, name: 'BONZO', href: '/bonzo' },
  { id: 'moj', type: 'community', gridX: -12, gridY: -5, name: 'OLD SECRETARIAT', href: '/moj' },
  { id: 'ccstudios', type: 'community', gridX: 8, gridY: 3, name: 'CAPPUCCINO STUDIOX', href: '/cappuccinostudiox' },
  { id: 'dojo', type: 'community', gridX: 14, gridY: -8, name: "BONZO'S DOJO", href: '/dojo' },
];

function resolveUserGridPosition(username) {
  const key = (username || '').toLowerCase();
  const matched = MAP_ENTITIES.find((entity) => entity.id === key && entity.type === 'user');
  if (matched) return {
    gridX: matched.gridX,
    gridY: matched.gridY,
  };
  return {
    gridX: 0,
    gridY: 0,
  };
}

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
        if (x === entity.gridX && y === entity.gridY) {
          return { zone: 'user-icon', entity, sizing };
        }
        return { zone: 'user-buffer', entity, sizing };
      }

      const inIcon = x >= entity.gridX && x <= iconEndX && y >= entity.gridY && y <= iconEndY;
      if (inIcon) {
        const onEdge = x === entity.gridX || x === iconEndX || y === entity.gridY || y === iconEndY;
        return {
          zone: onEdge ? 'community-icon-border' : 'community-icon-center',
          entity,
          sizing,
        };
      }

      return { zone: 'community-buffer', entity, sizing };
    }

    return { zone: 'unoccupied' };
  };

  const checkNaturalCollision2x2 = (x, y) => {
    for (let dx = -1; dx <= 0; dx++) {
      for (let dy = -1; dy <= 0; dy++) {
        if (occupiedPositions.has(`${x + dx},${y + dy}`)) return true;
      }
    }
    return false;
  };

  const canBigTreeSpawn = (x, y) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (bigTreePositions.has(`${x + dx},${y + dy}`)) return false;
      }
    }
    return true;
  };

  const isAdjacentToCommunityIcon = (x, y) => {
    for (let dx = -1; dx <= 0; dx++) {
      for (let dy = -1; dy <= 0; dy++) {
        for (let ax = -1; ax <= 1; ax++) {
          for (let ay = -1; ay <= 1; ay++) {
            const z = getEntityZone(x + dx + ax, y + dy + ay);
            if (z.zone === 'community-icon-center' || z.zone === 'community-icon-border') return true;
          }
        }
      }
    }
    return false;
  };

  // PASS 1: 2x2 trees on grid vertices
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
        for (let dx = -1; dx <= 0; dx++) {
          for (let dy = -1; dy <= 0; dy++) {
            const z = getEntityZone(x + dx, y + dy);
            if (z.zone !== 'community-icon-border') {
              canSpawnSmallTree = false;
              break;
            }
          }
          if (!canSpawnSmallTree) break;
        }
        if (!canSpawnSmallTree) continue;
      }

      if (canSpawnBigTree && isAdjacentToCommunityIcon(x, y)) {
        canSpawnBigTree = false;
      }

      if (!allUnoccupied && checkNaturalCollision2x2(x, y)) continue;

      if (rand < lowestSpawnChance) {
        const typeRand = seededRandom(seed + 777);

        if (canSpawnBigTree && typeRand < 0.40 && (allUnoccupied || canBigTreeSpawn(x, y))) {
          const variant = seededRandom(seed + 999) < 0.5 ? 1 : 2;
          components.push({ id: `big-tree-${x}-${y}`, type: 'big-tree', variant, gridX: x, gridY: y });
          bigTreePositions.add(`${x},${y}`);
          for (let dx = -1; dx <= 0; dx++) {
            for (let dy = -1; dy <= 0; dy++) {
              occupiedPositions.add(`${x + dx},${y + dy}`);
            }
          }
        } else if (canSpawnSmallTree && typeRand >= 0.40) {
          const isPalm = seededRandom(seed + 888) < 0.20;
          const variant = seededRandom(seed + 777) < 0.5 ? 1 : 2;
          components.push({
            id: `${isPalm ? 'palm' : 'small-tree'}-${x}-${y}`,
            type: isPalm ? 'palm' : 'small-tree',
            variant: isPalm ? undefined : variant,
            gridX: x,
            gridY: y,
          });
          for (let dx = -1; dx <= 0; dx++) {
            for (let dy = -1; dy <= 0; dy++) {
              occupiedPositions.add(`${x + dx},${y + dy}`);
            }
          }
        }
      }
    }
  }

  // PASS 2: 1x1 ground cover
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

const IMAGE_PATHS = {
  'big-tree-1': '/jungle/Property%201=A.svg',
  'big-tree-2': '/jungle/Property%201=B.svg',
  'small-tree-1': '/jungle/Property%201=A%20(1).svg',
  'small-tree-2': '/jungle/Property%201=B%20(1).svg',
  palm: '/jungle/Property%201=Palm%20Tree.svg',
  shrub: '/jungle/Property%201=Shrubs.svg',
  rock: '/jungle/Property%201=Rocks.svg',
  flowers: '/jungle/Property%201=Flowers.svg',
  'small-tree-extra': '/jungle/Property%201=Shrubs.svg',
};

const getImagePath = (comp) => {
  if (comp.type === 'big-tree') return IMAGE_PATHS[`big-tree-${comp.variant || 1}`];
  if (comp.type === 'small-tree') return IMAGE_PATHS[`small-tree-${comp.variant || 1}`];
  return IMAGE_PATHS[comp.type];
};
/*
            {deskCustomizerOpen && currentCustomizerItem && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#101010',
                  zIndex: 30,
                  overflow: 'hidden',
                }}
                onClick={() => setDeskCustomizerOpen(false)}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: isDesktop ? 10 : 8,
                    border: `solid ${isDesktop ? 5 : 3}px #ABD49E`,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: isDesktop ? 34 : 20,
                    left: isDesktop ? 44 : 24,
                    width: isDesktop ? 52 : 40,
                    height: isDesktop ? 52 : 40,
                    borderRadius: '999px',
                    border: '1.5px solid #ABD49E',
                    background: '#101010',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ABD49E',
                    fontSize: isDesktop ? 18 : 16,
                    lineHeight: 1,
                    cursor: 'pointer',
                    zIndex: 5,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeskCustomizerOpen(false);
                  }}
                >
                  ↩
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: isDesktop ? 30 : 18,
                    right: isDesktop ? 34 : 20,
                    display: 'flex',
                    gap: isDesktop ? 10 : 8,
                    alignItems: 'stretch',
                    zIndex: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      background: '#101010',
                      border: '1px solid #ABD49E',
                      padding: isDesktop ? '8px 16px' : '6px 10px',
                      color: '#ABD49E',
                      fontFamily: 'monospace',
                      fontSize: isDesktop ? 16 : 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    BASE CUSTOMIZER
                  </div>
                  <button
                    type="button"
                    style={{
                      width: isDesktop ? 62 : 44,
                      height: isDesktop ? 62 : 44,
                      border: '1px solid #ABD49E',
                      background: '#101010',
                      color: '#ABD49E',
                      fontSize: isDesktop ? 24 : 20,
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeskCustomizerOpen(false);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: isDesktop ? 172 : 132,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isDesktop ? 'min(1280px, 92vw)' : '92vw',
                    height: isDesktop ? 390 : 272,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: isDesktop ? 2 : 0,
                      top: isDesktop ? 38 : 24,
                      width: isDesktop ? 208 : 124,
                      height: isDesktop ? 160 : 96,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.9,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    <img
                      src={DREAM_DESK_ITEMS[DESK_CUSTOMIZER_ITEMS[(deskCustomizerIndex === 0 ? DESK_CUSTOMIZER_ITEMS.length - 1 : deskCustomizerIndex - 1)].id]?.asset}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0.55,
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setDeskCustomizerIndex((prev) => (prev === 0 ? DESK_CUSTOMIZER_ITEMS.length - 1 : prev - 1))}
                    style={{
                      position: 'absolute',
                      left: isDesktop ? 18 : 6,
                      width: isDesktop ? 66 : 48,
                      height: isDesktop ? 66 : 48,
                      backgroundColor: '#101010',
                      border: '1.5px solid #ABD49E',
                      borderRadius: '50%',
                      fontSize: isDesktop ? 34 : 24,
                      color: '#ABD49E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}
                  >
                    ◀
                  </button>

                  <div
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: isDesktop ? '8px 12px' : '7px 10px',
                      fontSize: isDesktop ? 14 : 12,
                      fontFamily: 'monospace',
                      color: '#ABD49E',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    {currentCustomizerItem.label.toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', gap: 0, border: 'none' }}>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        borderRight: 'none',
                        padding: isDesktop ? '8px 12px' : '7px 10px',
                        fontSize: isDesktop ? 13 : 11,
                        fontFamily: 'monospace',
                        color: '#ABD49E',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isOwnedCustomizerItem ? 'OWNED' : currentCustomizerItem.price}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        padding: isDesktop ? '8px 12px' : '7px 10px',
                        fontSize: isDesktop ? 13 : 11,
                        fontFamily: 'monospace',
                        color: '#ABD49E',
                        textTransform: 'uppercase',
                      }}
                    >
                      VIRTUAL ITEM
                    </div>
                  </div>

                  <div style={{ height: isDesktop ? 22 : 14 }}></div>

                  <button
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #ABD49E',
                      padding: isDesktop ? '8px 14px' : '8px 10px',
                      fontSize: isDesktop ? 13 : 11,
                      fontFamily: 'monospace',
                      color: '#ABD49E',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                    onClick={() => {
                      if (isOwnedCustomizerItem) {
                        handleAddDeskItem(currentCustomizerItem.id);
                      } else {
                        handlePurchaseDeskItem(currentCustomizerItem.id);
                      }
                    }}
                  >
                    <span>
                      {isOwnedCustomizerItem
                        ? (isEquippedCustomizerItem ? 'ON BASE' : 'EQUIP BASE')
                        : 'PURCHASE ITEM'}
                    </span>
                    <span>›</span>
                  </button>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: isDesktop ? 42 : 18,
                    top: isDesktop ? 420 : 304,
                    width: isDesktop ? 292 : 'calc(100% - 36px)',
                    zIndex: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'grid', gap: 0 }}>
                    <div
                      style={{
                        backgroundColor: '#101010',
                        border: '1px solid #ABD49E',
                        padding: isDesktop ? '8px 12px' : '7px 10px',
                        fontSize: isDesktop ? 14 : 12,
                        fontFamily: 'monospace',
                        color: '#ABD49E',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                      }}
                    >
                      {currentCustomizerItem.label.toUpperCase()}
                    </div>

                    <div style={{ display: 'flex', gap: 0, border: 'none' }}>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          borderRight: 'none',
                          padding: isDesktop ? '8px 12px' : '7px 10px',
                          fontSize: isDesktop ? 13 : 11,
                          fontFamily: 'monospace',
                          color: '#ABD49E',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isOwnedCustomizerItem ? 'OWNED' : currentCustomizerItem.price}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          padding: isDesktop ? '8px 12px' : '7px 10px',
                          fontSize: isDesktop ? 13 : 11,
                          fontFamily: 'monospace',
                          color: '#ABD49E',
                          textTransform: 'uppercase',
                        }}
                      >
                        VIRTUAL ITEM
                      </div>
                    </div>

                    <div style={{ height: isDesktop ? 22 : 14 }}></div>

                    <button
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #ABD49E',
                        padding: isDesktop ? '8px 14px' : '8px 10px',
                        fontSize: isDesktop ? 13 : 11,
                        fontFamily: 'monospace',
                        color: '#ABD49E',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                      onClick={() => {
                        if (isOwnedCustomizerItem) {
                          handleAddDeskItem(currentCustomizerItem.id);
                        } else {
                          handlePurchaseDeskItem(currentCustomizerItem.id);
                        }
                      }}
                    >
                      <span>
                        {isOwnedCustomizerItem
                          ? (isEquippedCustomizerItem ? 'ON BASE' : 'EQUIP BASE')
                          : 'PURCHASE ITEM'}
                      </span>
                      <span>›</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: isDesktop ? 74 : 26,
                    transform: 'translateX(-50%)',
                    background: 'rgba(16,16,16,0.94)',
                    border: '1px solid #ABD49E',
                    padding: isDesktop ? '10px 16px' : '8px 10px',
                    width: isDesktop ? 620 : '82%',
                    textAlign: 'center',
                    color: '#ABD49E',
                    fontFamily: 'monospace',
                    fontSize: isDesktop ? 10 : 9,
                    lineHeight: 1.35,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    zIndex: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  THIS IS YOUR BASE CUSTOMIZER.YOU CAN ADD ITEMS YOU
                  OWN TO YOUR BASE BY TAPPING ON THE &quot;EQUIP BASE&quot; BUTTON
                </div>
              </div>
            )}
*/
function IconVolume({ color = '#101010' }) {
  return (
    <svg width="19" height="17" viewBox="0 0 19 17" fill="none">
      <path d="M11.5 4C13.2 5.5 14 7 14 8.5C14 10 13.2 11.5 11.5 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
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

// ─── Dream Desk assets ─────────────────────────────────────────────────────────
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
  BOOK2:     `${DD}/Book-2.svg`,
  BOXES:     `${DD}/Group%20of%20Boxes.svg`,
  MAILBOX:   `${DD}/Mailbox.svg`,
};

const DREAM_DESK_ITEMS = {
  JOURNAL: {
    label: 'JOURNAL',
    asset: DESK.JOURNAL,
    style: { height: 80, top: 28, left: 110, zIndex: 4 },
    drawerKey: 'journal',
  },
  RADIO: {
    label: 'RADIO',
    asset: DESK.RADIO,
    style: { height: 30, bottom: 44, left: 40, zIndex: 4, transform: 'rotate(-8deg)' },
    drawerKey: 'radio',
  },
  PORTFOLIO: {
    label: 'PORTFOLIO',
    asset: DESK.PORTFOLIO,
    style: { height: 92, top: 18, left: 12, zIndex: 3, transform: 'rotate(-8deg)' },
    drawerKey: 'portfolio',
  },
  'SLUM BOOK': {
    label: 'SLUM BOOK',
    asset: DESK.SLUMBOOK,
    style: { height: 78, top: 36, right: 82, zIndex: 4, transform: 'rotate(8deg)' },
    drawerKey: 'journal',
  },
  'BOOK BOX': {
    label: 'BOOK BOX',
    asset: DESK.BOXES,
    style: { width: 90, bottom: 26, right: -6, zIndex: 1 },
    drawerKey: null,
  },
  MAILBOX: {
    label: 'MAILBOX',
    asset: DESK.MAILBOX,
    style: { width: 72, bottom: 34, left: -2, zIndex: 2 },
    drawerKey: null,
  },
  NOTEBOOK: {
    label: 'NOTEBOOK',
    asset: DESK.BOOK2,
    style: { width: 78, top: 70, left: 78, zIndex: 4, transform: 'rotate(-12deg)' },
    drawerKey: 'documents',
  },
};

const DEFAULT_DESK_LAYOUT = [
  { id: 'JOURNAL', x: 110, y: 28, zIndex: 4 },
  { id: 'RADIO', x: 40, y: 146, zIndex: 4 },
  { id: 'PORTFOLIO', x: 12, y: 18, zIndex: 3 },
  { id: 'SLUM BOOK', x: 208, y: 36, zIndex: 4 },
];

const DESK_CUSTOMIZER_ITEMS = [
  { id: 'JOURNAL', label: 'JOURNAL', price: 'DEFAULT' },
  { id: 'RADIO', label: 'RADIO', price: 'DEFAULT' },
  { id: 'PORTFOLIO', label: 'PORTFOLIO', price: 'DEFAULT' },
  { id: 'SLUM BOOK', label: 'SLUM BOOK', price: 'DEFAULT' },
  { id: 'NOTEBOOK', label: 'NOTEBOOK', price: '90 DT' },
  { id: 'BOOK BOX', label: 'BOOK BOX', price: '120 DT' },
  { id: 'MAILBOX', label: 'MAILBOX', price: '180 DT' },
];

// ─── The base's saved arrangement ─────────────────────────────────────────────
// The desk is the part of a base that belongs to its owner, so it is the part that
// has to survive a reload and follow them onto a visitor's screen. HomeBase already
// had the two fields this needs (API: PUT /api/home):
//
//   furniture  — the equipped item ids, as a plain readable list
//   roomLayout — the arrangement itself, as JSON, because a dragged desk is a
//                position and not just a set of items.
//
// Nothing here is invented on the client: what is rendered is what was saved.
const LAYOUT_VERSION = 1; // the version a base written before rooms carries

const placementFor = (id) => {
  const preset = DEFAULT_DESK_LAYOUT.find((item) => item.id === id);
  if (preset) return { x: preset.x, y: preset.y, zIndex: preset.zIndex };
  const style = DREAM_DESK_ITEMS[id]?.style || {};
  return { x: style.left ?? 150, y: style.top ?? 110, zIndex: style.zIndex };
};

// null means "nothing saved yet", which is different from "saved as empty": an
// untouched base stands with its default desk, and only a deliberate change
// replaces that.
//
// The contract itself lives in lib/plan.js (parseRoomLayout): v2 adds the rooms to
// v1's desk and both are read here, so a base arranged before the plan view existed
// opens exactly where its owner left it — with its furniture placed by the rules.
const parseSavedLayout = (home) => {
  if (!home) return null;

  const parsed = parseRoomLayout(home.roomLayout);
  if (parsed) {
    const items = parsed.items.filter((item) => DREAM_DESK_ITEMS[item.id]);
    const floor = parsed.floor.filter((item) => furnitureById(item.id));
    if (items.length || floor.length) {
      return { version: parsed.version, items, floor, tier: parsed.tier };
    }
  }

  // A base written before the layout was serialised carries only the id list. The
  // desk ids are put back where the default desk has them; the furniture ids are
  // placed by the same rules a drag obeys, so the arrangement is stable across
  // reloads rather than random.
  if (Array.isArray(home.furniture) && home.furniture.length) {
    const items = home.furniture
      .filter((id) => DREAM_DESK_ITEMS[id])
      .map((id) => ({ id, ...placementFor(id) }));
    const floor = placeAll({
      tier: tierFor(home.upgradeLevel),
      ids: home.furniture.filter((id) => furnitureById(id)),
    });
    if (items.length || floor.length) return { version: LAYOUT_VERSION, items, floor, tier: null };
  }

  return null;
};

// ─── Map Background — 3x3 around user, exact dreaming generation ─────────────
// Hardcoded behavior: render the same procedural world rules as dreaming.js,
// then show only the 3x3 neighborhood around the user so the desk reads as
// replacing the user icon cell in the center.
const ZOOM_FACTOR = 4.2; // one 77px grid cell becomes ~323px

function MapBackground({ cw, ch, username }) {
  const userGridPos = useMemo(() => {
    return resolveUserGridPosition(username);
  }, [username]);

  // Same bounds math as dreaming.js so local elements match 1:1.
  const mapBounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    MAP_ENTITIES.forEach((entity) => {
      const sizing = getEntitySizing(entity.type);
      minX = Math.min(minX, entity.gridX);
      maxX = Math.max(maxX, entity.gridX + sizing.totalSpace - 1);
      minY = Math.min(minY, entity.gridY);
      maxY = Math.max(maxY, entity.gridY + sizing.totalSpace - 1);
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

  const naturalComponents = useMemo(() => {
    return generateMapElements(
      mapBounds.minGridCoord,
      mapBounds.maxGridCoord,
      mapBounds.minGridCoord,
      mapBounds.maxGridCoord,
      MAP_ENTITIES
    );
  }, [mapBounds]);

  const elements = useMemo(() => {
    const zoomedGrid = GRID_SIZE * ZOOM_FACTOR;
    const userCellOriginX = (cw - zoomedGrid) / 2;
    const userCellOriginY = (ch - zoomedGrid) / 2;

    return naturalComponents.map((comp) => {
      const dx = comp.gridX - userGridPos.gridX;
      const dy = comp.gridY - userGridPos.gridY;
      const px = userCellOriginX + dx * zoomedGrid;
      const py = userCellOriginY + dy * zoomedGrid;
      let size;
      if (comp.type === 'big-tree') size = zoomedGrid * 1.5;
      else if (comp.type === 'small-tree') size = zoomedGrid * 0.7;
      else if (comp.type === 'palm') size = zoomedGrid * 0.8;
      else if (comp.type === 'small-tree-extra') size = zoomedGrid * 0.5;
      else size = zoomedGrid * 0.5;
      return { ...comp, px, py, size };
    }).filter((comp) => {
      const half = comp.size / 2;
      return !(comp.px + half < 0 || comp.px - half > cw || comp.py + half < 0 || comp.py - half > ch);
    });
  }, [naturalComponents, cw, ch, userGridPos]);

  const zoomedGrid = GRID_SIZE * ZOOM_FACTOR;
  const userCellOriginX = (cw - zoomedGrid) / 2;
  const userCellOriginY = (ch - zoomedGrid) / 2;

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: [
          'linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: `${zoomedGrid}px ${zoomedGrid}px`,
        backgroundPosition: `${userCellOriginX}px ${userCellOriginY}px`,
        pointerEvents: 'none',
        zIndex: 1,
      }}/>

      {elements.map((comp) => (
        <img
          key={comp.id}
          src={getImagePath(comp)}
          alt=""
          style={{
            position: 'absolute',
            left: comp.px,
            top: comp.py,
            width: comp.size,
            height: comp.size,
            transform: 'translate(-50%, -50%)',
            zIndex: comp.type.includes('tree') || comp.type === 'palm' || comp.type === 'big-tree' ? 6 : 5,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.85))',
          }}
        />
      ))}
    </div>
  );
}

// ─── Desk Scene ────────────────────────────────────────────────────────────────
function DeskScene({
  deskItems = [],
  onDeskClick,
  onOpenCustomizer,
  onOpenKura,
  onInteractItem,
  onDragStartItem,
  deskSurfaceRef,
  shouldSuppressItemClick,
  desktop = false,
}) {

  return (
    <div
      ref={deskSurfaceRef}
      onClick={onDeskClick}
      style={{ position: 'relative', width: 310, height: 255, cursor: onDeskClick ? 'pointer' : 'default' }}
    >
      <img src={DESK.TABLE} alt="" aria-hidden="true" style={{
        position: 'absolute', width: 300, top: 0, right: 5,
        zIndex: 2, pointerEvents: 'none',
      }}/>
      <img src={DESK.COMPUTER} alt="" aria-hidden="true" style={{
        position: 'absolute', height: 112, width: 'auto', top: 0, right: 10,
        zIndex: 3, pointerEvents: 'none',
      }}/>
      <img src={DESK.CHAIR} alt="" aria-hidden="true" style={{
        position: 'absolute', width: 88, top: 100, left: 128,
        zIndex: 1, pointerEvents: 'none',
        transform: 'rotate(-12deg)', transformOrigin: 'center center',
      }}/>

      {deskItems.map((item) => {
        const config = DREAM_DESK_ITEMS[item.id];
        if (!config) return null;

        const width = config.style.width;
        const height = config.style.height;

        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Open ${config.label}`}
            onMouseDown={(e) => onDragStartItem?.(e, item.id)}
            onTouchStart={(e) => onDragStartItem?.(e, item.id)}
            onClick={(e) => {
              e.stopPropagation();
              if (shouldSuppressItemClick?.()) return;
              onInteractItem?.(item.id);
            }}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: width ? `${width}px` : 'auto',
              height: height ? `${height}px` : 'auto',
              background: 'transparent',
              border: 'none',
              padding: 0,
              margin: 0,
              zIndex: item.zIndex ?? config.style.zIndex,
              transform: config.style.transform || 'none',
              transformOrigin: 'top left',
              cursor: 'grab',
            }}
          >
            <img
              src={config.asset}
              alt=""
              aria-hidden="true"
              style={{
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Open Dream Desk customizer"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCustomizer?.();
        }}
        style={{
          position: 'absolute',
          right: desktop ? -550 : 6,
          bottom: desktop ? 140 : 58,
          width: desktop ? 52 : 44,
          height: desktop ? 52 : 44,
          background: '#101010',
          border: '1.5px solid #ABD49E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ABD49E',
          fontFamily: 'monospace',
          fontSize: desktop ? 22 : 18,
          lineHeight: 1,
          cursor: 'pointer',
          zIndex: 8,
          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
        }}
      >
        +
      </button>

      <button
        type="button"
        aria-label="Open Kura"
        onClick={(e) => {
          e.stopPropagation();
          onOpenKura?.();
        }}
        style={{
          position: 'absolute',
          right: desktop ? -550 : 6,
          bottom: desktop ? 78 : 6,
          width: desktop ? 52 : 44,
          height: desktop ? 52 : 44,
          background: '#101010',
          border: '1.5px solid #ABD49E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ABD49E',
          fontFamily: 'monospace',
          fontSize: desktop ? 9 : 8,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          zIndex: 8,
          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
        }}
      >
        KURA
      </button>
    </div>
  );
}

// ─── Dream Desk Popup ──────────────────────────────────────────────────────────
function DreamDeskPopup({ menuItems, activeDeskItem, onSelectItem, onClose, style = {}, desktop = false }) {
  return (
    <div style={{ width: desktop ? 238 : 135, ...style }}>
      <div style={{
        height: desktop ? 46 : 32, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', paddingInline: desktop ? 16 : 10,
        background: '#ABD49E',
        border: desktop ? '2px solid #101010' : 'none',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: desktop ? 13 : 10, fontWeight: 700, color: '#101010', letterSpacing: '0.08em' }}>DREAM DESK</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#101010', fontSize: desktop ? 18 : 12, cursor: 'pointer', padding: 0 }}>×</button>
      </div>
      {menuItems.map(({ item, h }) => (
        <button
          key={item}
          onClick={() => { onSelectItem?.(item); onClose(); }}
          style={{
            display: 'block', width: '100%', height: h,
            marginTop: desktop ? 8 : 5,
            background: activeDeskItem === item ? '#ABD49E' : '#101010',
            border: desktop ? '2px solid #101010' : '1px solid rgba(171,212,158,0.18)',
            color: activeDeskItem === item ? '#101010' : '#ABD49E', fontFamily: 'monospace', fontSize: desktop ? 12 : 10,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            textAlign: 'left', paddingInline: desktop ? 16 : 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span>{item}</span>
          <span style={{ opacity: 0.85 }}>›</span>
        </button>
      ))}
    </div>
  );
}

// ─── Room customiser: one card per mock sprite in public/Frames/User-base/Plan view ──
// A card states exactly one of four facts — it is on the base, you own it, it is
// locked by your tier, or it costs this much — and offers the one action that fact
// allows. Prices are the demo naira prices from lib/plan.js.
function FurnitureCard({ def, placed, owned, locked, hasSpot, busy, desktop, onPlace, onBuy, onStore, onRotate }) {
  let action = { label: 'PLACE ON BASE', fn: () => onPlace(def.id), tone: '#ABD49E' };
  if (placed) action = { label: 'STORE', fn: () => onStore(def.id), tone: '#ABD49E' };
  else if (!owned && locked) action = { label: `TIER ${def.tier} ONLY`, fn: null, tone: 'rgba(171,212,158,0.45)' };
  else if (!owned) action = { label: `BUY ${formatNaira(def.price)}`, fn: () => onBuy(def.id), tone: '#F4A261' };
  else if (!hasSpot) action = { label: 'NO SPACE', fn: null, tone: 'rgba(171,212,158,0.45)' };

  const fact = placed ? 'ON BASE' : owned ? 'OWNED' : formatNaira(def.price);

  return (
    <div
      data-furniture={def.id}
      style={{ border: '1px solid rgba(171,212,158,0.35)', background: '#101010', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{
        height: desktop ? 104 : 78, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10, background: '#151413',
      }}>
        <img
          src={def.asset}
          alt=""
          aria-hidden="true"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
      <div style={{ padding: desktop ? 10 : 8, fontFamily: 'monospace', color: '#ABD49E', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: desktop ? 12 : 10, letterSpacing: '0.12em' }}>{def.label}</div>
        <div style={{ fontSize: desktop ? 10 : 9, opacity: 0.7, marginTop: 3, letterSpacing: '0.06em' }}>
          {fact} · TIER {def.tier} · {def.w}×{def.h}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
          <button
            type="button"
            disabled={!action.fn || busy}
            onClick={action.fn || undefined}
            style={{
              flex: 1,
              background: action.fn ? action.tone : 'transparent',
              border: `1px solid ${action.fn ? action.tone : 'rgba(171,212,158,0.4)'}`,
              color: action.fn ? '#101010' : 'rgba(171,212,158,0.55)',
              padding: '7px 8px', fontSize: desktop ? 10 : 9, letterSpacing: '0.1em',
              cursor: action.fn ? 'pointer' : 'not-allowed', fontFamily: 'monospace',
            }}
          >
            {action.label}
          </button>
          {placed ? (
            <button
              type="button"
              aria-label={`Rotate ${def.label}`}
              onClick={() => onRotate(def.id)}
              style={{
                background: '#101010', border: '1px solid #ABD49E', color: '#ABD49E',
                padding: '7px 10px', fontSize: desktop ? 12 : 10, cursor: 'pointer',
              }}
            >
              ↻
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Home Scene (frozen canvas with jungle + desk) ────────────────────────────
function HomeScene({ activeDeskItem, setActiveDeskItem, username, onOpenKura, home, isSelf, viewerUsername = '', visitorNote = null }) {
  const [deskPopupOpen, setDeskPopupOpen] = useState(false);
  const [deskCustomizerOpen, setDeskCustomizerOpen] = useState(false);
  const [customizerMode, setCustomizerMode] = useState('DESK');
  const [deskDrawerView, setDeskDrawerView] = useState(null);
  // The plan view's own state: which floor you are looking at, which item is
  // selected, and the items the demo checkout has unlocked this session.
  const [floorNo, setFloorNo] = useState(1);
  const [selectedFloorItem, setSelectedFloorItem] = useState(null);
  const [demoOwned, setDemoOwned] = useState([]);
  // Start from what the owner saved, not from the default desk, so the first paint
  // of a base somebody has arranged is already their arrangement.
  const savedLayout = useMemo(() => parseSavedLayout(home), [home]);
  // The ladder: HomeBase.upgradeLevel (default 1) picks the plan. A base with no
  // HomeBase row is level 1, which is why the desk always stands in a room.
  const tier = useMemo(() => tierFor(home && home.upgradeLevel), [home]);
  const theme = (home && home.theme) || 'jungle';
  // A new base is not an empty rectangle: the tier ships a starter pair (RUG,
  // PLANT) whose positions come from the same rules a drag obeys.
  const starterFloor = useMemo(() => placeAll({ tier, floorNo: 1, ids: FREE_FURNITURE }), [tier]);
  const [deskItems, setDeskItems] = useState(() => (savedLayout && savedLayout.items.length ? savedLayout.items : DEFAULT_DESK_LAYOUT));
  const [floorItems, setFloorItems] = useState(() => (savedLayout && savedLayout.floor.length ? savedLayout.floor : starterFloor));
  const [ownedDeskItems, setOwnedDeskItems] = useState(['JOURNAL', 'RADIO', 'PORTFOLIO', 'SLUM BOOK']);
  const [deskCustomizerIndex, setDeskCustomizerIndex] = useState(0);
  const [draggedDeskItemId, setDraggedDeskItemId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragItemSize, setDragItemSize] = useState({ width: 56, height: 56 });
  const [isDraggingDeskItem, setIsDraggingDeskItem] = useState(false);
  const containerRef = useRef(null);
  const deskSurfaceRef = useRef(null);
  const dragStartPointRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const [frozen, setFrozen] = useState(null);
  const isDesktop = frozen ? frozen.w >= 1024 : false;

  const menuItems = useMemo(() => {
    return deskItems
      .filter((item) => Boolean(DREAM_DESK_ITEMS[item.id]?.drawerKey))
      .map((item) => ({ item: item.id, h: isDesktop ? 46 : 38 }));
  }, [deskItems, isDesktop]);

  const currentCustomizerItem = DESK_CUSTOMIZER_ITEMS[deskCustomizerIndex] || DESK_CUSTOMIZER_ITEMS[0];
  const isOwnedCustomizerItem = ownedDeskItems.includes(currentCustomizerItem.id);
  const isEquippedCustomizerItem = deskItems.some((item) => item.id === currentCustomizerItem.id);

  // The saved arrangement arrives with the base (which is fetched), so it is adopted
  // when it lands, not only in the initial state.
  useEffect(() => {
    if (!savedLayout) {
      setFloorItems(starterFloor);
      return;
    }
    if (savedLayout.items.length) setDeskItems(savedLayout.items);
    setFloorItems(savedLayout.floor.length ? savedLayout.floor : starterFloor);
  }, [savedLayout, starterFloor]);

  // The handlers below run outside the render that owns `deskItems` — a drag's
  // listeners are attached on mousedown — so the current arrangement is kept in a
  // ref to be saved from there. The floor has the same problem for the same reason.
  const deskItemsRef = useRef(deskItems);
  useEffect(() => { deskItemsRef.current = deskItems; }, [deskItems]);
  const floorItemsRef = useRef(floorItems);
  useEffect(() => { floorItemsRef.current = floorItems; }, [floorItems]);

  // How big the base is drawn. lib/plan.js owns the number because the desk's drag
  // maths divides screen pixels by it: one scale, or a drag stops matching the item
  // it is moving.
  const planScale = useMemo(() => (frozen ? planScaleFor(tier, { w: frozen.w, h: frozen.h }) : 1), [frozen, tier]);
  const planScaleRef = useRef(planScale);
  useEffect(() => { planScaleRef.current = planScale; }, [planScale]);

  // Where the desk ended up on screen, so the desk menu opens beside the desk and
  // not beside a hardcoded offset that used to be the centre of the map.
  const deskScreen = useMemo(() => {
    if (!frozen) return null;
    const desk = deskRectFor(tier, floorNo);
    if (!desk) return null;
    const bounds = planBounds(tier);
    return {
      x: frozen.w / 2 + (desk.x + 155 - bounds.w / 2) * planScale,
      y: frozen.h / 2 + (desk.y + 127 - bounds.h / 2) * planScale,
      size: 310 * planScale,
    };
  }, [frozen, tier, floorNo, planScale]);

  // Only the owner writes, and only after a deliberate change. Saving on mount would
  // let a visitor's default desk overwrite somebody's arranged one; the API refuses
  // it too, since PUT /api/home is login-required and scoped to the session's user.
  //
  // One serialisation, both scales: `roomLayout` (v2) carries the desk's items and
  // the room's furniture, and `furniture` carries every equipped id — desk ids and
  // floor ids together, because that list is what makes an item come back.
  const saveLayout = useCallback((nextDeskItems, nextFloorItems) => {
    if (!isSelf) return;
    const desk = nextDeskItems || deskItemsRef.current;
    const floor = nextFloorItems || floorItemsRef.current;
    if (!desk.length && !floor.length) return;
    fetch('/api/home', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        furniture: Array.from(new Set([...desk.map((item) => item.id), ...floor.map((item) => item.id)])),
        roomLayout: serializeRoomLayout({ tier: tier.level, deskItems: desk, floorItems: floor, floorNo }),
      }),
    }).catch(() => {
      // A base that failed to save is still on screen, and the next change retries.
    });
  }, [isSelf, tier, floorNo]);

  // An upgrade moves the walls. What the new plan cannot hold is *stored* — taken off
  // the floor, kept in `furniture` — never deleted, and what still fits stays exactly
  // where the owner put it.
  useEffect(() => {
    setFloorItems((items) => {
      const kept = items.filter((item) => furnitureById(item.id));
      if (!kept.length) return kept;
      const legal = [];
      const broken = [];
      kept.forEach((item) => {
        const verdict = canPlace({
          tier, floorNo: floorOf(item), items: kept, id: item.id,
          x: item.x, y: item.y, rot: item.rot, ignoreId: item.id,
        });
        if (verdict.ok) legal.push(item); else broken.push(item);
      });
      if (!broken.length) return kept;
      return placeAll({ tier, floorNo: 1, ids: broken.map((item) => item.id), items: legal });
    });
  }, [tier]);

  const ownedFurniture = useMemo(
    () => ownedFurnitureIds(home, demoOwned).filter((id) => furnitureById(id)),
    [home, demoOwned]
  );
  const storedCount = ownedFurniture.filter((id) => !floorItems.some((item) => item.id === id)).length;

  const placeFurniture = (id) => {
    const spot = firstFreeSpot({ tier, floorNo, items: floorItems, id });
    if (!spot) return false;
    const next = [...floorItems, { id, x: spot.x, y: spot.y, rot: spot.rot || 0, floor: floorNo }];
    setFloorItems(next);
    saveLayout(deskItemsRef.current, next);
    return true;
  };

  const storeFurniture = (id) => {
    const next = floorItems.filter((item) => item.id !== id);
    setFloorItems(next);
    setSelectedFloorItem(null);
    // Real ownership lives in the store, which is the money pass. Until then an id
    // you have paid the demo checkout for stays available for the session, and every
    // screen that offers it says so plainly.
    setDemoOwned((prev) => (prev.includes(id) ? prev : [...prev, id]));
    saveLayout(deskItemsRef.current, next);
  };

  const rotateFurniture = (id) => {
    const item = floorItems.find((entry) => entry.id === id);
    if (!item) return;
    const rot = ((Number(item.rot) || 0) + 90) % 360;
    const next = floorItems.map((entry) => (entry.id === id ? { ...entry, rot } : entry));
    const verdict = canPlace({
      tier, floorNo: floorOf(item), items: next, id, x: item.x, y: item.y, rot, ignoreId: id,
    });
    if (!verdict.ok) return;
    setFloorItems(next);
    saveLayout(deskItemsRef.current, next);
  };

  // A floor drag is a change to the base exactly like a desk drag is: committed
  // under the same rules and written through the same single call.
  const commitFloor = useCallback((next) => {
    setFloorItems(next);
    saveLayout(deskItemsRef.current, next);
  }, [saveLayout]);

  useEffect(() => {
    const el = containerRef.current;
    if (el && !frozen) setFrozen({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  const handleSelectDeskItem = (itemId) => {
    setActiveDeskItem(itemId);
    const drawerKey = DREAM_DESK_ITEMS[itemId]?.drawerKey;
    if (drawerKey) setDeskDrawerView(drawerKey);
  };

  const handleAddDeskItem = (itemId) => {
    if (deskItems.some((item) => item.id === itemId)) return;
    const config = DREAM_DESK_ITEMS[itemId];
    if (!config) return;

    const next = [
      ...deskItems,
      {
        id: itemId,
        x: config.style.left ?? 150,
        y: config.style.top ?? 110,
        zIndex: config.style.zIndex,
      },
    ];
    setDeskItems(next);
    setActiveDeskItem(itemId);
    // Equipping is the owner deciding what is in their home, so it is saved.
    saveLayout(next);
  };

  const handlePurchaseDeskItem = (itemId) => {
    setOwnedDeskItems((items) => (items.includes(itemId) ? items : [...items, itemId]));
  };

  const handleDragStartItem = (event, itemId) => {
    const point = 'touches' in event ? event.touches[0] : event;
    const scale = planScaleRef.current || 1;
    const targetRect = event.currentTarget.getBoundingClientRect();
    setDraggedDeskItemId(itemId);
    setIsDraggingDeskItem(false);
    dragMovedRef.current = false;
    dragStartPointRef.current = { x: point.clientX, y: point.clientY };
    // The desk stands inside the plan, which is drawn at planScale, so the rendered
    // box is in screen pixels while item coordinates are the desk's own units.
    setDragOffset({
      x: (point.clientX - targetRect.left) / scale,
      y: (point.clientY - targetRect.top) / scale,
    });
    setDragItemSize({ width: targetRect.width / scale, height: targetRect.height / scale });
  };

  const shouldSuppressItemClick = () => {
    return Date.now() < suppressClickUntilRef.current || dragMovedRef.current;
  };

  useEffect(() => {
    if (!deskCustomizerOpen) return;
    const fromActiveIndex = DESK_CUSTOMIZER_ITEMS.findIndex((item) => item.id === activeDeskItem);
    if (fromActiveIndex >= 0) setDeskCustomizerIndex(fromActiveIndex);
  }, [deskCustomizerOpen, activeDeskItem]);

  useEffect(() => {
    if (!draggedDeskItemId) return;

    const updatePosition = (clientX, clientY) => {
      const deskSurface = deskSurfaceRef.current;
      if (!deskSurface) return;

      const surfaceScale = planScaleRef.current || 1;
      const rect = deskSurface.getBoundingClientRect();
      const deltaX = clientX - dragStartPointRef.current.x;
      const deltaY = clientY - dragStartPointRef.current.y;
      const movement = Math.hypot(deltaX, deltaY);

      if (movement > 6) {
        dragMovedRef.current = true;
        setIsDraggingDeskItem(true);
      }
      if (!dragMovedRef.current) return;

      // Screen pixels back into the desk's own units (see handleDragStartItem). At
      // scale 1 this is the arithmetic the desk has always used.
      const surfaceW = rect.width / surfaceScale;
      const surfaceH = rect.height / surfaceScale;
      const nextX = Math.max(0, Math.min(surfaceW - dragItemSize.width, (clientX - rect.left) / surfaceScale - dragOffset.x));
      const nextY = Math.max(0, Math.min(surfaceH - dragItemSize.height, (clientY - rect.top) / surfaceScale - dragOffset.y));

      setDeskItems((items) => items.map((item) => (
        item.id === draggedDeskItemId ? { ...item, x: nextX, y: nextY } : item
      )));
    };

    const handleMove = (event) => {
      const point = 'touches' in event ? event.touches[0] : event;
      updatePosition(point.clientX, point.clientY);
      if ('preventDefault' in event) event.preventDefault();
    };

    const handleEnd = () => {
      if (dragMovedRef.current) {
        suppressClickUntilRef.current = Date.now() + 200;
        // A drag that actually moved the item is a change to the arrangement, so it
        // is saved — from the ref, because this listener closed over the layout as
        // it was when the drag started.
        saveLayout(deskItemsRef.current);
      }
      setTimeout(() => {
        setDraggedDeskItemId(null);
        setIsDraggingDeskItem(false);
        dragMovedRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggedDeskItemId, dragOffset, dragItemSize]);

  // The store's checkout is not wired yet (item prices are still strings like
  // '90 DT' and ownership resets), so buying furniture is a demo: the item is
  // unlocked for the session and placed with the same rules everything else obeys.
  // The panel says out loud that no payment was taken.
  const buyFurniture = (id) => {
    setDemoOwned((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return placeFurniture(id);
  };

  const renderDrawerContent = (drawerKey) => {
    if (drawerKey === 'journal') {
      return (
        <div style={{ padding: 16 }}>
          <textarea
            style={{ width: '100%', minHeight: 220, background: '#101010', border: '1px solid #ABD49E', color: '#ABD49E', padding: 12, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Write your dreams, thoughts, and ideas here..."
          />
          <button style={{ marginTop: 12, width: '100%', height: 42, background: '#ABD49E', color: '#101010', border: 'none', fontFamily: 'monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>
            SAVE ENTRY
          </button>
        </div>
      );
    }

    if (drawerKey === 'portfolio') {
      return (
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          <p style={{ color: '#ABD49E', fontSize: 13, lineHeight: 1.5 }}>Upload your work, projects, and achievements.</p>
          <button style={{ width: '100%', height: 44, background: '#ABD49E', color: '#101010', border: 'none', fontFamily: 'monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>+ UPLOAD FILE</button>
          <button style={{ width: '100%', height: 44, background: '#ABD49E', color: '#101010', border: 'none', fontFamily: 'monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>+ CREATE PROJECT</button>
        </div>
      );
    }

    if (drawerKey === 'radio') {
      return (
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          <p style={{ color: '#ABD49E', fontSize: 13, lineHeight: 1.5 }}>Tune into your favorite stations or play your music.</p>
          {['LO-FI BEATS', 'CHILL VIBES', 'NATURE SOUNDS'].map((label) => (
            <button key={label} style={{ width: '100%', height: 40, background: '#F4A261', color: '#101010', border: 'none', fontFamily: 'monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>{label}</button>
          ))}
          <button style={{ width: '100%', height: 42, background: '#ABD49E', color: '#101010', border: 'none', fontFamily: 'monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>+ ADD MUSIC</button>
        </div>
      );
    }

    if (drawerKey === 'documents') {
      return (
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          <p style={{ color: '#ABD49E', fontSize: 13, lineHeight: 1.5 }}>Manage your documents and notes.</p>
          <button style={{ width: '100%', height: 42, background: '#ABD49E', color: '#101010', border: 'none', fontFamily: 'monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>+ NEW DOCUMENT</button>
          <div style={{ background: '#101010', border: '1px solid rgba(171,212,158,0.25)', color: '#ABD49E', padding: 12, fontSize: 12 }}>Untitled Document</div>
        </div>
      );
    }

    return (
      <div style={{ padding: 16, color: '#ABD49E', fontSize: 13 }}>This item is decorative for now.</div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#151413' }}
    >
      {frozen && (
        <div
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: frozen.w, height: frozen.h,
            overflow: 'hidden',
          }}
          onClick={() => {
            setDeskPopupOpen(false);
            setDeskCustomizerOpen(false);
          }}
        >
          <div style={{ position: 'relative', width: frozen.w, height: frozen.h }}>
            <MapBackground cw={frozen.w} ch={frozen.h} username={username} />

            {/* The base, from above: the tier's rooms with the desk standing in one
                of them. The desk is passed in as `deskSlot`, so it is still the same
                component — same drawers, same drag, same single save — at the room
                scale as it was when it floated on the map on its own. */}
            <PlanRoom
              tier={tier}
              floorNo={floorNo}
              theme={theme}
              items={floorItems}
              editable={isSelf}
              scale={planScale}
              ownerUsername={username}
              viewerUsername={viewerUsername}
              isSelf={isSelf}
              visitorNote={visitorNote}
              selectedId={selectedFloorItem}
              onCommit={commitFloor}
              onSelectItem={(id) => setSelectedFloorItem((cur) => (cur === id ? null : id))}
              deskSlot={(
                <div
                  style={{ width: 310, height: 255, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => {
                    e.stopPropagation();
                    if (!isDraggingDeskItem) setDeskPopupOpen(true);
                  }}
                >
                  <DeskScene
                    deskItems={deskItems}
                    activeDeskItem={activeDeskItem}
                    onDeskClick={() => {
                      if (!isDraggingDeskItem) setDeskPopupOpen(true);
                    }}
                    onOpenCustomizer={() => {
                      setDeskPopupOpen(false);
                      setDeskCustomizerOpen(true);
                    }}
                    onOpenKura={onOpenKura}
                    onInteractItem={handleSelectDeskItem}
                    onDragStartItem={handleDragStartItem}
                    deskSurfaceRef={deskSurfaceRef}
                    shouldSuppressItemClick={shouldSuppressItemClick}
                    desktop={isDesktop}
                  />
                </div>
              )}
            />

            {/* The property, in one line: what tier this is, which rooms it has, how
                full it is, and how much of the plot it takes on the map. */}
            <div
              data-plan-hud=""
              style={{
                position: 'absolute', left: isDesktop ? 22 : 10, top: isDesktop ? 20 : 10,
                zIndex: 9, fontFamily: 'monospace', color: '#ABD49E', pointerEvents: 'none',
                border: '1px solid #ABD49E', background: 'rgba(16,16,16,0.92)',
                padding: isDesktop ? '8px 12px' : '6px 8px',
              }}
            >
              <div style={{
                fontSize: isDesktop ? 12 : 10, letterSpacing: '0.14em', whiteSpace: 'nowrap',
              }}>
                TIER {tier.level} · {tier.name}
              </div>
              <div style={{ marginTop: 6, fontSize: isDesktop ? 10 : 9, letterSpacing: '0.1em', opacity: 0.85 }}>
                {roomsOnFloor(tier, floorNo).map((room) => room.label).join(' · ')}
              </div>
              <div data-plan-stats="" style={{ marginTop: 4, fontSize: isDesktop ? 10 : 9, letterSpacing: '0.1em', opacity: 0.85 }}>
                FURNITURE {slotsUsed(floorItems)}/{tier.slots}
                {storedCount ? ` · ${storedCount} STORED` : ''}
                {' · '}PLOT {tier.plot}
              </div>
            </div>

            {/* A duplex is a plan that stacks, so the plan gets a floor switch. */}
            {tier.floors.length > 1 && (
              <div
                data-plan-floors=""
                style={{
                  position: 'absolute', left: '50%', top: isDesktop ? 20 : 10, transform: 'translateX(-50%)',
                  display: 'flex', zIndex: 9, fontFamily: 'monospace',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {tier.floors.map((f) => (
                  <button
                    key={f.no}
                    type="button"
                    aria-label={`Show floor ${f.no} — ${f.label}`}
                    onClick={() => { setFloorNo(f.no); setSelectedFloorItem(null); }}
                    style={{
                      background: floorNo === f.no ? '#ABD49E' : 'rgba(16,16,16,0.92)',
                      color: floorNo === f.no ? '#101010' : '#ABD49E',
                      border: '1px solid #ABD49E', padding: isDesktop ? '8px 14px' : '6px 10px',
                      fontSize: isDesktop ? 11 : 9, letterSpacing: '0.14em', cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tapping a piece of furniture offers the two things you can do to it. */}
            {isSelf && selectedFloorItem && furnitureById(selectedFloorItem) && (
              <div
                data-plan-action=""
                style={{
                  position: 'absolute', left: '50%', bottom: isDesktop ? 104 : 78,
                  transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 9, fontFamily: 'monospace',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{
                  background: '#ABD49E', color: '#101010', padding: isDesktop ? '8px 12px' : '6px 8px',
                  fontSize: isDesktop ? 11 : 9, letterSpacing: '0.14em', whiteSpace: 'nowrap',
                }}>
                  {furnitureById(selectedFloorItem).label}
                </span>
                <button
                  type="button"
                  onClick={() => rotateFurniture(selectedFloorItem)}
                  style={{
                    background: '#101010', color: '#ABD49E', border: '1px solid #ABD49E',
                    padding: isDesktop ? '8px 12px' : '6px 8px', fontSize: isDesktop ? 11 : 9,
                    letterSpacing: '0.14em', cursor: 'pointer',
                  }}
                >
                  ROTATE
                </button>
                <button
                  type="button"
                  aria-label={`Store ${furnitureById(selectedFloorItem).label} off the base`}
                  onClick={() => storeFurniture(selectedFloorItem)}
                  style={{
                    background: '#101010', color: '#ABD49E', border: '1px solid #ABD49E',
                    padding: isDesktop ? '8px 12px' : '6px 8px', fontSize: isDesktop ? 11 : 9,
                    letterSpacing: '0.14em', cursor: 'pointer',
                  }}
                >
                  STORE
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFloorItem(null)}
                  style={{
                    background: '#101010', color: '#ABD49E', border: '1px solid #ABD49E',
                    padding: isDesktop ? '8px 12px' : '6px 8px', fontSize: isDesktop ? 11 : 9,
                    letterSpacing: '0.14em', cursor: 'pointer',
                  }}
                >
                  DONE
                </button>
              </div>
            )}
            {/* The desk's own menu, anchored to where the desk actually stands in the
                plan (it used to be a fixed offset from the centre of the map). */}
            {deskPopupOpen && (
              <div
                style={{
                  position: 'absolute',
                  left: deskScreen
                    ? (isDesktop ? deskScreen.x + deskScreen.size * 0.5 + 12 : 12)
                    : '50%',
                  top: deskScreen
                    ? (isDesktop ? deskScreen.y - 140 : deskScreen.y + 70)
                    : '50%',
                  zIndex: 20,
                }}
                onClick={e => e.stopPropagation()}
              >
                <DreamDeskPopup
                  menuItems={menuItems}
                  activeDeskItem={activeDeskItem}
                  onSelectItem={handleSelectDeskItem}
                  onClose={() => setDeskPopupOpen(false)}
                  desktop={isDesktop}
                />
              </div>
            )}

            {deskCustomizerOpen && currentCustomizerItem && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#101010',
                  zIndex: 30,
                  overflow: 'hidden',
                }}
                onClick={() => setDeskCustomizerOpen(false)}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: isDesktop ? 34 : 20,
                    left: isDesktop ? 44 : 24,
                    width: isDesktop ? 52 : 40,
                    height: isDesktop ? 52 : 40,
                    borderRadius: '999px',
                    border: '1.5px solid #ABD49E',
                    background: '#101010',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ABD49E',
                    fontSize: isDesktop ? 18 : 16,
                    lineHeight: 1,
                    cursor: 'pointer',
                    zIndex: 5,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeskCustomizerOpen(false);
                  }}
                >
                  ↩
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: isDesktop ? 30 : 18,
                    right: isDesktop ? 34 : 20,
                    display: 'flex',
                    gap: isDesktop ? 10 : 8,
                    alignItems: 'stretch',
                    zIndex: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      background: '#101010',
                      border: '1px solid #ABD49E',
                      padding: isDesktop ? '8px 16px' : '6px 10px',
                      color: '#ABD49E',
                      fontFamily: 'monospace',
                      fontSize: isDesktop ? 16 : 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    BASE CUSTOMIZER
                  </div>
                  <button
                    type="button"
                    style={{
                      width: isDesktop ? 62 : 44,
                      height: isDesktop ? 62 : 44,
                      border: '1px solid #ABD49E',
                      background: '#101010',
                      color: '#ABD49E',
                      fontSize: isDesktop ? 24 : 20,
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeskCustomizerOpen(false);
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* DESK | ROOM — one customiser, the two scales of the same base.
                    Same rules, same save; the desk is not forked into a second editor. */}
                <div
                  data-customizer-modes=""
                  style={{
                    position: 'absolute', left: '50%', top: isDesktop ? 104 : 74,
                    transform: 'translateX(-50%)', display: 'flex', zIndex: 10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {['DESK', 'ROOM'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-label={`Customise the ${mode.toLowerCase()}`}
                      onClick={() => setCustomizerMode(mode)}
                      style={{
                        background: customizerMode === mode ? '#ABD49E' : '#101010',
                        color: customizerMode === mode ? '#101010' : '#ABD49E',
                        border: '1px solid #ABD49E',
                        padding: isDesktop ? '8px 16px' : '6px 12px',
                        fontFamily: 'monospace', fontSize: isDesktop ? 12 : 10,
                        letterSpacing: '0.14em', cursor: 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* The room half of the customiser: the catalogue, what you own, what
                    your tier allows, and the demo checkout the money pass replaces. */}
                {customizerMode === 'ROOM' && (
                  <div
                    data-customizer-room=""
                    style={{ position: 'absolute', inset: 0, background: '#101010', zIndex: 8, overflowY: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{
                      paddingTop: isDesktop ? 190 : 152, paddingInline: isDesktop ? 56 : 14,
                      paddingBottom: 150, maxWidth: 1180, margin: '0 auto',
                      fontFamily: 'monospace', color: '#ABD49E',
                    }}
                    >
                      <div style={{ fontSize: isDesktop ? 14 : 11, letterSpacing: '0.16em' }}>
                        FURNISHING · TIER {tier.level} · {tier.name}
                      </div>
                      <div style={{ fontSize: isDesktop ? 11 : 9, letterSpacing: '0.1em', opacity: 0.75, marginTop: 6 }}>
                        {slotsUsed(floorItems)} OF {tier.slots} PLACED
                        {storedCount ? ` · ${storedCount} IN STORAGE` : ''}
                        {' · '}{roomsOnFloor(tier, floorNo).map((room) => room.label).join(' · ')}
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(210px, 1fr))' : '1fr 1fr',
                        gap: 10, marginTop: 16,
                      }}
                      >
                        {FURNITURE.map((def) => {
                          const placed = floorItems.some((item) => item.id === def.id);
                          const owned = ownedFurniture.includes(def.id);
                          const locked = def.tier > tier.level;
                          const hasSpot = placed || Boolean(firstFreeSpot({ tier, floorNo, items: floorItems, id: def.id }));
                          return (
                            <FurnitureCard
                              key={def.id}
                              def={def}
                              placed={placed}
                              owned={owned}
                              locked={locked}
                              hasSpot={hasSpot}
                              busy={false}
                              desktop={isDesktop}
                              onPlace={placeFurniture}
                              onBuy={buyFurniture}
                              onStore={storeFurniture}
                              onRotate={rotateFurniture}
                            />
                          );
                        })}
                      </div>

                      <div style={{
                        marginTop: 18, border: '1px solid rgba(171,212,158,0.35)',
                        padding: isDesktop ? 14 : 10, fontSize: isDesktop ? 10 : 9,
                        lineHeight: 1.5, letterSpacing: '0.08em', opacity: 0.85,
                      }}
                      >
                        DEMO CHECKOUT — NOTHING IS CHARGED YET. THE PRICES ARE PLACEHOLDERS AND AN
                        ITEM YOU UNLOCK STAYS ON THIS DEVICE UNTIL THE STORE&apos;S REAL PURCHASE PATH
                        LANDS. WHAT IS REAL: PLACING, ROTATING, STORING AND THE PLAN ITSELF, ALL
                        SAVED TO YOUR BASE.
                      </div>
                      <div style={{ marginTop: 12, fontSize: isDesktop ? 10 : 9, letterSpacing: '0.1em', opacity: 0.75 }}>
                        BIGGER HOME? <a href="/home" style={{ color: '#ABD49E' }}>THE PROPERTY OFFICE</a> HAS THE NEXT TIER.
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute',
                      top: isDesktop ? 172 : 132,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isDesktop ? 'min(1280px, 92vw)' : '92vw',
                      height: isDesktop ? 390 : 272,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: isDesktop ? 2 : 0,
                      top: isDesktop ? 38 : 24,
                      width: isDesktop ? 208 : 124,
                      height: isDesktop ? 160 : 96,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.9,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    <img
                      src={DREAM_DESK_ITEMS[DESK_CUSTOMIZER_ITEMS[(deskCustomizerIndex === 0 ? DESK_CUSTOMIZER_ITEMS.length - 1 : deskCustomizerIndex - 1)].id]?.asset}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0.55,
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setDeskCustomizerIndex((prev) => (prev === 0 ? DESK_CUSTOMIZER_ITEMS.length - 1 : prev - 1))}
                    style={{
                      position: 'absolute',
                      left: isDesktop ? 18 : 6,
                      width: isDesktop ? 66 : 48,
                      height: isDesktop ? 66 : 48,
                      backgroundColor: '#101010',
                      border: '1.5px solid #ABD49E',
                      borderRadius: '50%',
                      fontSize: isDesktop ? 34 : 24,
                      color: '#ABD49E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}
                  >
                    ◀
                  </button>

                  <div
                    style={{
                      backgroundColor: 'transparent',
                      width: isDesktop ? 520 : 330,
                      height: isDesktop ? 260 : 160,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 4,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <img
                        src={DREAM_DESK_ITEMS[currentCustomizerItem.id]?.asset}
                        alt={currentCustomizerItem.label}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setDeskCustomizerIndex((prev) => (prev === DESK_CUSTOMIZER_ITEMS.length - 1 ? 0 : prev + 1))}
                    style={{
                      position: 'absolute',
                      right: isDesktop ? 18 : 6,
                      width: isDesktop ? 66 : 48,
                      height: isDesktop ? 66 : 48,
                      backgroundColor: '#101010',
                      border: '1.5px solid #ABD49E',
                      borderRadius: '50%',
                      fontSize: isDesktop ? 34 : 24,
                      color: '#ABD49E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}
                  >
                    ▶
                  </button>

                  <div
                    style={{
                      position: 'absolute',
                      right: isDesktop ? 2 : 0,
                      top: isDesktop ? 38 : 24,
                      width: isDesktop ? 208 : 124,
                      height: isDesktop ? 160 : 96,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.9,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    <img
                      src={DREAM_DESK_ITEMS[DESK_CUSTOMIZER_ITEMS[(deskCustomizerIndex === DESK_CUSTOMIZER_ITEMS.length - 1 ? 0 : deskCustomizerIndex + 1)].id]?.asset}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0.55,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: isDesktop ? 500 : 334,
                    transform: isDesktop ? 'translateX(110px)' : 'translateX(8px)',
                    width: isDesktop ? 292 : 'min(86vw, 320px)',
                    zIndex: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'grid', gap: 0 }}>
                    <div
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: isDesktop ? '8px 12px' : '7px 10px',
                        fontSize: isDesktop ? 14 : 12,
                        fontFamily: 'monospace',
                        color: '#ABD49E',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                      }}
                    >
                      {currentCustomizerItem.label.toUpperCase()}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 0,
                        border: 'none',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          borderRight: 'none',
                          padding: isDesktop ? '8px 12px' : '7px 10px',
                          fontSize: isDesktop ? 13 : 11,
                          fontFamily: 'monospace',
                          color: '#ABD49E',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isOwnedCustomizerItem ? 'OWNED' : currentCustomizerItem.price}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          padding: isDesktop ? '8px 12px' : '7px 10px',
                          fontSize: isDesktop ? 13 : 11,
                          fontFamily: 'monospace',
                          color: '#ABD49E',
                          textTransform: 'uppercase',
                        }}
                      >
                        VIRTUAL ITEM
                      </div>
                    </div>

                    <div style={{ height: isDesktop ? 22 : 14 }}></div>

                    <button
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #ABD49E',
                        padding: isDesktop ? '8px 14px' : '8px 10px',
                        fontSize: isDesktop ? 13 : 11,
                        fontFamily: 'monospace',
                        color: '#ABD49E',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                      onClick={() => {
                        if (isOwnedCustomizerItem) {
                          handleAddDeskItem(currentCustomizerItem.id);
                        } else {
                          handlePurchaseDeskItem(currentCustomizerItem.id);
                        }
                      }}
                    >
                      <span>
                        {isOwnedCustomizerItem
                          ? (isEquippedCustomizerItem ? 'ON BASE' : 'EQUIP BASE')
                          : 'PURCHASE ITEM'}
                      </span>
                      <span>›</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: isDesktop ? 120 : 26,
                    transform: 'translateX(-50%)',
                    background: 'rgba(16,16,16,0.94)',
                    border: '1px solid #ABD49E',
                    padding: isDesktop ? '10px 16px' : '8px 10px',
                    width: isDesktop ? 620 : '82%',
                    textAlign: 'center',
                    color: '#ABD49E',
                    fontFamily: 'monospace',
                    fontSize: isDesktop ? 10 : 9,
                    lineHeight: 1.35,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    zIndex: 6,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  THIS IS YOUR BASE CUSTOMIZER.YOU CAN ADD ITEMS YOU
                  OWN TO YOUR BASE BY TAPPING ON THE &quot;EQUIP BASE&quot; BUTTON
                </div>
              </div>
            )}
            {deskDrawerView && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(16,16,16,0.72)',
                  zIndex: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 18,
                }}
                onClick={() => setDeskDrawerView(null)}
              >
                <div
                  style={{
                    width: 'min(560px, 92vw)',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    background: '#151413',
                    border: '1.5px solid #ABD49E',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(171,212,158,0.25)', color: '#ABD49E', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.08em' }}>
                    <span>{DREAM_DESK_ITEMS[activeDeskItem]?.label || 'DREAM DESK ITEM'}</span>
                    <button onClick={() => setDeskDrawerView(null)} style={{ background: 'none', border: 'none', color: '#ABD49E', fontSize: 20, cursor: 'pointer' }}>×</button>
                  </div>
                  {renderDrawerContent(deskDrawerView)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kura Tab (AI Companion, from kura.js) ────────────────────────────────────
function KuraTab() {
  // Opening state comes from GET /api/kura/daily-state — Kura's per-user daily
  // reading, generated server-side from this user's dream log, dojo XP, level and
  // time of day (see original-backend/src/controllers/kura.js). Replaces a
  // hardcoded three-message conversation that was the entire content here.
  //
  // Note: responding to a *typed* message is still local. There is no chat
  // endpoint on the backend (only the daily state), so the reply below is a
  // holding pattern, not a model call.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [resonance, setResonance] = useState(85);
  const [kuraState, setKuraState] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/kura/daily-state', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((state) => {
        if (cancelled || !state) return;
        setKuraState(state);
        const opening = [];
        if (state.message) opening.push({ id: 'kura-daily', message: state.message, time: 'Today', isKura: true });
        if (state.nudge) opening.push({ id: 'kura-nudge', message: state.nudge, time: 'Today', isKura: true });
        if (opening.length) setMessages(opening);
      })
      .catch(() => {
        // Backend down — leave the thread empty rather than invent a reading.
      });
    return () => { cancelled = true; };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), message: input, time: 'Now', isKura: false }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        message: "The jungle hears you. Let that thought take root and see what grows.",
        time: 'Now',
        isKura: true
      }]);
      setResonance(prev => Math.min(100, prev + 2));
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-secondary text-primary">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center">
            <Sparkles size={16} className="text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wide">YOUR KURA</h1>
            <p className="text-[7px] text-primary/40">AI Companion • {kuraState?.beast ? `${kuraState.beast} (${kuraState.resonance})` : `Resonance: ${resonance}%`}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Heart size={12} className="text-red-400/60" />
          <span className="text-[8px] text-primary/40">Bond: Lv.3</span>
        </div>
      </div>

      {/* Resonance bar */}
      <div className="px-4 py-1.5">
        <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#8B5CF6] transition-all duration-500 rounded-full"
            style={{ width: `${resonance}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isKura ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-2.5 ${
              msg.isKura 
                ? 'bg-primary/10 border border-primary/20' 
                : 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/30'
            }`}>
              <p className="text-[11px] leading-relaxed">{msg.message}</p>
              <p className="text-[7px] text-primary/30 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-2.5 border-t border-primary/10 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Speak to Kura..."
            className="flex-1 bg-transparent border border-primary/20 px-3 py-2 text-[11px] text-primary placeholder-primary/30 focus:outline-none focus:border-primary/40"
          />
          <button onClick={handleSend}
            className="px-3 py-2 bg-[#8B5CF6] text-white text-[10px] font-bold hover:bg-[#7C3AED] transition-all"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dreams Tab (Dream Journal, from dreamlog.js) ─────────────────────────────
function DreamsTab({ ownerId }) {
  const [showNew, setShowNew] = useState(false);
  const [newDream, setNewDream] = useState({ title: '', content: '', mood: 'normal', tags: '' });
  const [dreams, setDreams] = useState([]);
  const [loadingDreams, setLoadingDreams] = useState(true);
  const [savingDream, setSavingDream] = useState(false);

  // Live journal. GET /api/dreamlog returns the viewer's own entries; when the
  // route gate knows whose base this is, /api/dreamlog/public/:ownerId returns
  // that owner's public entries instead. Replaces three MOCK_DREAMS.
  useEffect(() => {
    let cancelled = false;
    const url = ownerId ? `/api/dreamlog/public/${ownerId}` : '/api/dreamlog';
    fetch(url, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return [];
        const body = await res.json();
        if (Array.isArray(body)) return body;
        return Array.isArray(body?.data) ? body.data : [];
      })
      .then((list) => {
        if (cancelled) return;
        setDreams(list.map((d) => ({
          id: d._id,
          title: d.title || 'Untitled dream',
          date: d.createdAt ? String(d.createdAt).slice(0, 10) : '',
          mood: d.mood || 'normal',
          content: d.content || '',
          tags: Array.isArray(d.tags) ? d.tags : [],
        })));
      })
      .catch(() => { if (!cancelled) setDreams([]); })
      .finally(() => { if (!cancelled) setLoadingDreams(false); });
    return () => { cancelled = true; };
  }, [ownerId]);

  // POST /api/dreamlog — the entry is persisted, and only then shown. The mood
  // chip is a local annotation: the DreamLog model stores content/tasks/privacy,
  // not mood, so it is kept in the view model only.
  const handleSave = async () => {
    if (!newDream.title.trim() || savingDream) return;
    setSavingDream(true);
    try {
      const res = await fetch('/api/dreamlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newDream.title,
          content: newDream.content,
          isPrivate: false,
        }),
      });
      if (!res.ok) return; // leave the form open so nothing is silently lost
      const entry = await res.json();
      setDreams((prev) => [{
        id: entry._id,
        title: entry.title || newDream.title,
        date: entry.createdAt ? String(entry.createdAt).slice(0, 10) : '',
        mood: newDream.mood,
        content: entry.content || newDream.content,
        tags: [],
      }, ...prev]);
      setShowNew(false);
      setNewDream({ title: '', content: '', mood: 'normal', tags: '' });
    } catch {
      // Network failure — keep the draft on screen.
    } finally {
      setSavingDream(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary text-primary overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Moon size={15} className="text-[#8B5CF6]" />
          <h1 className="text-xs font-bold tracking-[0.15em]">DREAM LOG</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1 text-[9px] font-bold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
        >
          <Plus size={12} /> NEW
        </button>
      </div>

      {/* New dream form */}
      {showNew && (
        <div className="px-4 py-3 border-b border-primary/10 bg-primary/5">
          <div className="space-y-2.5">
            <input type="text" placeholder="Dream title..." value={newDream.title}
              onChange={e => setNewDream(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-transparent border border-primary/20 px-3 py-2 text-[11px] text-primary placeholder-primary/30 focus:outline-none focus:border-primary/40"
            />
            <textarea placeholder="Describe your dream..." value={newDream.content}
              onChange={e => setNewDream(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full bg-transparent border border-primary/20 px-3 py-2 text-[11px] text-primary placeholder-primary/30 focus:outline-none focus:border-primary/40 resize-none"
            />
            <div className="flex gap-2">
              {['normal', 'vivid', 'lucid'].map(mood => (
                <button key={mood} onClick={() => setNewDream(prev => ({ ...prev, mood }))}
                  className={`px-3 py-1 text-[8px] font-bold tracking-wider transition-all ${
                    newDream.mood === mood ? 'bg-[#8B5CF6] text-white' : 'border border-primary/20 text-primary/60'
                  }`}
                >
                  {mood.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={handleSave}
              className="w-full py-2 bg-primary text-secondary text-[9px] font-bold tracking-wider hover:bg-primary/90 transition-all"
            >
              SAVE DREAM
            </button>
          </div>
        </div>
      )}

      {/* Dream list */}
      <div className="px-4 pt-3 space-y-2.5 flex-1">
        {loadingDreams && (
          <p className="text-[9px] text-primary/30 text-center py-6">Loading dreams…</p>
        )}
        {!loadingDreams && dreams.length === 0 && (
          <p className="text-[9px] text-primary/30 text-center py-6">No dreams logged yet. Write one down and the jungle will remember it.</p>
        )}
        {dreams.map(dream => (
          <div key={dream.id} className="border border-primary/20 hover:border-primary/40 transition-all p-3">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="text-xs font-bold tracking-wide">{dream.title}</h3>
              <span className="text-[7px] text-primary/40">{dream.date}</span>
            </div>
            <p className="text-[9px] text-primary/60 mb-1.5 line-clamp-2">{dream.content}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[7px] px-2 py-0.5 ${
                dream.mood === 'lucid' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30' :
                dream.mood === 'vivid' ? 'bg-primary/20 text-primary border border-primary/30' :
                'bg-primary/10 text-primary/50 border border-primary/20'
              }`}>
                {dream.mood.toUpperCase()}
              </span>
              {dream.tags.map(tag => (
                <span key={tag} className="text-[7px] text-primary/30">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="border border-[#8B5CF6]/20 p-3 text-center">
          <Star size={14} className="mx-auto mb-1.5 text-[#8B5CF6]" />
          <p className="text-[10px] text-primary/50">{dreams.length} dream{dreams.length === 1 ? '' : 's'} logged</p>
        </div>
      </div>
    </div>
  );
}

// ─── Dojo Tab (Fitness, from dojo.js) ─────────────────────────────────────────
function DojoTab() {
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loadingRoutine, setLoadingRoutine] = useState(true);
  const [dojoXp, setDojoXp] = useState(null);

  // GET /api/fanbase/my-dojo -> THE Dojo fanbase (fanbaseType 'fitness'), then
  // GET /api/routine/today?fanbaseId= -> the current week's entry for today
  // (day / name / isRest / duration / exercises[]). Replaces four MOCK_ROUTINES.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const dojoRes = await fetch('/api/fanbase/my-dojo', { credentials: 'include' });
        const dojo = dojoRes.ok ? await dojoRes.json() : null;
        const fanbaseId = dojo && dojo.fanbase ? dojo.fanbase._id : null;
        if (!cancelled && dojo && dojo.membership) setDojoXp(dojo.membership.dojoXp);
        if (!fanbaseId) {
          if (!cancelled) setRoutines([]);
          return;
        }

        const res = await fetch(`/api/routine/today?fanbaseId=${encodeURIComponent(fanbaseId)}`, { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setRoutines([]);
          return;
        }
        const body = await res.json();
        const today = body && body.today;
        if (!today) {
          if (!cancelled) setRoutines([]);
          return;
        }

        if (!cancelled) {
          setRoutines([{
            id: today.day || 'today',
            name: today.name || today.day,
            duration: today.isRest ? 'Rest' : `${today.duration || 0} min`,
            level: today.isRest ? 'recovery' : 'today',
            exercises: Array.isArray(today.exercises) ? today.exercises : [],
            focus: today.day || 'Today',
            color: today.isRest ? '#10B981' : '#8B5CF6',
          }]);
        }
      } catch {
        if (!cancelled) setRoutines([]);
      } finally {
        if (!cancelled) setLoadingRoutine(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col h-full bg-secondary text-primary overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={16} className="text-primary" />
          <h1 className="text-xs font-bold tracking-[0.15em]">THE DOJO</h1>
        </div>
        <p className="text-[9px] text-primary/50">Train your body. Level up your mind.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 flex-shrink-0">
        {[
          // Only XP is backed by a real field today (FanbaseMembership.dojoXp from
          // GET /api/fanbase/my-dojo). The others have no source yet, so they show
          // a dash rather than an invented number.
          { icon: Zap, label: 'STREAK', value: '—' },
          { icon: Flame, label: 'CALORIES', value: '—' },
          { icon: Target, label: 'XP', value: dojoXp == null ? '—' : String(dojoXp) },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="border border-primary/20 p-2.5 text-center">
              <Icon size={14} className="mx-auto mb-1 text-[#8B5CF6]" />
              <p className="text-[11px] font-bold">{stat.value}</p>
              <p className="text-[7px] text-primary/40 tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Routines */}
      <div className="px-4 flex-1">
        <h2 className="text-[10px] font-bold tracking-[0.15em] mb-2.5 text-primary/60 uppercase">Today's Routines</h2>
        <div className="space-y-2.5">
          {loadingRoutine && (
            <p className="text-[9px] text-primary/30 text-center py-6">Loading your programme…</p>
          )}
          {!loadingRoutine && routines.length === 0 && (
            <p className="text-[9px] text-primary/30 text-center py-6">No programme yet. Complete Dojo onboarding and Kura will build your week.</p>
          )}
          {routines.map(routine => (
            <div key={routine.id}
              onClick={() => setActiveRoutine(activeRoutine === routine.id ? null : routine.id)}
              className={`border transition-all p-3 cursor-pointer ${
                activeRoutine === routine.id ? 'border-primary/40 bg-primary/5' : 'border-primary/20 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ background: `${routine.color}22` }}
                  >
                    <Dumbbell size={12} color={routine.color} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-wide">{routine.name}</h3>
                    <p className="text-[8px] text-primary/40">{routine.focus} • {routine.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#8B5CF6]">{routine.duration}</p>
                  <p className="text-[7px] text-primary/40">{routine.exercises.length} exercises</p>
                </div>
              </div>
              {activeRoutine === routine.id && (
                <div className="mt-2.5 pt-2.5 border-t border-primary/10">
                  {routine.exercises.length > 0 && (
                    <div className="space-y-1.5 mb-2.5">
                      {routine.exercises.map((ex, i) => (
                        <div key={`${ex.name}-${i}`} className="flex items-center justify-between text-[9px] gap-2">
                          <span className="text-primary/70 truncate">{ex.name}</span>
                          <span className="text-primary/40 whitespace-nowrap">
                            {ex.sets ? `${ex.sets}×` : ''}{ex.reps || ''}
                            {ex.rest && ex.rest !== '—' ? ` • rest ${ex.rest}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="w-full py-2 bg-primary text-secondary text-[9px] font-bold tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-1">
                    <Zap size={11} /> START WORKOUT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Generate CTA */}
      <div className="px-4 py-4">
        <button className="w-full border border-[#8B5CF6]/30 p-3 hover:border-[#8B5CF6]/60 transition-all text-center group">
          <Sparkles size={14} className="mx-auto mb-1.5 text-[#8B5CF6]" />
          <h3 className="text-[10px] font-bold tracking-wider text-[#8B5CF6] mb-0.5">AI-GENERATED ROUTINE</h3>
          <p className="text-[8px] text-primary/40">Let Kura create a personalized workout for you</p>
        </button>
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home',   label: 'HOME',   Icon: IconHome },
    { id: 'kura',   label: 'KURA',   Icon: () => <Sparkles size={16} className="text-[#8B5CF6]" /> },
    { id: 'dreams', label: 'DREAMS', Icon: () => <Moon size={16} className="text-[#8B5CF6]" /> },
    { id: 'dojo',   label: 'DOJO',   Icon: () => <Dumbbell size={16} className="text-primary" /> },
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

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ profile, onClose }) {
  const [message, setMessage] = useState('');
  // There is no messaging endpoint on the backend yet (no /api/chat route), so the
  // thread starts empty and sending is a local echo. The two invented messages that
  // were hardcoded here posed as a real conversation between the viewer and this
  // base's owner.
  const [thread, setThread] = useState([]);

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    setThread(prev => [...prev, { id: Date.now(), them: false, text }]);
    setMessage('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#151413' }}>
      <div style={{ height: 18, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 32, height: 3, background: '#ABD49E' }}/>
      </div>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, paddingInline: 12, background: '#ABD49E', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: '#101010', flexShrink: 0, overflow: 'hidden' }}>
          {profile.avatar && <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
        </div>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#101010', fontWeight: 700, letterSpacing: '0.05em' }}>{profile.displayName}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <IconClose color="#101010"/>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {thread.length === 0 && (
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(171,212,158,0.4)', textAlign: 'center', marginTop: 12 }}>
            No messages yet.
          </p>
        )}
        {thread.map(msg => (
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
      <div style={{ display: 'flex', borderTop: '1px solid rgba(171,212,158,0.25)', flexShrink: 0 }}>
        <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Message…" style={{
          flex: 1, height: 44, padding: '0 12px', background: 'transparent',
          border: 'none', outline: 'none', color: '#ABD49E', fontFamily: 'monospace', fontSize: 12,
        }}/>
        <button onClick={handleSend} style={{
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
function ProfileDrawer({ open, onToggle, onClose, profile, vitals = [], connectionState, onConnect, chatOpen, onChatToggle }) {
  // useRouter has to run before the chatOpen early return: a conditional hook
  // would break the drawer the moment the chat panel is toggled.
  const router = useRouter();

  if (chatOpen) {
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 380, background: '#151413', zIndex: 200 }}>
        <ChatPanel profile={profile} onClose={onChatToggle}/>
      </div>
    );
  }

  const isPending   = connectionState === 'pending';
  const isConnected = connectionState === 'connected';

  // Your own base is not a person to connect to: the one action that makes sense
  // here is opening the customiser, which is where décor and furniture live
  // (pages/home/index.js → PUT /api/home).
  const isSelf = Boolean(profile.isSelf);
  const inert = !isSelf && (isPending || isConnected);
  const primaryLabel = isSelf
    ? 'CUSTOMISE THIS BASE'
    : isPending ? 'REQUEST SENT' : isConnected ? 'CONNECTED' : 'CONNECT';
  const onPrimaryAction = isSelf
    ? () => router.push('/home')
    : inert ? undefined : onConnect;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#151413', zIndex: 200 }}>
      <button onClick={onToggle} style={{
        width: '100%', height: 64, display: 'flex', alignItems: 'center',
        paddingInline: 12, gap: 12, background: '#ABD49E',
        border: 'none', cursor: 'pointer', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)' }}>
          <IconChevron up={open}/>
        </div>
        <div style={{ width: 50, height: 50, background: '#101010', flexShrink: 0, overflow: 'hidden', marginTop: 10 }}>
          <MockAvatar username={profile.username} src={profile.avatar} size="100%" style={{ border: 'none' }}/>
        </div>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#101010', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 10, textAlign: 'left' }}>
          {profile.displayName}
        </span>
        <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ marginTop: 10, display: 'flex', alignItems: 'center', padding: 4, cursor: 'pointer' }}>
          <IconClose color="#101010"/>
        </div>
      </button>

      {open && (
        <div style={{ background: '#151413' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px 0' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <IconClose color="#ABD49E"/>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 14, padding: '0 16px 14px' }}>
            <div style={{ width: 97, height: 97, background: '#101010', flexShrink: 0, overflow: 'hidden' }}>
              <MockAvatar username={profile.username} src={profile.avatar} size="100%" fontSize={40} style={{ border: 'none' }}/>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
              {/* The rank sits with the name: it is identity, and the XP bar it used
                  to be welded to is now a status bar below. */}
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#ABD49E', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {profile.displayName}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(171,212,158,0.7)', letterSpacing: '0.1em', marginTop: 3 }}>
                  {profile.xpRank}
                </p>
              </div>
              <div style={{ display: 'flex' }}>
                {/* The owner's real record: FOLLOWERS off the user document, and the
                    two counts derived from the visit log. The 300 / 1279 / 29.7K that
                    used to sit here was hardcoded, so every base in the jungle read
                    exactly the same. */}
                {[
                  { value: profile.followers, label: 'FOLLOWERS' },
                  { value: profile.visits,    label: 'VISITS' },
                  { value: profile.visitors,  label: 'VISITORS' },
                ].map(({ value, label }, i) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(171,212,158,0.3)' : 'none' }}>
                    <p style={{ fontFamily: 'monospace', fontSize: 14, color: '#ABD49E', fontWeight: 700 }}>{value}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 7, color: '#ABD49E', letterSpacing: '0.05em', marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compact status bars — the design system asked for them and
              components/VitalBars.jsx is the component that draws them. Every bar
              comes from deriveVitals, so nothing is invented: no mood or energy
              number, because a visitor's view of those is not public.

              The visits bar is left out on purpose — VISITS is already a number in
              the row above, and a bar repeating it would just be the same figure
              twice. What is left is XP and streak: the two things the card does not
              otherwise print. */}
          {vitals.length ? (
            <VitalBars vitals={vitals} style={{ margin: '0 16px 12px' }}/>
          ) : null}

          <div style={{ margin: '0 16px 14px' }}>
            <p style={{ fontFamily: 'Averia Sans Libre, sans-serif', fontSize: 13, color: '#E3E3E3', lineHeight: 1.55 }}>
              {profile.bio}
            </p>
            {profile.location ? (
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#ABD49E', letterSpacing: '0.08em', marginTop: 6, opacity: 0.65 }}>
                {profile.location.toUpperCase()}
              </p>
            ) : null}
          </div>

          <div style={{ padding: '0 16px 16px' }}>
            {/* Standing in a base is a social act, and POST /api/visit records it
                (one per visitor per day). Saying it back is the knock: it only
                ever appears for someone who is not the owner. */}
            {profile.visitNote ? (
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#ABD49E', letterSpacing: '0.08em', marginBottom: 8, opacity: 0.75 }}>
                {profile.visitNote}
              </p>
            ) : null}
            <button onClick={onPrimaryAction} style={{
              width: '100%', height: 30,
              background: inert ? 'transparent' : '#ABD49E',
              border: inert ? '1px solid rgba(171,212,158,0.5)' : 'none',
              color: inert ? '#ABD49E' : '#101010',
              fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em',
              cursor: inert ? 'default' : 'pointer',
            }}>
              {primaryLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Connected View — Full-screen immersive map ───────────────────────────────
function ConnectedView({ profile }) {
  const router = useRouter();
  const [activeDeskItem, setActiveDeskItem] = useState(null);
  const [deskPopupOpen, setDeskPopupOpen] = useState(false);
  const containerRef = useRef(null);
  const [frozen, setFrozen] = useState(null);
  const zoomedGrid = GRID_SIZE * ZOOM_FACTOR;

  useEffect(() => {
    const el = containerRef.current;
    if (el && !frozen) setFrozen({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#151413' }}>
      {frozen && (
        <div
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: frozen.w, height: frozen.h,
            overflow: 'hidden',
          }}
          onClick={() => setDeskPopupOpen(false)}
        >
          <div style={{ position: 'relative', width: frozen.w, height: frozen.h }}>
            <MapBackground cw={frozen.w} ch={frozen.h} username={profile.username} />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 4,
              }}
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
        </div>
      )}

      <div style={{
        position: 'absolute', top: 13, left: 13, right: 13, bottom: 13,
        border: '1px solid rgba(171,212,158,0.1)', pointerEvents: 'none', zIndex: 2,
      }}/>

      <div className="hidden md:flex" style={{
        position: 'absolute', top: 52, left: 77, width: 270, height: 45,
        background: '#ABD49E', alignItems: 'center', paddingInline: 14, gap: 8, zIndex: 10,
      }}>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#101010', fontWeight: 700, letterSpacing: '0.05em' }}>
          {profile.displayName}'S BASE
        </span>
        <span style={{ fontSize: 9, color: '#101010' }}>▼</span>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 10 }}>
        <button style={{ width: 37, height: 37, background: '#ABD49E', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
          <IconVolume color="#101010"/>
        </button>
        <button style={{ width: 34, height: 34, background: '#101010', border: '1px solid rgba(171,212,158,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconMenu/>
        </button>
      </div>

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

// ─── Server-side props — ensures dynamic route works ─────────────────────────
export async function getServerSideProps({ params }) {
  return {
    props: {
      username: params?.username || null,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function UserBase({ username: ssrUsername, base }) {
  const router = useRouter();
  const { username } = router.query;
  useHideBottomNav(true);

  const [activeTab, setActiveTab]             = useState('home');
  const [drawerOpen, setDrawerOpen]           = useState(false);
  const [chatOpen, setChatOpen]               = useState(false);
  const [activeDeskItem, setActiveDeskItem]   = useState(null);
  const [connectionState, setConnectionState] = useState('stranger');
  const [visitResult, setVisitResult]         = useState(null);
  // Who is standing here: the plan view draws the visitor's own avatar at the door
  // when the base is somebody else's. The session slice is the same source of truth
  // NavBar reads, and a logged-out viewer simply gets no second avatar.
  const viewerUsername = useSelector((state) => state.registerSlice.username);


  // Everything the drawer shows is the owner's own record, read through
  // GET /api/homes/u/:username — the same allow-listed public fields anyone else
  // sees. It replaces a hardcoded profile object (avatar: null, followers:
  // '29.7K', moments: 300) that made every base in the jungle look identical.
  const owner  = base && base.owner ? base.owner : null;
  const visits = (visitResult && visitResult.visits) || (base && base.visits) || { total: 0, unique: 0 };
  const isSelf = Boolean(base && base.isSelf);
  const handle = (owner && owner.username) || username || '';

  const visitedToday = Boolean(
    (visitResult && visitResult.firstVisitToday)
    || (base && base.visits && base.visits.visitedByYouToday)
  );

  const profile = {
    username:    handle,
    displayName: handle ? handle.toUpperCase() : 'USER',
    avatar:      (owner && owner.profile_picture) || null,
    bio:         (owner && owner.about) || 'This base has not been written yet.',
    location:    (owner && owner.location) || null,
    followers:   formatCount(owner && owner.number_of_followers),
    visits:      visits.total || 0,
    visitors:    visits.unique || 0,
    xpRank:      String((owner && owner.level) || 'Novice').toUpperCase(),
    isSelf,
    // What the visit endpoint said back, told apart from what the page found
    // already recorded: "counted" is only claimed when this mount is what added
    // the row (firstVisitToday), otherwise the honest line is that you were here.
    visitNote: isSelf || !visitedToday
      ? null
      : (visitResult && visitResult.firstVisitToday)
        ? 'YOU KNOCKED — THIS VISIT COUNTED'
        : 'YOU WERE HERE TODAY',
  };

  // Standing in someone's base is a social act, so the arrival is recorded
  // (POST /api/visit). One row per visitor per host per day — the compound unique
  // index on Visit makes a refresh a no-op — so it is safe to fire on mount.
  // A logged-out viewer gets a 401 and nothing happens: the base still renders,
  // it is just not counted. The owner is never their own visitor.
  useEffect(() => {
    if (!profile.username || isSelf) return undefined;
    if (base && base.visits && base.visits.visitedByYouToday) return undefined;
    let cancelled = false;
    fetch('/api/visit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => { if (!cancelled && body && body.data) setVisitResult(body.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile.username, isSelf, base]);

  // XP and streak only: the visits bar is dropped because the stat row above
  // already prints the same number (see the note in the drawer markup).
  const vitals = useMemo(
    () => deriveVitals(owner, visits).filter((v) => v.key !== 'visits'),
    [owner, visits]
  );

  if (connectionState === 'connected') {
    return (
      <>
        <Head><title>{profile.displayName}'s Base</title></Head>
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
          {profile.displayName}'s Base
        </span>
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab}/>

      <div style={{ height: 1, background: '#ABD49E', flexShrink: 0 }}/>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'home'   && <HomeScene activeDeskItem={activeDeskItem} setActiveDeskItem={setActiveDeskItem} username={username} onOpenKura={() => setActiveTab('kura')} home={base && base.home} isSelf={isSelf} viewerUsername={viewerUsername} visitorNote={profile.visitNote} />}
        {activeTab === 'kura'   && <KuraTab />}
        {activeTab === 'dreams' && <DreamsTab ownerId={owner ? owner._id : null} />}
        {activeTab === 'dojo'   && <DojoTab />}

        {/* QR / Smiley on home tab */}
          {activeTab === 'home' && null}
      </div>

      <ProfileDrawer
        open={drawerOpen}
        onToggle={() => { setDrawerOpen(d => !d); setChatOpen(false); }}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        vitals={vitals}
        connectionState={connectionState}
        onConnect={() => setConnectionState('pending')}
        chatOpen={chatOpen}
        onChatToggle={() => setChatOpen(c => !c)}
      />
    </div>
  );
}

// ─── Route gate ───────────────────────────────────────────────────────────────
// /[username] is a single-segment catch-all, so without this guard a typo like
// /lucidjunglz renders a complete — and entirely fabricated — base, and crawlers
// index an infinite number of fake profiles. This gate is the contract rebuilt
// already had (commit da91698); it is re-attached here so the CONSOLIDATED base
// design keeps the same 404 behaviour.
//
// It is deliberately conservative: only a *definitive* "no such user" from the API
// shows the not-found screen. A backend outage, a 5xx or an unparseable body all
// fail OPEN and render the base exactly as before, so an outage never 404s a real
// user's home. See hooks/useUsernameLookup.js and hooks/useBaseLookup.js.
//
// The gate is its own component rather than an early return inside UserBase,
// because UserBase declares hooks right through its body and a conditional return
// between them would break the rules of hooks.
export default function UserBaseRoute() {
  const router = useRouter();
  const { username } = router.query;

  const lookupState = useUsernameLookup(username);
  const { status: baseStatus, base } = useBaseLookup(username);

  // /api/homes is authoritative when it answers; the older /api/user lookup still
  // decides when /api/homes could not answer at all (i.e. an older deployment).
  const missing = baseStatus === BASE_LOOKUP.MISSING
    || (lookupState === USER_LOOKUP.MISSING && baseStatus !== BASE_LOOKUP.READY);

  if (missing) {
    return (
      <NotFoundScreen
        documentTitle="No base by that name — Lucid Jungles"
        title="No base by that name"
        message={`Nobody in the jungle goes by “${username}”. Check the spelling, or head back to your own base.`}
      />
    );
  }

  // The base object itself goes down to UserBase: it carries the owner, the visit
  // counts and isSelf, so the page never has to reconstruct any of it.
  return <UserBase username={username} base={base} />;
}

