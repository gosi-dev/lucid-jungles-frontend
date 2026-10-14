// components/JungleMapCanvas.jsx
// The one pan/zoom viewport for every full jungle map (DREAMING, a public base, WORLD).
//
// There was no reusable version of this: each map page was an `overflow: auto` scroller,
// which cannot zoom, cannot pinch, and lets the camera drift away from the home base.
// This component owns *camera state only* — callers pass the canvas contents (grid,
// paths, nodes) as children inside a `width x height` pixel space.
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 1.25;
const DRAG_THRESHOLD = 5; // px a press may travel before it counts as a drag, not a tap

export default function JungleMapCanvas({
  width,
  height,
  offset = 0,
  gridSize = 260,
  focusX = 0,
  focusY = 0,
  bottomInset = 0,
  background,
  children,
}) {
  const containerRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);

  // Refs let the window-level listeners read fresh values without re-subscribing.
  const viewRef = useRef(view);
  viewRef.current = view;
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

  // Zoom about a point in container-local pixels so the map stays under the cursor/fingers.
  const zoomAt = useCallback((localX, localY, factor) => {
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const k = scale / v.scale;
      return { scale, x: localX - k * (localX - v.x), y: localY - k * (localY - v.y) };
    });
  }, []);

  // Put grid coordinate (gx, gy) in the middle of the viewport, above the bottom inset.
  const centerOn = useCallback(
    (gx, gy, scale = 1) => {
      const el = containerRef.current;
      if (!el) return;
      const cx = offset + gx * gridSize + gridSize / 2;
      const cy = offset + gy * gridSize + gridSize / 2;
      setView({
        scale,
        x: el.clientWidth / 2 - cx * scale,
        y: (el.clientHeight - bottomInset) / 2 - cy * scale,
      });
    },
    [offset, gridSize, bottomInset]
  );

  // Centre on the home base once, when the container has been laid out.
  useEffect(() => {
    centerOn(focusX, focusY);
  }, [centerOn, focusX, focusY]);

  // Wheel zoom. Bound natively because React's wheel listener is passive, so it cannot
  // preventDefault the page scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(
        event.clientX - rect.left,
        event.clientY - rect.top,
        event.deltaY < 0 ? 1.1 : 1 / 1.1
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Pan + pinch. Deliberately NOT using setPointerCapture: capturing retargets pointerup
  // to this container, which makes `click` fire here instead of on the node the user
  // actually tapped, breaking every node tap. Window listeners keep node clicks intact.
  useEffect(() => {
    const onMove = (event) => {
      const el = containerRef.current;
      if (!el) return;
      if (pointersRef.current.has(event.pointerId)) {
        pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      // Two fingers down: pinch to zoom about their midpoint.
      if (pointersRef.current.size === 2 && pinchRef.current) {
        const [a, b] = [...pointersRef.current.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const base = pinchRef.current.distance;
        if (base > 0 && distance > 0) {
          const rect = el.getBoundingClientRect();
          zoomAt((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, distance / base);
          pinchRef.current.distance = distance;
        }
        return;
      }

      const drag = dragRef.current;
      if (!drag.active) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;
      setView((v) => ({ ...v, x: drag.originX + dx, y: drag.originY + dy }));
    };

    const onUp = (event) => {
      pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 0) {
        dragRef.current.active = false;
        setDragging(false);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [zoomAt]);

  const beginGesture = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return; // right/middle click
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
      };
      setDragging(true);
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
      dragRef.current.active = false;
    }
  };

  // A press that travelled was a pan, not a tap — swallow the click the node would get.
  const swallowClickAfterDrag = (event) => {
    if (!dragRef.current.moved) return;
    event.stopPropagation();
    event.preventDefault();
    dragRef.current.moved = false;
  };

  const zoomByButton = (factor) => {
    const el = containerRef.current;
    if (!el) return;
    zoomAt(el.clientWidth / 2, (el.clientHeight - bottomInset) / 2, factor);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={beginGesture}
      onClickCapture={swallowClickAfterDrag}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: bottomInset,
        overflow: 'hidden',
        background,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {children}
      </div>

      {/* Camera controls */}
      <div
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          position: 'absolute',
          right: 16,
          bottom: bottomInset + 16,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {[
          { key: 'in', label: '+', title: 'Zoom in', run: () => zoomByButton(ZOOM_STEP) },
          { key: 'out', label: '−', title: 'Zoom out', run: () => zoomByButton(1 / ZOOM_STEP) },
          {
            key: 'home',
            label: '◎',
            title: 'Recentre on your base',
            run: () => centerOn(focusX, focusY),
          },
        ].map((control) => (
          <button
            key={control.key}
            type="button"
            title={control.title}
            aria-label={control.title}
            onClick={control.run}
            style={{
              width: 40,
              height: 40,
              backgroundColor: '#151413',
              border: '1px solid #ABD49E',
              color: '#ABD49E',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'CodeSaver, monospace',
            }}
          >
            {control.label}
          </button>
        ))}
      </div>
    </div>
  );
}
