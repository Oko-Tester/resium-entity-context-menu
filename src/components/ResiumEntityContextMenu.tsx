import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type Cesium from 'cesium';

/* ---------- Hilfstypen (kopiere bei Bedarf aus deinen Typen) ---------- */
export type MenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  meta?: any;
};
export type PositionOffset = { x: number; y: number };

export interface ResiumEntityContextMenuProps {
  entity?: Cesium.Entity | string;
  getMenuItems: (entity?: Cesium.Entity | string) => MenuItem[] | Promise<MenuItem[]>;
  renderMenuItem?: (item: MenuItem) => React.ReactNode;
  onSelect?: (item: MenuItem, entity?: Cesium.Entity | string) => void | Promise<void>;
  openOn?: 'rightClick' | 'leftClick' | 'hover' | 'longPress';
  positionOffset?: PositionOffset;
  portal?: boolean;
  closeOnOutsideClick?: boolean;
  keyboardNavigation?: boolean;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  zIndex?: number;
  /**
   * ERWEITERUNG: optionale Viewer-Referenz; empfohlen für präzise Entity-Position-Projektion.
   */
  viewer?: Cesium.Viewer | null;
  /** optional: hover open delay in ms */
  hoverDelay?: number;
  /** optional: long press duration in ms */
  longPressDuration?: number;
}

