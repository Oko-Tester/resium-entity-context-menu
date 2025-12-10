// src/components/EntityContextMenu.tsx
import { useRef, useState as useState2, useEffect, useCallback as useCallback2, useLayoutEffect } from "react";

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
  onClose
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
import { useCesium } from "resium";
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var EntityContextMenu = ({ className = "" }) => {
  const { isVisible, context, menuItems, isLoading, hideMenu } = useEntityContextMenu();
  const menuRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState2(0);
  const [openSubmenu, setOpenSubmenu] = useState2(null);
  const [submenuFocusedIndex, setSubmenuFocusedIndex] = useState2(null);
  const [menuPosition, setMenuPosition] = useState2({ x: 0, y: 0 });
  const [positionCalculated, setPositionCalculated] = useState2(false);
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
  useLayoutEffect(() => {
    if (!isVisible || !context) {
      setPositionCalculated(false);
      return;
    }
    const menuEl = menuRef.current;
    const pos = computeMenuPosition(context, menuEl);
    setMenuPosition(pos);
    setPositionCalculated(true);
  }, [isVisible, context, menuItems, viewer]);
  useEffect(() => {
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
  const isItemEnabled = useCallback2(
    (item) => {
      if (!item.enabled) return true;
      if (typeof item.enabled === "boolean") return item.enabled;
      return !!context && item.enabled(context);
    },
    [context]
  );
  const handleKeyDown = useCallback2(
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
      return /* @__PURE__ */ jsx2("div", { className: "ecm-separator" }, item.id ?? `sep-${index}`);
    }
    if (item.type === "custom" && item.render) {
      return /* @__PURE__ */ jsx2("div", { className: "ecm-custom", children: item.render(context) }, item.id ?? `custom-${index}`);
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
    return /* @__PURE__ */ jsxs(
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
          item.type === "toggle" && item.checked && /* @__PURE__ */ jsx2("span", { className: "ecm-checkmark", children: "\u2713" }),
          item.icon && /* @__PURE__ */ jsx2("span", { className: "ecm-item__icon", children: item.icon }),
          /* @__PURE__ */ jsx2("span", { className: "ecm-item__label", children: item.label }),
          item.type === "submenu" && /* @__PURE__ */ jsx2("span", { className: "ecm-item__submenu-indicator", children: "\u25B6" }),
          item.type === "submenu" && openSubmenu === item.id && item.items && /* @__PURE__ */ jsx2("div", { className: "ecm-submenu", children: (() => {
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
  return /* @__PURE__ */ jsx2(
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
      children: isLoading ? /* @__PURE__ */ jsx2("div", { className: "ecm-loading", children: "Loading menu..." }) : menuItems && menuItems.length > 0 ? /* @__PURE__ */ jsx2("div", { className: "ecm-list", children: (() => {
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
      })() }) : /* @__PURE__ */ jsx2("div", { className: "ecm-empty", children: "No actions available" })
    }
  );
};
export {
  EntityContextMenu,
  EntityContextMenuProvider,
  useEntityContextMenu
};
//# sourceMappingURL=index.mjs.map