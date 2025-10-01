import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useEntityContextMenu } from '../hooks/useEntityContextMenu';
import { MenuItem } from '../types/index';
import '../components/EntityContextMenu.css';
import { useCesium } from 'resium';
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium';

export const EntityContextMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuFocusedIndex, setSubmenuFocusedIndex] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [positionCalculated, setPositionCalculated] = useState(false);
  const { viewer } = useCesium();

  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(() => {
      if (isVisible) hideMenu();
    }, ScreenSpaceEventType.RIGHT_DOWN);

    handler.setInputAction(() => {
      if (isVisible) hideMenu();
    }, ScreenSpaceEventType.LEFT_DOWN);

    const canvas = viewer.scene.canvas;
    const prevent = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', prevent);

    return () => {
      handler.destroy();
      canvas.removeEventListener('contextmenu', prevent);
    };
  }, [viewer?.scene.canvas, isVisible, hideMenu]);

  const computeMenuPosition = (ctx: typeof context, menuEl: HTMLDivElement | null) => {
    if (!ctx) return { x: 0, y: 0 };

    let x = ctx.position?.x ?? 0;
    let y = ctx.position?.y ?? 0;

    if (!menuEl) {
      return { x, y };
    }

    const rect = menuEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + rect.width > viewportWidth - 10) {
      x = Math.max(10, x - rect.width);
    }
    if (y + rect.height > viewportHeight - 10) {
      y = Math.max(10, y - rect.height);
    }

    return { x, y };
  };

  useLayoutEffect(() => {
    if (!isVisible || !context) {
      setPositionCalculated(false);
      return;
    }

    const menuEl = menuRef.current;
    const pos = computeMenuPosition(context, menuEl);
    setMenuPosition(pos);
    setPositionCalculated(true);
  }, [isVisible, context, menuItems]);

  useEffect(() => {
    if (!isVisible) return;

    const handleOutsideInteraction = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };
    const handleScroll = () => hideMenu();
    const handleEscape = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') hideMenu();
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('click', handleOutsideInteraction);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('wheel', handleScroll, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('click', handleOutsideInteraction);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('wheel', handleScroll, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, hideMenu]);

  useEffect(() => {
    if (isVisible && positionCalculated && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isVisible, positionCalculated]);

  useEffect(() => {
    setFocusedIndex(0);
    setOpenSubmenu(null);
    setSubmenuFocusedIndex(null);
  }, [menuItems]);

  const isItemEnabled = useCallback(
    (item: MenuItem) => {
      if (!item.enabled) return true;
      if (typeof item.enabled === 'boolean') return item.enabled;
      return !!context && item.enabled(context);
    },
    [context],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuItems || menuItems.length === 0) return;

      const visibleItems = menuItems.filter(
        (item) => item.type !== 'separator' && (!item.visible || item.visible(context!)),
      );

      if (visibleItems.length === 0) return;

      if (submenuFocusedIndex !== null && openSubmenu) {
        const currentItem = visibleItems[focusedIndex];
        if (currentItem?.type === 'submenu' && currentItem.items) {
          const visibleSubmenuItems = currentItem.items.filter(
            (item) => item.type !== 'separator' && (!item.visible || item.visible(context!)),
          );

          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              setSubmenuFocusedIndex((prev) =>
                prev === null ? 0 : (prev + 1) % visibleSubmenuItems.length,
              );
              break;
            case 'ArrowUp':
              e.preventDefault();
              setSubmenuFocusedIndex((prev) =>
                prev === null
                  ? 0
                  : (prev - 1 + visibleSubmenuItems.length) % visibleSubmenuItems.length,
              );
              break;
            case 'Enter':
            case ' ':
              e.preventDefault();
              {
                const focusedSubItem = visibleSubmenuItems[submenuFocusedIndex];
                if (!focusedSubItem) break;

                const enabled = isItemEnabled(focusedSubItem);
                if (!enabled) break;

                if (focusedSubItem.onClick) {
                  const res = focusedSubItem.onClick(context!);
                  if (res instanceof Promise) {
                    res.finally(() => hideMenu());
                  } else {
                    hideMenu();
                  }
                }
              }
              break;
            case 'ArrowLeft':
              e.preventDefault();
              setSubmenuFocusedIndex(null);
              break;
            case 'Escape':
              e.preventDefault();
              setOpenSubmenu(null);
              setSubmenuFocusedIndex(null);
              break;
          }
          return;
        }
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % visibleItems.length);
          setSubmenuFocusedIndex(null);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
          setSubmenuFocusedIndex(null);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          {
            const focusedItem = visibleItems[focusedIndex];
            if (!focusedItem) break;

            const enabled = isItemEnabled(focusedItem);
            if (!enabled) break;

            if (focusedItem.type === 'submenu' && focusedItem.items) {
              setOpenSubmenu(focusedItem.id);
              setSubmenuFocusedIndex(0);
            } else if (focusedItem.onClick) {
              const res = focusedItem.onClick(context!);
              if (res instanceof Promise) {
                res.finally(() => hideMenu());
              } else {
                hideMenu();
              }
            }
          }
          break;
        case 'ArrowRight': {
          const item = visibleItems[focusedIndex];
          if (item?.type === 'submenu' && item.items) {
            e.preventDefault();
            setOpenSubmenu(item.id);
            setSubmenuFocusedIndex(0);
          }
          break;
        }
        case 'ArrowLeft':
          e.preventDefault();
          setOpenSubmenu(null);
          setSubmenuFocusedIndex(null);
          break;
      }
    },
    [menuItems, context, focusedIndex, submenuFocusedIndex, openSubmenu, hideMenu, isItemEnabled],
  );

  if (!isVisible) return null;

  const renderMenuItem = (
    item: MenuItem,
    index: number,
    parentId?: string,
    visibleItemIndex?: number,
    isSubmenuItem?: boolean,
  ): React.ReactNode => {
    if (!context) return null;

    if (item.visible && !item.visible(context)) {
      return null;
    }

    const isEnabled = isItemEnabled(item);
    const isFocused = isSubmenuItem
      ? submenuFocusedIndex === visibleItemIndex
      : visibleItemIndex !== undefined && visibleItemIndex === focusedIndex;

    if (item.type === 'separator') {
      return <div key={item.id ?? `sep-${index}`} className="ecm-separator" />;
    }

    if (item.type === 'custom' && item.render) {
      return (
        <div key={item.id ?? `custom-${index}`} className="ecm-custom">
          {item.render(context)}
        </div>
      );
    }

    const handleClick = async () => {
      if (!isEnabled) return;

      if (item.type === 'submenu' && item.items) {
        setOpenSubmenu(openSubmenu === item.id ? null : item.id);
      } else if (item.onClick) {
        try {
          const res = item.onClick(context);
          if (res instanceof Promise) await res;
        } finally {
          hideMenu();
        }
      }
    };

    const itemKey = parentId ? `${parentId}__${item.id ?? index}` : `${item.id ?? index}`;

    return (
      <div
        key={itemKey}
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
        onContextMenu={(e) => e.preventDefault()}
        className={[
          'ecm-item',
          isEnabled ? 'ecm-item--enabled' : 'ecm-item--disabled',
          isFocused ? 'ecm-item--focused' : '',
          item.type === 'toggle' ? 'ecm-item--toggle' : '',
          item.type === 'submenu' ? 'ecm-item--submenu' : '',
        ]
          .join(' ')
          .trim()}
        onClick={handleClick}
        onMouseEnter={() => {
          if (isSubmenuItem && visibleItemIndex !== undefined) {
            setSubmenuFocusedIndex(visibleItemIndex);
          } else if (visibleItemIndex !== undefined) {
            setFocusedIndex(visibleItemIndex);
            setSubmenuFocusedIndex(null);
          }
        }}
      >
        {item.type === 'toggle' && (item as any).checked && (
          <span className="ecm-checkmark">✓</span>
        )}

        <span className="ecm-item__label">{item.label}</span>

        {item.type === 'submenu' && <span className="ecm-item__submenu-indicator">▶</span>}

        {item.type === 'submenu' && openSubmenu === item.id && item.items && (
          <div className="ecm-submenu">
            {(() => {
              let submenuVisibleIndex = 0;
              return item.items.map((subItem, subIndex) => {
                const shouldRender = !subItem.visible || subItem.visible(context!);
                const isActuallyVisible = shouldRender && subItem.type !== 'separator';
                const currentSubmenuIndex = isActuallyVisible ? submenuVisibleIndex : undefined;

                if (isActuallyVisible) {
                  submenuVisibleIndex++;
                }

                return renderMenuItem(subItem, subIndex, item.id, currentSubmenuIndex, true);
              });
            })()}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;
  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      className={`ecm-menu ${className}`}
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        visibility: positionCalculated ? 'visible' : 'hidden',
        opacity: positionCalculated ? 1 : 0,
        transition: 'opacity 0.1s ease-in-out',
      }}
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="ecm-loading">Loading menu...</div>
      ) : menuItems && menuItems.length > 0 ? (
        <div className="ecm-list">
          {(() => {
            let visibleItemIndex = 0;
            return menuItems.map((item, index) => {
              const shouldRender = !item.visible || item.visible(context!);
              const isActuallyVisible = shouldRender && item.type !== 'separator';
              const currentVisibleIndex = isActuallyVisible ? visibleItemIndex : undefined;

              if (isActuallyVisible) {
                visibleItemIndex++;
              }

              return renderMenuItem(item, index, undefined, currentVisibleIndex);
            });
          })()}
        </div>
      ) : (
        <div className="ecm-empty">No actions available</div>
      )}
    </div>
  );
};
