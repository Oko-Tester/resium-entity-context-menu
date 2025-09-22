// src/components/EntityContextMenu.tsx
import { useRef, useState as useState2, useEffect, useCallback as useCallback2 } from "react";

// src/hooks/useEntityContextMenu.tsx
import { useContext } from "react";

// src/contexts/ContextMenuProvider.tsx
import { createContext, useState, useCallback } from "react";
import { jsx } from "react/jsx-runtime";
var ContextMenuContext = createContext(null);
var EntityContextMenuProvider = ({
  children,
  defaultFactory,
  factoriesByType = {},
  onOpen,
  onClose,
  closeOnAction = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [context, setContext] = useState();
  const [menuItems, setMenuItems] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const resolveFactory = useCallback(
    (ctx) => {
      if (ctx.entityData?.menuFactory && typeof ctx.entityData.menuFactory === "function") {
        return ctx.entityData.menuFactory;
      }
      if (ctx.entityType && factoriesByType[ctx.entityType]) {
        return factoriesByType[ctx.entityType];
      }
      return defaultFactory;
    },
    [defaultFactory, factoriesByType]
  );
  const showMenu = useCallback(
    async (ctx) => {
      setContext(ctx);
      setIsVisible(true);
      setIsLoading(true);
      setMenuItems(void 0);
      onOpen?.(ctx);
      try {
        const factory = resolveFactory(ctx);
        const items = await factory(ctx);
        setMenuItems(items);
      } catch (error) {
        console.error("Failed to resolve menu items:", error);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [resolveFactory, onOpen]
  );
  const hideMenu = useCallback(() => {
    setIsVisible(false);
    setContext(void 0);
    setMenuItems(void 0);
    setIsLoading(false);
    onClose?.();
  }, [onClose]);
  const value = {
    isVisible,
    context,
    menuItems,
    isLoading,
    showMenu,
    hideMenu
  };
  return /* @__PURE__ */ jsx(ContextMenuContext.Provider, { value, children });
};

// src/hooks/useEntityContextMenu.tsx
function useEntityContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useEntityContextMenu must be used within EntityContextMenuProvider");
  }
  return context;
}

// src/components/EntityContextMenu.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var EntityContextMenu = ({ className = "" }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState2(0);
  const [openSubmenu, setOpenSubmenu] = useState2(null);
  const [menuPosition, setMenuPosition] = useState2({ x: 0, y: 0 });
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
  useEffect(() => {
    if (!isVisible) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideMenu();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        hideMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, hideMenu]);
  useEffect(() => {
    if (isVisible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isVisible]);
  const handleKeyDown = useCallback2(
    (e) => {
      if (!menuItems || menuItems.length === 0) return;
      const visibleItems = menuItems.filter(
        (item) => item.type !== "separator" && (!item.visible || item.visible(context))
      );
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % visibleItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          const focusedItem = visibleItems[focusedIndex];
          if (focusedItem && focusedItem.enabled && focusedItem.enabled(context) !== false && (!focusedItem.enabled || focusedItem.enabled(context))) {
            if (focusedItem.type === "submenu" && focusedItem.items) {
              setOpenSubmenu(focusedItem.id);
            } else if (focusedItem.onClick) {
              focusedItem.onClick(context);
              hideMenu();
            }
          }
          break;
        case "ArrowRight":
          const item = visibleItems[focusedIndex];
          if (item?.type === "submenu" && item.items) {
            setOpenSubmenu(item.id);
          }
          break;
        case "ArrowLeft":
          setOpenSubmenu(null);
          break;
      }
    },
    [menuItems, context, focusedIndex, hideMenu]
  );
  if (!isVisible) return null;
  const renderMenuItem = (item, index) => {
    if (!context) return null;
    if (item.visible && !item.visible(context)) {
      return null;
    }
    const isEnabled = item.enabled === void 0 || item.enabled(context);
    const isFocused = index === focusedIndex;
    if (item.type === "separator") {
      return /* @__PURE__ */ jsx2("div", { className: "h-px bg-gray-200 my-1" }, item.id);
    }
    if (item.type === "custom" && item.render) {
      return /* @__PURE__ */ jsx2("div", { children: item.render(context) }, item.id);
    }
    const handleClick = async () => {
      if (!isEnabled) return;
      if (item.type === "submenu" && item.items) {
        setOpenSubmenu(openSubmenu === item.id ? null : item.id);
      } else if (item.onClick) {
        await item.onClick(context);
        hideMenu();
      }
    };
    return /* @__PURE__ */ jsxs(
      "div",
      {
        role: "menuitem",
        tabIndex: isFocused ? 0 : -1,
        className: `
          px-3 py-2 cursor-pointer select-none relative
          ${isEnabled ? "hover:bg-blue-50" : "opacity-50 cursor-not-allowed"}
          ${isFocused ? "bg-blue-100" : ""}
          ${item.type === "toggle" && item.checked ? "pl-8" : ""}
        `,
        onClick: handleClick,
        onMouseEnter: () => setFocusedIndex(index),
        children: [
          item.type === "toggle" && item.checked && /* @__PURE__ */ jsx2("span", { className: "absolute left-2", children: "\u2713" }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-between", children: [
            item.label,
            item.type === "submenu" && /* @__PURE__ */ jsx2("span", { className: "ml-4", children: "\u25B6" })
          ] }),
          item.type === "submenu" && openSubmenu === item.id && item.items && /* @__PURE__ */ jsx2("div", { className: "absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[150px] z-50", children: item.items.map((subItem, subIndex) => renderMenuItem(subItem, subIndex)) })
        ]
      },
      item.id
    );
  };
  return /* @__PURE__ */ jsx2(
    "div",
    {
      ref: menuRef,
      role: "menu",
      tabIndex: -1,
      className: `
        fixed bg-white border border-gray-200 rounded-lg shadow-lg
        min-w-[200px] max-w-[300px] z-[9999] outline-none
        ${className}
      `,
      style: {
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`
      },
      onKeyDown: handleKeyDown,
      children: isLoading ? /* @__PURE__ */ jsx2("div", { className: "px-3 py-4 text-center text-gray-500", children: "Loading menu..." }) : menuItems && menuItems.length > 0 ? /* @__PURE__ */ jsx2("div", { className: "py-1", children: menuItems.map((item, index) => renderMenuItem(item, index)) }) : /* @__PURE__ */ jsx2("div", { className: "px-3 py-4 text-center text-gray-500", children: "No actions available" })
    }
  );
};
export {
  EntityContextMenu,
  EntityContextMenuProvider,
  useEntityContextMenu
};
//# sourceMappingURL=index.mjs.map