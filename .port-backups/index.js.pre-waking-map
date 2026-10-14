import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Head from "next/head";
import isMobile from "is-mobile";
import NavBar from "../components/NavBar";
import {
  KuraNode,
  MojNode,
  CCStudiosNode,
  BonzoNode2,
  DojoNode,
} from "../components/MapNodes";
import {
  generateMapElements,
  getElementSize,
  getEntitySizing,
} from "../data/jungleMapElements";

// Grid constants
const GRID_SIZE = 75;

// Entity placements on the grid — buildings are large "building" type
const MAP_ENTITIES = [
  { id: "kura",       type: "user",     gridX: 0,   gridY: 0,   name: "YOUR KURA" },
  { id: "bonzo",      type: "user",     gridX: -3,  gridY: 7,   name: "BONZO" },
  { id: "moj",        type: "building", gridX: -12, gridY: -5,  name: "OLD SECRETARIAT" },
  { id: "ccstudios",  type: "building", gridX: 8,   gridY: 3,   name: "CAPPUCCINO STUDIOX" },
  { id: "dojo",       type: "building", gridX: 14,  gridY: -8,  name: "BONZO'S DOJO" },
];

export default function Landing() {
  const mobile = isMobile();
  const mapRef = useRef(null);
  const [hasDragged, setHasDragged] = useState(false);

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
    const buffer = 5;
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
      mapBounds.minGridCoord,
      mapBounds.maxGridCoord,
      mapBounds.minGridCoord,
      mapBounds.maxGridCoord,
      MAP_ENTITIES
    );
  }, [mapBounds]);

  // Pre-compute pixel positions for all natural elements
  const naturalWithPositions = useMemo(() => {
    return naturalComponents.map((comp) => {
      const x = GRID_OFFSET + comp.gridX * GRID_SIZE;
      const y = GRID_OFFSET + comp.gridY * GRID_SIZE;
      let size;
      if (comp.type === "big-tree") size = GRID_SIZE * 2 * 0.95;
      else if (comp.type === "small-tree" || comp.type === "palm") size = GRID_SIZE * 2 * 0.62;
      else size = GRID_SIZE;
      return { ...comp, px: x, py: y, size };
    });
  }, [naturalComponents, GRID_OFFSET]);

  // Viewport culling state
  const [viewport, setViewport] = useState({ x: 0, y: 0, w: 2000, h: 2000 });
  const scrollRAF = useRef(null);

  const handleScroll = useCallback(() => {
    if (scrollRAF.current) return;
    scrollRAF.current = requestAnimationFrame(() => {
      scrollRAF.current = null;
      const el = mapRef.current;
      if (!el) return;
      setViewport({
        x: el.scrollLeft,
        y: el.scrollTop,
        w: el.clientWidth,
        h: el.clientHeight,
      });
    });
  }, []);

  // Visible natural elements (within viewport + buffer)
  const CULL_BUFFER = 400;
  const visibleNaturals = useMemo(() => {
    const vl = viewport.x - CULL_BUFFER;
    const vr = viewport.x + viewport.w + CULL_BUFFER;
    const vt = viewport.y - CULL_BUFFER;
    const vb = viewport.y + viewport.h + CULL_BUFFER;
    return naturalWithPositions.filter(
      (c) => c.px + c.size / 2 >= vl && c.px - c.size / 2 <= vr && c.py + c.size / 2 >= vt && c.py - c.size / 2 <= vb
    );
  }, [naturalWithPositions, viewport]);

  // Center on Kura (HOME) at (0,0) after mount
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        const container = mapRef.current;
        const homeX = GRID_OFFSET;
        const homeY = GRID_OFFSET;
        container.scrollLeft = homeX - container.clientWidth / 2;
        container.scrollTop = homeY - container.clientHeight / 2;
        // Seed initial viewport so culling kicks in immediately
        setViewport({
          x: container.scrollLeft,
          y: container.scrollTop,
          w: container.clientWidth,
          h: container.clientHeight,
        });
      }, 100);
    }
  }, [GRID_OFFSET]);

  const getPosition = (gridX, gridY) => ({
    x: GRID_OFFSET + gridX * GRID_SIZE,
    y: GRID_OFFSET + gridY * GRID_SIZE,
  });

  // SVG path lookup — static, never changes
  const IMAGE_PATHS = {
    "big-tree-1": `/jungle/Property%201=A.svg`,
    "big-tree-2": `/jungle/Property%201=B.svg`,
    "small-tree-1": `/jungle/Property%201=A%20(1).svg`,
    "small-tree-2": `/jungle/Property%201=B%20(1).svg`,
    "palm": `/jungle/Property%201=Palm%20Tree.svg`,
    "shrub": `/jungle/Property%201=Shrubs.svg`,
    "rock": `/jungle/Property%201=Rocks.svg`,
    "flowers": `/jungle/Property%201=Flowers.svg`,
  };

  const getImagePath = (comp) => {
    if (comp.type === "big-tree") return IMAGE_PATHS[`big-tree-${comp.variant || 1}`];
    if (comp.type === "small-tree") return IMAGE_PATHS[`small-tree-${comp.variant || 1}`];
    return IMAGE_PATHS[comp.type];
  };

  // Pre-compute stable entity positions (never change)
  const entityPositions = useMemo(() => {
    return MAP_ENTITIES.map((entity) => {
      const x = GRID_OFFSET + entity.gridX * GRID_SIZE;
      const y = GRID_OFFSET + entity.gridY * GRID_SIZE;
      const sizing = getEntitySizing(entity.type);
      const pixelSize = sizing.iconSize * GRID_SIZE;
      return { ...entity, x, y, pixelSize };
    });
  }, [GRID_OFFSET]);

  return (
    <>
      <Head>
        <title>Lucid Jungles — Jungle Map</title>
      </Head>
      <main className="relative w-[100dvw] h-[100dvh] font-CodeSaver bleed-nav" style={{ backgroundColor: "#0A2A0A" }}>
        <NavBar audioControls={false} />

        {/* Scrollable jungle map container */}
        <div
          ref={mapRef}
          className="jungle-map-container"
          onScroll={handleScroll}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "auto",
            background:
              "linear-gradient(135deg, #0A2A0A 0%, #1A472A 30%, #2D5A3D 70%, #3D6B4F 100%)",
          }}
        >
          {/* Map content — sized to fit all entities + buffer */}
          <div
            style={{
              position: "relative",
              width: `${MAP_SIZE}px`,
              height: `${MAP_SIZE}px`,
              minWidth: `${MAP_SIZE}px`,
              minHeight: `${MAP_SIZE}px`,
            }}
          >
            {/* Foliage background pattern */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2316a34a' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                opacity: 0.4,
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {/* Fine grid lines */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `
                  linear-gradient(to right, rgba(171, 212, 158, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(171, 212, 158, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                pointerEvents: "none",
                zIndex: 5,
              }}
            />

            {/* Coarse grid lines (every 5 squares) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `
                  linear-gradient(to right, rgba(171, 212, 158, 0.1) 2px, transparent 2px),
                  linear-gradient(to bottom, rgba(171, 212, 158, 0.1) 2px, transparent 2px)
                `,
                backgroundSize: `${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`,
                pointerEvents: "none",
                zIndex: 5,
              }}
            />

            {/* SVG dashed paths connecting entities to Kura */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 15,
              }}
            >
              {MAP_ENTITIES.filter((e) => e.id !== "kura").map((entity) => {
                const kuraPos = getPosition(0, 0);
                const entityPos = getPosition(entity.gridX, entity.gridY);
                const sizing = getEntitySizing(entity.type);
                const halfIcon = (sizing.iconSize * GRID_SIZE) / 2;
                return (
                  <line
                    key={`path-${entity.id}`}
                    x1={kuraPos.x + GRID_SIZE / 2}
                    y1={kuraPos.y + GRID_SIZE / 2}
                    x2={entityPos.x + halfIcon}
                    y2={entityPos.y + halfIcon}
                    stroke={
                      entity.type === "building"
                        ? "rgba(139, 92, 246, 0.25)"
                        : "rgba(171, 212, 158, 0.25)"
                    }
                    strokeWidth="2"
                    strokeDasharray="8,6"
                  />
                );
              })}
            </svg>

            {/* Procedural natural elements — viewport-culled */}
            {visibleNaturals.map((comp) => (
              <img
                key={comp.id}
                src={getImagePath(comp)}
                alt=""
                loading="lazy"
                decoding="async"
                style={{
                  position: "absolute",
                  left: comp.px,
                  top: comp.py,
                  width: comp.size,
                  height: comp.size,
                  transform: "translate(-50%, -50%)",
                  zIndex: comp.type.includes("tree") || comp.type === "palm" ? 35 : 32,
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* OG entity components */}
            {entityPositions.map((entity) => (
              <div
                key={entity.id}
                style={{
                  position: "absolute",
                  left: entity.x,
                  top: entity.y,
                  width: entity.pixelSize,
                  height: entity.pixelSize,
                  zIndex: entity.type === "building" ? 50 : 40,
                  overflow: "visible",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {entity.id === "kura" && <KuraNode data={{}} />}
                {entity.id === "moj" && <MojNode data={{}} />}
                {entity.id === "ccstudios" && <CCStudiosNode data={{}} />}
                {entity.id === "bonzo" && <BonzoNode2 data={{}} />}
                {entity.id === "dojo" && <DojoNode data={{}} />}
                <div
                  style={{
                    position: "absolute",
                    bottom: -28,
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#151413",
                    color: entity.type === "building" ? "#8B5CF6" : "#ABD49E",
                    padding: "3px 10px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    border: `1px solid ${entity.type === "building" ? "#8B5CF6" : "#ABD49E"}`,
                    fontFamily: "CodeSaver, monospace",
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
            hasDragged ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundColor: "#151413",
            color: "#ABD49E",
            border: "1px solid #ABD49E",
            borderRadius: "4px",
            fontFamily: "CodeSaver, monospace",
          }}
        >
          SCROLL TO EXPLORE THE JUNGLE MAP
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
