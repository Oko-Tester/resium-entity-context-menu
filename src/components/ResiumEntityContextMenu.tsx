import { Entity, Viewer } from 'cesium';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';

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
  entity?: Entity | string;
  getMenuItems: (entity?: Entity | string) => MenuItem[] | Promise<MenuItem[]>;
  renderMenuItem?: (item: MenuItem) => React.ReactNode;
  onSelect?: (item: MenuItem, entity?: Entity | string) => void | Promise<void>;
  openOn?: 'rightClick' | 'leftClick' | 'hover' | 'longPress';
  positionOffset?: PositionOffset;
  portal?: boolean;
  closeOnOutsideClick?: boolean;
  keyboardNavigation?: boolean;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  zIndex?: number;
  viewer?: Viewer | null;
  hoverDelay?: number;
  longPressDuration?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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
    className = '',
    style = {},
    disabled = false,
    zIndex = 3000,
    viewer = null,
    hoverDelay = 250,
    longPressDuration = 500,
  } = props;

  // State
  const [open, setOpen] = useState(false);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  // Refs
  const callIdRef = useRef(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemsRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hoverTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // ✅ setItemRef auf oberster Ebene definieren
  const setItemRef = useCallback((el: HTMLButtonElement | null, idx: number) => {
    itemsRefs.current[idx] = el;
  }, []);

  // Project entity to screen coordinates
  const projectEntityToScreen = useCallback(
    (entityRef?: Entity | string, viewerRef?: Viewer | null) => {
      try {
        if (!viewerRef || !entityRef) return null;

        const ent =
          typeof entityRef === 'string' ? viewerRef.entities?.getById(entityRef) : entityRef;

        if (!ent?.position) return null;

        const time = viewerRef.clock?.currentTime;
        const cartesian = ent.position.getValue(time);
        if (!cartesian) return null;

        // Use Cesium's SceneTransforms
        const windowCoord = (window as any).Cesium?.SceneTransforms?.wgs84ToWindowCoordinates(
          viewerRef.scene,
          cartesian,
        );

        return windowCoord ? { x: windowCoord.x, y: windowCoord.y } : null;
      } catch {
        return null;
      }
    },
    [],
  );

  // Load menu items with race condition protection
  const loadMenuItems = useCallback(
    async (entityArg?: Entity | string) => {
      const myCall = ++callIdRef.current;
      setLoading(true);
      setError(null);
      setItems(null);

      try {
        const res = await getMenuItems(entityArg);

        if (callIdRef.current === myCall) {
          setItems(res || []);
          setLoading(false);
          setError(null);

          const firstIndex = (res || []).findIndex((it) => !it.disabled && !it.separator);
          setFocusIndex(firstIndex >= 0 ? firstIndex : -1);
        }
      } catch (e) {
        if (callIdRef.current === myCall) {
          setItems(null);
          setLoading(false);
          setError('Fehler beim Laden der Menüeinträge');
        }
      }
    },
    [getMenuItems],
  );

  // Open menu at coordinates
  const openMenuAt = useCallback(
    async (clientX: number, clientY: number) => {
      if (disabled) return;

      // Try to project entity position if viewer and entity are available
      if (viewer && entity) {
        const proj = projectEntityToScreen(entity, viewer);
        if (proj) {
          clientX = proj.x;
          clientY = proj.y;
        }
      }

      setX(clientX + positionOffset.x);
      setY(clientY + positionOffset.y);
      setOpen(true);

      await loadMenuItems(entity);
    },
    [disabled, entity, loadMenuItems, positionOffset, projectEntityToScreen, viewer],
  );

  // Close menu
  const closeMenu = useCallback(() => {
    setOpen(false);
    setItems(null);
    setLoading(false);
    setError(null);
    setFocusIndex(-1);
    callIdRef.current++;
  }, []);

  const handleItemSelect = useCallback(
    async (item: MenuItem) => {
      try {
        await onSelect?.(item, entity);
      } catch (error) {
        console.error('Error selecting menu item:', error);
      } finally {
        closeMenu();
      }
    },
    [onSelect, entity, closeMenu],
  );

  // Click outside to close
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;

    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      closeMenu();
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, closeOnOutsideClick, closeMenu]);

  // Position clamping on resize
  useEffect(() => {
    if (!open) return;

    const onResize = () => {
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

  // Keyboard navigation
  useEffect(() => {
    if (!open || !keyboardNavigation || !items) return;

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeMenu();
        return;
      }

      const visibleItems = items.filter((it) => !it.disabled && !it.separator);
      if (visibleItems.length === 0) return;

      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        let next = focusIndex;
        for (let i = 1; i <= items.length; i++) {
          const idx = (focusIndex + i) % items.length;
          const it = items[idx];
          if (!it.disabled && !it.separator) {
            next = idx;
            break;
          }
        }
        setFocusIndex(next);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        let prev = focusIndex;
        for (let i = 1; i <= items.length; i++) {
          const idx = (focusIndex - i + items.length) % items.length;
          const it = items[idx];
          if (!it.disabled && !it.separator) {
            prev = idx;
            break;
          }
        }
        setFocusIndex(prev);
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        const it = items[focusIndex];
        if (it && !it.disabled && !it.separator) {
          handleItemSelect(it);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, keyboardNavigation, items, focusIndex, handleItemSelect]);

  // Focus management
  useEffect(() => {
    if (!open || focusIndex < 0 || !items) return;

    requestAnimationFrame(() => {
      itemsRefs.current[focusIndex]?.focus();
    });
  }, [focusIndex, open, items]);

  // Event handlers setup
  useEffect(() => {
    if (disabled) return;

    const getCoordinates = (ev: MouseEvent | TouchEvent) => {
      if ('clientX' in ev) {
        return { x: ev.clientX, y: ev.clientY };
      }
      if (ev.touches && ev.touches.length > 0) {
        return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
      }
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    };

    const onContextMenu = (ev: MouseEvent) => {
      if (openOn !== 'rightClick') return;
      ev.preventDefault();
      const coords = getCoordinates(ev);
      void openMenuAt(coords.x, coords.y);
    };

    const onLeftClick = (ev: MouseEvent) => {
      if (openOn !== 'leftClick' || ev.button !== 0) return;
      const coords = getCoordinates(ev);
      void openMenuAt(coords.x, coords.y);
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (openOn !== 'hover') return;

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }

      const coords = getCoordinates(ev);
      hoverTimerRef.current = window.setTimeout(() => {
        void openMenuAt(coords.x, coords.y);
      }, hoverDelay);
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (openOn !== 'longPress') return;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      const coords = getCoordinates(ev);
      longPressTimerRef.current = window.setTimeout(() => {
        void openMenuAt(coords.x, coords.y);
      }, longPressDuration);
    };

    const onTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('click', onLeftClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('click', onLeftClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);

      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, [openOn, openMenuAt, hoverDelay, longPressDuration, disabled]);

  if (!open) return null;

  const menuContent = (
    <div
      ref={menuRef}
      role="menu"
      className={`resium-entity-contextmenu ${className}`}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex,
        minWidth: 160,
        padding: 8,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        outline: 'none',
        ...style,
      }}
    >
      {loading && <div style={{ padding: '8px 12px', color: '#666' }}>Laden...</div>}

      {error && <div style={{ padding: '8px 12px', color: '#d32f2f' }}>{error}</div>}

      {!loading && !error && items && items.length === 0 && (
        <div style={{ padding: '8px 12px', color: '#666' }}>Keine Aktionen verfügbar</div>
      )}

      {!loading && !error && items && items.length > 0 && (
        <div>
          {items.map((item, idx) => {
            if (item.separator) {
              return (
                <div
                  key={`separator-${idx}`}
                  style={{
                    height: 1,
                    backgroundColor: '#eee',
                    margin: '4px 0',
                  }}
                />
              );
            }

            const isDisabled = !!item.disabled;
            const isFocused = focusIndex === idx;

            return (
              <button
                key={item.id}
                ref={(el) => setItemRef(el, idx)}
                role="menuitem"
                disabled={isDisabled}
                tabIndex={-1}
                onClick={() => !isDisabled && handleItemSelect(item)}
                onMouseEnter={() => setFocusIndex(idx)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: isFocused ? '#f5f5f5' : 'transparent',
                  textAlign: 'left',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  borderRadius: 4,
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                {renderMenuItem ? (
                  renderMenuItem(item)
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return portal ? ReactDOM.createPortal(menuContent, document.body) : menuContent;
}
