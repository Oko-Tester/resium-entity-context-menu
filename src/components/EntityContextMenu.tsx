import { useRef, useState, useEffect, useCallback } from 'react';
import { useEntityContextMenu } from '../hooks/useEntityContextMenu';
import { MenuItem } from '../types/index';
import '../components/EntityContextMenu.css';

export const EntityContextMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Clamp position to viewport
  useEffect(() => {
    if (!isVisible || !context) return;

    const menuEl = menuRef.current;
    if (!menuEl) {
      setMenuPosition({ x: context.position.x, y: context.position.y });
      return;
    }

    requestAnimationFrame(() => {
      const rect = menuEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = context.position.x;
      let y = context.position.y;

      if (x + rect.width > viewportWidth - 10) {
        x = Math.max(10, x - rect.width);
      }

      if (y + rect.height > viewportHeight - 10) {
        y = Math.max(10, y - rect.height);
      }

      setMenuPosition({ x, y });
    });
  }, [isVisible, context, menuItems]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, hideMenu]);

  // Focus menu container when opened
  useEffect(() => {
    if (isVisible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isVisible]);

  // Reset focus when menuItems change
  useEffect(() => {
    setFocusedIndex(0);
    setOpenSubmenu(null);
  }, [menuItems]);

  // Helper: safe enabled check (supports boolean | (ctx)=>boolean | undefined)
  const isItemEnabled = useCallback(
    (item: MenuItem) => {
      if (!item.enabled) return true; // undefined or falsy function typed as undefined
      if (typeof item.enabled === 'boolean') return item.enabled;
      // function
      return !!context && item.enabled(context);
    },
    [context],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuItems || menuItems.length === 0) return;

      const visibleItems = menuItems.filter(
        (item) => item.type !== 'separator' && (!item.visible || item.visible(context!)),
      );

      if (visibleItems.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % visibleItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
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
            setOpenSubmenu(item.id);
          }
          break;
        }
        case 'ArrowLeft':
          setOpenSubmenu(null);
          break;
      }
    },
    [menuItems, context, focusedIndex, hideMenu, isItemEnabled],
  );

  if (!isVisible) return null;

  const renderMenuItem = (item: MenuItem, index: number, parentId?: string): React.ReactNode => {
    if (!context) return null;

    // Check visibility
    if (item.visible && !item.visible(context)) {
      return null;
    }

    // Check if enabled
    const isEnabled = isItemEnabled(item);
    const isFocused = index === focusedIndex;

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
        onMouseEnter={() => setFocusedIndex(index)}
      >
        {item.type === 'toggle' && (item as any).checked && (
          <span className="ecm-checkmark">✓</span>
        )}

        <span className="ecm-item__label">{item.label}</span>

        {item.type === 'submenu' && <span className="ecm-item__submenu-indicator">▶</span>}

        {item.type === 'submenu' && openSubmenu === item.id && item.items && (
          <div className="ecm-submenu">
            {item.items.map((subItem, subIndex) => renderMenuItem(subItem, subIndex, item.id))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      className={`ecm-menu ${className}`}
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="ecm-loading">Loading menu...</div>
      ) : menuItems && menuItems.length > 0 ? (
        <div className="ecm-list">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </div>
      ) : (
        <div className="ecm-empty">No actions available</div>
      )}
    </div>
  );
};
