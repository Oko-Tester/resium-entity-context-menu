import { useRef, useState, useEffect, useCallback } from 'react';
import { useEntityContextMenu } from '../hooks/useEntityContextMenu';

export const ResiumEntityContextMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Calculate position with viewport clamping
  useEffect(() => {
    if (!isVisible || !context) return;

    const menuEl = menuRef.current;
    if (!menuEl) {
      setMenuPosition({ x: context.position.x, y: context.position.y });
      return;
    }

    // Use RAF to ensure DOM is ready
    requestAnimationFrame(() => {
      const rect = menuEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = context.position.x;
      let y = context.position.y;

      // Flip horizontally if needed
      if (x + rect.width > viewportWidth - 10) {
        x = Math.max(10, x - rect.width);
      }

      // Flip vertically if needed
      if (y + rect.height > viewportHeight - 10) {
        y = Math.max(10, y - rect.height);
      }

      setMenuPosition({ x, y });
    });
  }, [isVisible, context, menuItems]);

  // Handle click outside
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, hideMenu]);

  // Focus management
  useEffect(() => {
    if (isVisible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isVisible]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuItems || menuItems.length === 0) return;

      const visibleItems = menuItems.filter(
        (item) => item.type !== 'separator' && (!item.visible || item.visible(context!)),
      );

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
          const focusedItem = visibleItems[focusedIndex];
          if (
            focusedItem &&
            focusedItem.enabled !== false &&
            (!focusedItem.enabled || focusedItem.enabled(context!))
          ) {
            if (focusedItem.type === 'submenu' && focusedItem.items) {
              setOpenSubmenu(focusedItem.id);
            } else if (focusedItem.onClick) {
              focusedItem.onClick(context!);
              hideMenu();
            }
          }
          break;
        case 'ArrowRight':
          const item = visibleItems[focusedIndex];
          if (item?.type === 'submenu' && item.items) {
            setOpenSubmenu(item.id);
          }
          break;
        case 'ArrowLeft':
          setOpenSubmenu(null);
          break;
      }
    },
    [menuItems, context, focusedIndex, hideMenu],
  );

  if (!isVisible) return null;

  const renderMenuItem = (item: MenuItem, index: number): React.ReactNode => {
    if (!context) return null;

    // Check visibility
    if (item.visible && !item.visible(context)) {
      return null;
    }

    // Check if enabled
    const isEnabled = item.enabled === undefined || item.enabled(context);
    const isFocused = index === focusedIndex;

    if (item.type === 'separator') {
      return <div key={item.id} className="h-px bg-gray-200 my-1" />;
    }

    if (item.type === 'custom' && item.render) {
      return <div key={item.id}>{item.render(context)}</div>;
    }

    const handleClick = async () => {
      if (!isEnabled) return;

      if (item.type === 'submenu' && item.items) {
        setOpenSubmenu(openSubmenu === item.id ? null : item.id);
      } else if (item.onClick) {
        await item.onClick(context);
        hideMenu();
      }
    };

    return (
      <div
        key={item.id}
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
        className={`
          px-3 py-2 cursor-pointer select-none relative
          ${isEnabled ? 'hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'}
          ${isFocused ? 'bg-blue-100' : ''}
          ${item.type === 'toggle' && item.checked ? 'pl-8' : ''}
        `}
        onClick={handleClick}
        onMouseEnter={() => setFocusedIndex(index)}
      >
        {item.type === 'toggle' && item.checked && <span className="absolute left-2">✓</span>}
        <span className="flex items-center justify-between">
          {item.label}
          {item.type === 'submenu' && <span className="ml-4">▶</span>}
        </span>

        {item.type === 'submenu' && openSubmenu === item.id && item.items && (
          <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[150px] z-50">
            {item.items.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
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
      className={`
        fixed bg-white border border-gray-200 rounded-lg shadow-lg
        min-w-[200px] max-w-[300px] z-[9999] outline-none
        ${className}
      `}
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="px-3 py-4 text-center text-gray-500">Loading menu...</div>
      ) : menuItems && menuItems.length > 0 ? (
        <div className="py-1">{menuItems.map((item, index) => renderMenuItem(item, index))}</div>
      ) : (
        <div className="px-3 py-4 text-center text-gray-500">No actions available</div>
      )}
    </div>
  );
};
