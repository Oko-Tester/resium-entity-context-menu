// src/components/ResiumEntityContextMenu.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";
function ResiumEntityContextMenu(props) {
  const {
    entity,
    getMenuItems,
    renderMenuItem,
    onSelect,
    openOn = "rightClick",
    positionOffset = { x: 4, y: 4 },
    portal = true,
    closeOnOutsideClick = true,
    keyboardNavigation = true,
    className = "",
    style = {},
    disabled = false,
    zIndex = 3e3,
    viewer = null,
    hoverDelay = 250,
    longPressDuration = 500,
    debug = false
  } = props;
  const log = useCallback(
    (...args) => {
      if (debug) {
        console.log("\u{1F3AF} ResiumEntityContextMenu:", ...args);
      }
    },
    [debug]
  );
  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const callIdRef = useRef(0);
  const menuRef = useRef(null);
  const itemsRefs = useRef([]);
  const hoverTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const setItemRef = useCallback((el, idx) => {
    itemsRefs.current[idx] = el;
  }, []);
  useEffect(() => {
    log("Component mounted with entity:", entity);
    log("Viewer available:", !!viewer);
    log("OpenOn mode:", openOn);
  }, [entity, viewer, openOn, log]);
  const getParentEntity = useCallback(() => {
    log("Getting parent entity...");
    if (entity) {
      log("Entity provided via props:", entity);
      return entity;
    }
    log("Searching for entity in contexts...");
    try {
      const contexts = [
        window.__RESIUM_CONTEXT__,
        window.RESIUM_CONTEXT,
        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner
      ];
      contexts.forEach((context, i) => {
        log(`Context ${i}:`, context);
      });
    } catch (e) {
      log("Context search failed:", e);
    }
    log("No entity found, returning undefined");
    return void 0;
  }, [entity, log]);
  const getViewerFromWindow = useCallback(() => {
    log("Getting viewer...");
    if (viewer) {
      log("Viewer provided via props:", viewer);
      return viewer;
    }
    try {
      const cesiumWidget = document.querySelector(".cesium-widget");
      log("Cesium widget found:", !!cesiumWidget);
      if (cesiumWidget?.cesiumWidget) {
        log("Cesium widget instance found");
        return cesiumWidget.cesiumWidget.scene;
      }
      const canvas = document.querySelector("canvas.cesium-canvas");
      log("Cesium canvas found:", !!canvas);
      const cesium = window.Cesium;
      log("Global Cesium available:", !!cesium);
    } catch (e) {
      log("Viewer search failed:", e);
    }
    log("No viewer found");
    return null;
  }, [viewer, log]);
  const isTargetEntity = useCallback(
    (pickedEntity) => {
      log("Checking if picked entity matches target...");
      log("Picked entity:", pickedEntity);
      if (!pickedEntity) {
        log("No entity picked");
        return false;
      }
      const parentEntity = getParentEntity();
      log("Parent entity:", parentEntity);
      if (!parentEntity) {
        log("No parent entity - allowing click (fallback)");
        return true;
      }
      const directMatch = pickedEntity === parentEntity;
      log("Direct reference match:", directMatch);
      const stringMatch = typeof parentEntity === "string" && pickedEntity.id === parentEntity;
      log("String ID match:", stringMatch);
      const idMatch = typeof parentEntity === "object" && pickedEntity.id === parentEntity.id;
      log("Object ID match:", idMatch);
      const result = directMatch || stringMatch || idMatch;
      log("Final match result:", result);
      return result;
    },
    [getParentEntity, log]
  );
  const handleGlobalClick = useCallback(
    (event) => {
      log("\u{1F5B1}\uFE0F Global click detected!");
      log("Event type:", event.type);
      log("Event target:", event.target);
      const currentViewer = getViewerFromWindow();
      if (!currentViewer) {
        log("\u274C No viewer available for picking");
        const clientX2 = "clientX" in event ? event.clientX : event.touches?.[0]?.clientX || 0;
        const clientY2 = "clientY" in event ? event.clientY : event.touches?.[0]?.clientY || 0;
        log("\u{1F41B} DEBUG: Opening menu anyway at", clientX2, clientY2);
        void openMenuAt(clientX2, clientY2);
        return;
      }
      log("\u2705 Viewer found, attempting pick...");
      const clientX = "clientX" in event ? event.clientX : event.touches?.[0]?.clientX || 0;
      const clientY = "clientY" in event ? event.clientY : event.touches?.[0]?.clientY || 0;
      log("Click coordinates:", { clientX, clientY });
      try {
        const canvas = currentViewer.canvas || document.querySelector("canvas.cesium-canvas");
        log("Canvas found:", !!canvas);
        if (!canvas) {
          log("\u274C No canvas found");
          return;
        }
        const rect = canvas.getBoundingClientRect();
        const x2 = clientX - rect.left;
        const y2 = clientY - rect.top;
        log("Canvas-relative coordinates:", { x: x2, y: y2 });
        let picked = null;
        if (currentViewer.pick && typeof currentViewer.pick === "function") {
          log("Using viewer.pick...");
          picked = currentViewer.pick({ x: x2, y: y2 });
        } else if (currentViewer.scene?.pick) {
          log("Using viewer.scene.pick...");
          picked = currentViewer.scene.pick({ x: x2, y: y2 });
        } else {
          log("\u274C No pick method available");
        }
        log("Pick result:", picked);
        const pickedEntity = picked && picked.id ? picked.id : null;
        log("Picked entity:", pickedEntity);
        if (isTargetEntity(pickedEntity)) {
          log("\u2705 Target entity matches! Opening menu...");
          void openMenuAt(clientX, clientY);
        } else {
          log("\u274C Target entity does not match");
        }
      } catch (error2) {
        log("\u274C Pick failed:", error2);
        log("\u{1F41B} DEBUG: Opening menu anyway due to pick failure");
        void openMenuAt(clientX, clientY);
      }
    },
    [getViewerFromWindow, isTargetEntity, log]
  );
  const loadMenuItems = useCallback(
    async (entityArg) => {
      log("Loading menu items for entity:", entityArg);
      const myCall = ++callIdRef.current;
      setLoading(true);
      setError(null);
      setItems(null);
      try {
        const targetEntity = entityArg || getParentEntity();
        log("Target entity for menu items:", targetEntity);
        const res = await getMenuItems(targetEntity);
        log("Menu items loaded:", res);
        if (callIdRef.current === myCall) {
          setItems(res || []);
          setLoading(false);
          setError(null);
          const firstIndex = (res || []).findIndex((it) => !it.disabled && !it.separator);
          setFocusIndex(firstIndex >= 0 ? firstIndex : -1);
        }
      } catch (e) {
        log("\u274C Failed to load menu items:", e);
        if (callIdRef.current === myCall) {
          setItems(null);
          setLoading(false);
          setError("Fehler beim Laden der Men\xFCeintr\xE4ge");
        }
      }
    },
    [getMenuItems, getParentEntity, log]
  );
  const openMenuAt = useCallback(
    async (clientX, clientY) => {
      log("\u{1F3AF} Opening menu at:", { clientX, clientY });
      if (disabled) {
        log("\u274C Menu is disabled");
        return;
      }
      setX(clientX + positionOffset.x);
      setY(clientY + positionOffset.y);
      setOpen(true);
      log("\u2705 Menu state set to open");
      const targetEntity = getParentEntity();
      await loadMenuItems(targetEntity);
    },
    [disabled, positionOffset, getParentEntity, loadMenuItems, log]
  );
  const closeMenu = useCallback(() => {
    log("Closing menu");
    setOpen(false);
    setItems(null);
    setLoading(false);
    setError(null);
    setFocusIndex(-1);
    callIdRef.current++;
  }, [log]);
  const handleItemSelect = useCallback(
    async (item) => {
      log("Menu item selected:", item);
      try {
        const targetEntity = getParentEntity();
        await onSelect?.(item, targetEntity);
      } catch (error2) {
        log("\u274C Error selecting menu item:", error2);
      } finally {
        closeMenu();
      }
    },
    [onSelect, getParentEntity, closeMenu, log]
  );
  useEffect(() => {
    if (disabled) {
      log("Event listeners disabled");
      return;
    }
    log("\u{1F3A7} Setting up event listeners for:", openOn);
    const onContextMenu = (ev) => {
      if (openOn !== "rightClick") return;
      log("\u{1F5B1}\uFE0F Right click detected");
      ev.preventDefault();
      handleGlobalClick(ev);
    };
    const onLeftClick = (ev) => {
      if (openOn !== "leftClick" || ev.button !== 0) return;
      log("\u{1F5B1}\uFE0F Left click detected");
      handleGlobalClick(ev);
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("click", onLeftClick);
    log("\u2705 Event listeners registered");
    return () => {
      log("\u{1F5D1}\uFE0F Cleaning up event listeners");
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("click", onLeftClick);
    };
  }, [openOn, handleGlobalClick, disabled, log]);
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDocClick = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      log("Click outside menu - closing");
      closeMenu();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, closeOnOutsideClick, closeMenu, log]);
  useEffect(() => {
    if (!open || !keyboardNavigation || !items) return;
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeMenu();
        return;
      }
      const visibleItems = items.filter((it) => !it.disabled && !it.separator);
      if (visibleItems.length === 0) return;
      if (ev.key === "ArrowDown") {
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
      } else if (ev.key === "ArrowUp") {
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
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const it = items[focusIndex];
        if (it && !it.disabled && !it.separator) {
          handleItemSelect(it);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, keyboardNavigation, items, focusIndex, handleItemSelect, closeMenu]);
  useEffect(() => {
    if (!open || focusIndex < 0 || !items) return;
    requestAnimationFrame(() => {
      itemsRefs.current[focusIndex]?.focus();
    });
  }, [focusIndex, open, items]);
  useEffect(() => {
    log("Menu open state changed:", open);
  }, [open, log]);
  useEffect(() => {
    log("Menu items changed:", items);
  }, [items, log]);
  if (!open) return null;
  const menuContent = /* @__PURE__ */ jsxs(
    "div",
    {
      ref: menuRef,
      role: "menu",
      className: `resium-entity-contextmenu ${className}`,
      style: {
        position: "fixed",
        left: x,
        top: y,
        zIndex,
        minWidth: 160,
        padding: 8,
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        outline: "none",
        ...debug ? { border: "3px solid red" } : {},
        ...style
      },
      children: [
        debug && /* @__PURE__ */ jsx("div", { style: { padding: "4px 8px", backgroundColor: "#ffe6e6", fontSize: "12px" }, children: "\u{1F41B} DEBUG MODE" }),
        loading && /* @__PURE__ */ jsx("div", { style: { padding: "8px 12px", color: "#666" }, children: "Laden..." }),
        error && /* @__PURE__ */ jsx("div", { style: { padding: "8px 12px", color: "#d32f2f" }, children: error }),
        !loading && !error && items && items.length === 0 && /* @__PURE__ */ jsx("div", { style: { padding: "8px 12px", color: "#666" }, children: "Keine Aktionen verf\xFCgbar" }),
        !loading && !error && items && items.length > 0 && /* @__PURE__ */ jsx("div", { children: items.map((item, idx) => {
          if (item.separator) {
            return /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  height: 1,
                  backgroundColor: "#eee",
                  margin: "4px 0"
                }
              },
              `separator-${idx}`
            );
          }
          const isDisabled = !!item.disabled;
          const isFocused = focusIndex === idx;
          return /* @__PURE__ */ jsx(
            "button",
            {
              ref: (el) => setItemRef(el, idx),
              role: "menuitem",
              disabled: isDisabled,
              tabIndex: -1,
              onClick: () => !isDisabled && handleItemSelect(item),
              onMouseEnter: () => setFocusIndex(idx),
              style: {
                display: "block",
                width: "100%",
                padding: "8px 12px",
                border: "none",
                backgroundColor: isFocused ? "#f5f5f5" : "transparent",
                textAlign: "left",
                cursor: isDisabled ? "not-allowed" : "pointer",
                borderRadius: 4,
                opacity: isDisabled ? 0.5 : 1
              },
              children: renderMenuItem ? renderMenuItem(item) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                item.icon && /* @__PURE__ */ jsx("span", { children: item.icon }),
                /* @__PURE__ */ jsx("span", { children: item.label })
              ] })
            },
            item.id
          );
        }) })
      ]
    }
  );
  return portal ? ReactDOM.createPortal(menuContent, document.body) : menuContent;
}
export {
  ResiumEntityContextMenu as default
};
//# sourceMappingURL=index.mjs.map