/* ---------- Utility-Funktionen ---------- */
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/* ---------- Komponente ---------- */
export default function ResiumEntityContextMenu(props: ResiumEntityContextMenuProps) {
  const {
    entity,
    getMenuItems,
    renderMenuItem,
    onSelect,
    openOn = 'rightClick',
    positionOffset = { x: 4, y: 4 },
    portal = true,
    closeOnOutsideClick = true,
    keyboardNavigation = true,
    className,
    style,
    disabled = false,
    zIndex = 3000,
    viewer = null,
    hoverDelay = 250,
    longPressDuration = 500,
  } = props;

  /* Interner Zustand */
  const [open, setOpen] = useState(false);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  /* race token für async getMenuItems */
  const callIdRef = useRef(0);

  /* refs */
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemsRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastActivatorRef = useRef<Event | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const lastOpenTimeRef = useRef<number>(0);

  /* Hilfsfunktion: projiziere Entity -> Bildschirmkoordinaten falls möglich */
  const projectEntityToScreen = useCallback(
    (entityRef?: Cesium.Entity | string, viewerRef?: Cesium.Viewer | null) => {
      try {
        if (!viewerRef || !entityRef) return null;
        // Ordne Entity-Objekt zu, falls String übergeben wurde: viewer.entities.getById
        const ent =
          typeof entityRef === 'string'
            ? viewerRef.entities && viewerRef.entities.getById(entityRef)
            : (entityRef as Cesium.Entity);
        if (!ent) return null;
        // Versuch Position aus Entity herauszulesen
        const posProp = (ent as any).position;
        if (!posProp || !viewerRef.scene) return null;
        const time = (viewerRef.clock && viewerRef.clock.currentTime) || undefined;
        const cartesian = posProp.getValue ? posProp.getValue(time) : null;
        if (!cartesian) return null;
        // SceneTransforms: wgs84ToWindowCoordinates
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const windowCoord = (Cesium as any).SceneTransforms.wgs84ToWindowCoordinates(
          viewerRef.scene,
          cartesian,
        );
        if (!windowCoord) return null;
        return { x: windowCoord.x, y: windowCoord.y };
      } catch (err) {
        // failsafe
        return null;
      }
    },
    [],
  );

  /* Lade Menüeinträge (sync/async) mit race-control */
  const loadMenuItems = useCallback(
    async (entityArg?: Cesium.Entity | string) => {
      const myCall = ++callIdRef.current;
      setLoading(true);
      setError(null);
      setItems(null);
      try {
        const res = await getMenuItems(entityArg);
        // nur anwenden, wenn noch aktuell
        if (callIdRef.current === myCall) {
          setItems(res || []);
          setLoading(false);
          setError(null);
          // fokus auf erstes nicht-disabled item
          const firstIndex = (res || []).findIndex((it) => !it.disabled && !it.separator);
          setFocusIndex(firstIndex >= 0 ? firstIndex : -1);
        }
      } catch (e) {
        if (callIdRef.current === myCall) {
          setItems(null);
          setLoading(false);
          setError('Fehler beim Laden');
        }
      }
    },
    [getMenuItems],
  );

  /* Öffne Menü an koords (x,y) oder an Entity-Projektion */
  const openMenuAt = useCallback(
    async (clientX: number, clientY: number, event?: Event) => {
      if (disabled) return;
      lastActivatorRef.current = event || null;
      // fallback: projektieren, falls viewer+entity gegeben
      if (viewer && entity) {
        const proj = projectEntityToScreen(entity, viewer);
        if (proj) {
          clientX = proj.x;
          clientY = proj.y;
        }
      }
      setX(clientX + (positionOffset?.x || 0));
      setY(clientY + (positionOffset?.y || 0));
      setOpen(true);
      lastOpenTimeRef.current = Date.now();
      await loadMenuItems(entity);
    },
    [disabled, entity, loadMenuItems, positionOffset, projectEntityToScreen, viewer],
  );

  /* Schließe Menü */
  const closeMenu = useCallback(() => {
    setOpen(false);
    setItems(null);
    setLoading(false);
    setError(null);
    setFocusIndex(-1);
    callIdRef.current++; // ungültige laufende loads
  }, []);

  /* Klick ausserhalb -> schließen */
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDocClick = (e: MouseEvent) => {
      // wenn click innerhalb menu -> ignore
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      closeMenu();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, closeOnOutsideClick, closeMenu]);

  /* Window resize -> clamp position / optional: neu berechnen */
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      // clamp wait until menu ref exists
      requestAnimationFrame(() => {
        if (!menuRef.current) return;
        const menuRect = menuRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let newX = x;
        let newY = y;
        if (menuRect.right > vw) newX = clamp(vw - menuRect.width - 8, 0, vw);
        if (menuRect.bottom > vh) newY = clamp(vh - menuRect.height - 8, 0, vh);
        if (newX !== x) setX(newX);
        if (newY !== y) setY(newY);
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, x, y]);

  /* Keyboard handling (focus trap + navigation) */
  useEffect(() => {
    if (!open || !keyboardNavigation) return;
    const onKey = (ev: KeyboardEvent) => {
      if (!open) return;
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeMenu();
        return;
      }
      // arrow navigation
      const visibleItems = (items || []).filter((it) => !it.disabled && !it.separator);
      if (visibleItems.length === 0) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        let next = focusIndex;
        // find next non-disabled item
        for (let i = 1; i <= (items || []).length; i++) {
          const idx = (focusIndex + i) % (items || []).length;
          const it = (items || [])[idx];
          if (!it.disabled && !it.separator) {
            next = idx;
            break;
          }
        }
        setFocusIndex(next);
        return;
      }
      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        let prev = focusIndex;
        const n = (items || []).length;
        for (let i = 1; i <= n; i++) {
          const idx = (focusIndex - i + n) % n;
          const it = (items || [])[idx];
          if (!it.disabled && !it.separator) {
            prev = idx;
            break;
          }
        }
        setFocusIndex(prev);
        return;
      }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const it = (items || [])[focusIndex];
        if (it && !it.disabled && !it.separator) {
          // trigger select
          void (async () => {
            try {
              await onSelect?.(it, entity);
            } finally {
              closeMenu();
            }
          })();
        }
      }
      // Home / End
      if (ev.key === 'Home') {
        ev.preventDefault();
        const idx = (items || []).findIndex((it) => !it.disabled && !it.separator);
        if (idx >= 0) setFocusIndex(idx);
      }
      if (ev.key === 'End') {
        ev.preventDefault();
        const idx = (items || [])
          .slice()
          .reverse()
          .findIndex((it) => !it.disabled && !it.separator);
        if (idx >= 0) setFocusIndex((items || []).length - 1 - idx);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, keyboardNavigation, items, focusIndex, onSelect, entity, closeMenu]);

  /* set focus to focused item when focusIndex changes */
  useEffect(() => {
    if (!open || focusIndex < 0 || !items) return;
    requestAnimationFrame(() => {
      const btn = itemsRefs.current[focusIndex];
      btn?.focus();
    });
  }, [focusIndex, open, items]);

  /* Global activators: contextmenu / click / hover / longpress handlers */
  useEffect(() => {
    if (disabled) return;
    const canvas = document; // fallback: whole document - consumer may pass viewer for finer control

    /* Helper to compute client x/y from pointer events */
    const coordFromEvent = (ev: Event) => {
      if ((ev as MouseEvent).clientX !== undefined) {
        const me = ev as MouseEvent;
        return { x: me.clientX, y: me.clientY };
      }
      if ((ev as TouchEvent).touches && (ev as TouchEvent).touches.length > 0) {
        const t = (ev as TouchEvent).touches[0];
        return { x: t.clientX, y: t.clientY };
      }
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    };

    /* Right click */
    const onContextMenu = (ev: MouseEvent) => {
      if (openOn !== 'rightClick') return;
      ev.preventDefault();
      // If entity provided and viewer present, optionally validate pick? Consumer can pass viewer for this
      const { x: cx, y: cy } = coordFromEvent(ev);
      void openMenuAt(cx, cy, ev);
    };

    /* Left click */
    const onLeftClick = (ev: MouseEvent) => {
      if (openOn !== 'leftClick') return;
      // left button only
      if (ev.button !== 0) return;
      const { x: cx, y: cy } = coordFromEvent(ev);
      void openMenuAt(cx, cy, ev);
    };

    /* Hover open: on mousemove - open after delay if pointer stays within small threshold.
       Implemented as simple debounce: open if moved less than 5px within hoverDelay */
    let lastMove = { x: 0, y: 0 };
    const onMouseMove = (ev: MouseEvent) => {
      if (openOn !== 'hover') return;
      const { x: cx, y: cy } = coordFromEvent(ev);
      const dx = Math.abs(cx - lastMove.x);
      const dy = Math.abs(cy - lastMove.y);
      lastMove = { x: cx, y: cy };
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      hoverTimerRef.current = window.setTimeout(() => {
        // only open if pointer didn't move much
        if (dx + dy < 8) {
          void openMenuAt(cx, cy, ev);
        }
      }, hoverDelay);
    };

    /* Long press for touch devices */
    const onTouchStart = (ev: TouchEvent) => {
      if (openOn !== 'longPress') return;
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      const { x: cx, y: cy } = coordFromEvent(ev);
      longPressTimerRef.current = window.setTimeout(() => {
        void openMenuAt(cx, cy, ev);
      }, longPressDuration);
    };
    const onTouchEnd = () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('click', onLeftClick);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('click', onLeftClick);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, [openOn, openMenuAt, hoverDelay, longPressDuration, disabled]);

  /* ensure only one Menü global offen: simple global event-based approach */
  useEffect(() => {
    const onAnyOpen = (e: Event) => {
      // wenn ein anderes Menü geöffnet wurde, schließe dieses
      if (!open) return;
      const detail = (e as CustomEvent).detail;
      if (detail === 'ResiumEntityContextMenu_opened') {
        closeMenu();
      }
    };
    document.addEventListener('ResiumEntityContextMenu_open', onAnyOpen as EventListener);
    return () =>
      document.removeEventListener('ResiumEntityContextMenu_open', onAnyOpen as EventListener);
  }, [open, closeMenu]);

  /* dispatch when we open to notify other instances */
  useEffect(() => {
    if (!open) return;
    const ev = new CustomEvent('ResiumEntityContextMenu_open', {
      detail: 'ResiumEntityContextMenu_opened',
    });
    document.dispatchEvent(ev);
  }, [open]);

  /* render menu contents */
  const inner = (
    <div
      ref={menuRef}
      role="menu"
      aria-hidden={!open}
      className={`resium-entity-contextmenu ${className || ''}`}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex,
        minWidth: 160,
        padding: 6,
        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
        background: 'white',
        borderRadius: 6,
        outline: 'none',
        ...style,
        display: open ? 'block' : 'none',
      }}
    >
      {loading && (
        <div role="status" aria-live="polite" style={{ padding: '8px 12px' }}>
          Laden...
        </div>
      )}
      {error && <div style={{ padding: '8px 12px', color: 'red' }}>{error}</div>}
      {!loading && !error && items && items.length === 0 && (
        <div style={{ padding: '8px 12px', color: '#666' }}>Keine Aktionen</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(items || []).map((it, idx) => {
          if (it.separator) {
            return (
              <div key={`sep-${idx}`} style={{ height: 1, background: '#eee', margin: '6px 0' }} />
            );
          }
          const disabledIt = !!it.disabled;
          const rendered = renderMenuItem ? (
            renderMenuItem(it)
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {it.icon && <span aria-hidden>{it.icon}</span>}
              <span>{it.label}</span>
            </div>
          );
          return (
            <button
              key={it.id}
              ref={(el) => (itemsRefs.current[idx] = el)}
              role="menuitem"
              aria-disabled={disabledIt}
              disabled={disabledIt}
              tabIndex={-1}
              onClick={async (e) => {
                e.stopPropagation();
                if (disabledIt) return;
                try {
                  await onSelect?.(it, entity);
                } catch {
                  // swallow - caller handles errors
                } finally {
                  closeMenu();
                }
              }}
              onMouseEnter={() => {
                setFocusIndex(idx);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                background: focusIndex === idx ? '#f0f0f0' : 'transparent',
                borderRadius: 4,
                cursor: disabledIt ? 'not-allowed' : 'pointer',
              }}
            >
              {rendered}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!portal) return inner;
  // portal: fallback if document not available
  if (typeof document === 'undefined') return inner;
  return ReactDOM.createPortal(inner, document.body);
}
