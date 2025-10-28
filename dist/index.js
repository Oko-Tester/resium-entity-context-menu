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
  onClose
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
var import_resium = require("resium");
var import_cesium = require("cesium");
var import_jsx_runtime2 = require("react/jsx-runtime");
var EntityContextMenu = ({ className = "" }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = (0, import_react3.useRef)(null);
  const [focusedIndex, setFocusedIndex] = (0, import_react3.useState)(0);
  const [openSubmenu, setOpenSubmenu] = (0, import_react3.useState)(null);
  const [submenuFocusedIndex, setSubmenuFocusedIndex] = (0, import_react3.useState)(null);
  const [menuPosition, setMenuPosition] = (0, import_react3.useState)({ x: 0, y: 0 });
  const [positionCalculated, setPositionCalculated] = (0, import_react3.useState)(false);
  const { viewer } = (0, import_resium.useCesium)();
  (0, import_react3.useEffect)(() => {
    if (!viewer) return;
    const handler = new import_cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => {
      if (isVisible) hideMenu();
    }, import_cesium.ScreenSpaceEventType.RIGHT_DOWN);
    handler.setInputAction(() => {
      if (isVisible) hideMenu();
    }, import_cesium.ScreenSpaceEventType.LEFT_DOWN);
    const canvas = viewer.scene.canvas;
    const prevent = (e) => e.preventDefault();
    canvas.addEventListener("contextmenu", prevent);
    return () => {
      handler.destroy();
      canvas.removeEventListener("contextmenu", prevent);
    };
  }, [viewer?.scene.canvas, isVisible, hideMenu]);
  const computeMenuPosition = (ctx, menuEl) => {
    if (!ctx || !viewer) return { x: 0, y: 0 };
    let canvasX = ctx.position?.x ?? 0;
    let canvasY = ctx.position?.y ?? 0;
    const canvas = viewer.scene.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    let x = canvasRect.left + canvasX;
    let y = canvasRect.top + canvasY;
    if (menuEl) {
      const rect = menuEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (x + rect.width > viewportWidth - 10) {
        x = Math.max(10, x - rect.width);
      }
      if (y + rect.height > viewportHeight - 10) {
        y = Math.max(10, y - rect.height);
      }
    }
    return { x, y };
  };
  (0, import_react3.useLayoutEffect)(() => {
    if (!isVisible || !context) {
      setPositionCalculated(false);
      return;
    }
    const menuEl = menuRef.current;
    const pos = computeMenuPosition(context, menuEl);
    setMenuPosition(pos);
    setPositionCalculated(true);
  }, [isVisible, context, menuItems, viewer]);
  (0, import_react3.useEffect)(() => {
    if (!isVisible) return;
    const handleOutsideInteraction = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideMenu();
      }
    };
    const handleScroll = () => hideMenu();
    const handleEscape = (evt) => {
      if (evt.key === "Escape") hideMenu();
    };
    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("click", handleOutsideInteraction);
    document.addEventListener("scroll", handleScroll, true);
    document.addEventListener("wheel", handleScroll, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("click", handleOutsideInteraction);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("wheel", handleScroll, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, hideMenu]);
  (0, import_react3.useEffect)(() => {
    if (isVisible && positionCalculated && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isVisible, positionCalculated]);
  (0, import_react3.useEffect)(() => {
    setFocusedIndex(0);
    setOpenSubmenu(null);
    setSubmenuFocusedIndex(null);
  }, [menuItems]);
  const isItemEnabled = (0, import_react3.useCallback)(
    (item) => {
      if (!item.enabled) return true;
      if (typeof item.enabled === "boolean") return item.enabled;
      return !!context && item.enabled(context);
    },
    [context]
  );
  const handleKeyDown = (0, import_react3.useCallback)(
    (e) => {
      if (!menuItems || menuItems.length === 0) return;
      const visibleItems = menuItems.filter(
        (item) => item.type !== "separator" && (!item.visible || item.visible(context))
      );
      if (visibleItems.length === 0) return;
      if (submenuFocusedIndex !== null && openSubmenu) {
        const currentItem = visibleItems[focusedIndex];
        if (currentItem?.type === "submenu" && currentItem.items) {
          const visibleSubmenuItems = currentItem.items.filter(
            (item) => item.type !== "separator" && (!item.visible || item.visible(context))
          );
          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              setSubmenuFocusedIndex(
                (prev) => prev === null ? 0 : (prev + 1) % visibleSubmenuItems.length
              );
              break;
            case "ArrowUp":
              e.preventDefault();
              setSubmenuFocusedIndex(
                (prev) => prev === null ? 0 : (prev - 1 + visibleSubmenuItems.length) % visibleSubmenuItems.length
              );
              break;
            case "Enter":
            case " ":
              e.preventDefault();
              {
                const focusedSubItem = visibleSubmenuItems[submenuFocusedIndex];
                if (!focusedSubItem) break;
                const enabled = isItemEnabled(focusedSubItem);
                if (!enabled) break;
                if (focusedSubItem.onClick) {
                  const res = focusedSubItem.onClick(context);
                  if (res instanceof Promise) {
                    res.finally(() => hideMenu());
                  } else {
                    hideMenu();
                  }
                }
              }
              break;
            case "ArrowLeft":
              e.preventDefault();
              setSubmenuFocusedIndex(null);
              break;
            case "Escape":
              e.preventDefault();
              setOpenSubmenu(null);
              setSubmenuFocusedIndex(null);
              break;
          }
          return;
        }
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % visibleItems.length);
          setSubmenuFocusedIndex(null);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
          setSubmenuFocusedIndex(null);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          {
            const focusedItem = visibleItems[focusedIndex];
            if (!focusedItem) break;
            const enabled = isItemEnabled(focusedItem);
            if (!enabled) break;
            if (focusedItem.type === "submenu" && focusedItem.items) {
              setOpenSubmenu(focusedItem.id);
              setSubmenuFocusedIndex(0);
            } else if (focusedItem.onClick) {
              const res = focusedItem.onClick(context);
              if (res instanceof Promise) {
                res.finally(() => hideMenu());
              } else {
                hideMenu();
              }
            }
          }
          break;
        case "ArrowRight": {
          const item = visibleItems[focusedIndex];
          if (item?.type === "submenu" && item.items) {
            e.preventDefault();
            setOpenSubmenu(item.id);
            setSubmenuFocusedIndex(0);
          }
          break;
        }
        case "ArrowLeft":
          e.preventDefault();
          setOpenSubmenu(null);
          setSubmenuFocusedIndex(null);
          break;
      }
    },
    [menuItems, context, focusedIndex, submenuFocusedIndex, openSubmenu, hideMenu, isItemEnabled]
  );
  if (!isVisible) return null;
  const renderMenuItem = (item, index, parentId, visibleItemIndex, isSubmenuItem) => {
    if (!context) return null;
    if (item.visible && !item.visible(context)) {
      return null;
    }
    const isEnabled = isItemEnabled(item);
    const isFocused = isSubmenuItem ? submenuFocusedIndex === visibleItemIndex : visibleItemIndex !== void 0 && visibleItemIndex === focusedIndex;
    if (item.type === "separator") {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ecm-separator" }, item.id ?? `sep-${index}`);
    }
    if (item.type === "custom" && item.render) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ecm-custom", children: item.render(context) }, item.id ?? `custom-${index}`);
    }
    const handleClick = async () => {
      if (!isEnabled) return;
      if (item.type === "submenu" && item.items) {
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        role: "menuitem",
        tabIndex: isFocused ? 0 : -1,
        onContextMenu: (e) => e.preventDefault(),
        className: [
          "ecm-item",
          isEnabled ? "ecm-item--enabled" : "ecm-item--disabled",
          isFocused ? "ecm-item--focused" : "",
          item.type === "toggle" ? "ecm-item--toggle" : "",
          item.type === "submenu" ? "ecm-item--submenu" : ""
        ].join(" ").trim(),
        onClick: handleClick,
        onMouseEnter: () => {
          if (isSubmenuItem && visibleItemIndex !== void 0) {
            setSubmenuFocusedIndex(visibleItemIndex);
          } else if (visibleItemIndex !== void 0) {
            setFocusedIndex(visibleItemIndex);
            setSubmenuFocusedIndex(null);
          }
        },
        children: [
          item.type === "toggle" && item.checked && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ecm-checkmark", children: "\u2713" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ecm-item__label", children: item.label }),
          item.type === "submenu" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ecm-item__submenu-indicator", children: "\u25B6" }),
          item.type === "submenu" && openSubmenu === item.id && item.items && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ecm-submenu", children: (() => {
            let submenuVisibleIndex = 0;
            return item.items.map((subItem, subIndex) => {
              const shouldRender = !subItem.visible || subItem.visible(context);
              const isActuallyVisible = shouldRender && subItem.type !== "separator";
              const currentSubmenuIndex = isActuallyVisible ? submenuVisibleIndex : void 0;
              if (isActuallyVisible) {
                submenuVisibleIndex++;
              }
              return renderMenuItem(subItem, subIndex, item.id, currentSubmenuIndex, true);
            });
          })() })
        ]
      },
      itemKey
    );
  };
  if (!isVisible) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      ref: menuRef,
      role: "menu",
      tabIndex: -1,
      onContextMenu: (e) => e.preventDefault(),
      className: `ecm-menu ${className}`,
      style: {
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        visibility: positionCalculated ? "visible" : "hidden",
        opacity: positionCalculated ? 1 : 0,
        transition: "opacity 0.1s ease-in-out"
      },
      onKeyDown: handleKeyDown,
      children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ecm-loading", children: "Loading menu..." }) : menuItems && menuItems.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ecm-list", children: (() => {
        let visibleItemIndex = 0;
        return menuItems.map((item, index) => {
          const shouldRender = !item.visible || item.visible(context);
          const isActuallyVisible = shouldRender && item.type !== "separator";
          const currentVisibleIndex = isActuallyVisible ? visibleItemIndex : void 0;
          if (isActuallyVisible) {
            visibleItemIndex++;
          }
          return renderMenuItem(item, index, void 0, currentVisibleIndex);
        });
      })() }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ecm-empty", children: "No actions available" })
    }
  );
};
//# sourceMappingURL=index.js.map