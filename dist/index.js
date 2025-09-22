"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  EntityContextMenu: () => EntityContextMenu,
  EntityContextMenuProvider: () => EntityContextMenuProvider,
  useEntityContextMenu: () => useEntityContextMenu
});
module.exports = __toCommonJS(index_exports);

// src/components/EntityContextMenu.tsx
var import_react3 = require("react");

// src/hooks/useEntityContextMenu.tsx
var import_react2 = require("react");

// src/contexts/ContextMenuProvider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var ContextMenuContext = (0, import_react.createContext)(null);
var EntityContextMenuProvider = ({
  children,
  defaultFactory,
  factoriesByType = {},
  onOpen,
  onClose,
  closeOnAction = true
}) => {
  const [isVisible, setIsVisible] = (0, import_react.useState)(false);
  const [context, setContext] = (0, import_react.useState)();
  const [menuItems, setMenuItems] = (0, import_react.useState)();
  const [isLoading, setIsLoading] = (0, import_react.useState)(false);
  const resolveFactory = (0, import_react.useCallback)(
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
  const showMenu = (0, import_react.useCallback)(
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
  const hideMenu = (0, import_react.useCallback)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContextMenuContext.Provider, { value, children });
};

// src/hooks/useEntityContextMenu.tsx
function useEntityContextMenu() {
  const context = (0, import_react2.useContext)(ContextMenuContext);
  if (!context) {
    throw new Error("useEntityContextMenu must be used within EntityContextMenuProvider");
  }
  return context;
}

// src/components/EntityContextMenu.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var EntityContextMenu = ({ className = "" }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = (0, import_react3.useRef)(null);
  const [focusedIndex, setFocusedIndex] = (0, import_react3.useState)(0);
  const [openSubmenu, setOpenSubmenu] = (0, import_react3.useState)(null);
  const [menuPosition, setMenuPosition] = (0, import_react3.useState)({ x: 0, y: 0 });
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
    if (isVisible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isVisible]);
  const handleKeyDown = (0, import_react3.useCallback)(
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
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "h-px bg-gray-200 my-1" }, item.id);
    }
    if (item.type === "custom" && item.render) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: item.render(context) }, item.id);
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
          item.type === "toggle" && item.checked && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "absolute left-2", children: "\u2713" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "flex items-center justify-between", children: [
            item.label,
            item.type === "submenu" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ml-4", children: "\u25B6" })
          ] }),
          item.type === "submenu" && openSubmenu === item.id && item.items && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[150px] z-50", children: item.items.map((subItem, subIndex) => renderMenuItem(subItem, subIndex)) })
        ]
      },
      item.id
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
      children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "px-3 py-4 text-center text-gray-500", children: "Loading menu..." }) : menuItems && menuItems.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "py-1", children: menuItems.map((item, index) => renderMenuItem(item, index)) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "px-3 py-4 text-center text-gray-500", children: "No actions available" })
    }
  );
};
//# sourceMappingURL=index.js.map