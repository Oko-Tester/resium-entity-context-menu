"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => ResiumEntityContextMenu
});
module.exports = __toCommonJS(index_exports);

// src/components/ResiumEntityContextMenu.tsx
var import_react = __toESM(require("react"));
var import_react_dom = __toESM(require("react-dom"));
var import_jsx_runtime = require("react/jsx-runtime");
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
  const log = (0, import_react.useCallback)(
    (...args) => {
      if (debug) {
        console.log("\u{1F3AF} ResiumEntityContextMenu:", ...args);
      }
    },
    [debug]
  );
  const [open, setOpen] = (0, import_react.useState)(false);
  const [x, setX] = (0, import_react.useState)(0);
  const [y, setY] = (0, import_react.useState)(0);
  const [items, setItems] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [focusIndex, setFocusIndex] = (0, import_react.useState)(-1);
  const callIdRef = (0, import_react.useRef)(0);
  const menuRef = (0, import_react.useRef)(null);
  const itemsRefs = (0, import_react.useRef)([]);
  const hoverTimerRef = (0, import_react.useRef)(null);
  const longPressTimerRef = (0, import_react.useRef)(null);
  const setItemRef = (0, import_react.useCallback)((el, idx) => {
    itemsRefs.current[idx] = el;
  }, []);
  (0, import_react.useEffect)(() => {
    log("Component mounted with entity:", entity);
    log("Viewer available:", !!viewer);
    log("OpenOn mode:", openOn);
  }, [entity, viewer, openOn, log]);
  const getParentEntity = (0, import_react.useCallback)(() => {
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
        import_react.default.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner
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
  const getViewerFromWindow = (0, import_react.useCallback)(() => {
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
  const isTargetEntity = (0, import_react.useCallback)(
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
  const handleGlobalClick = (0, import_react.useCallback)(
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
  const loadMenuItems = (0, import_react.useCallback)(
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
  const openMenuAt = (0, import_react.useCallback)(
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
  const closeMenu = (0, import_react.useCallback)(() => {
    log("Closing menu");
    setOpen(false);
    setItems(null);
    setLoading(false);
    setError(null);
    setFocusIndex(-1);
    callIdRef.current++;
  }, [log]);
  const handleItemSelect = (0, import_react.useCallback)(
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
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDocClick = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      log("Click outside menu - closing");
      closeMenu();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, closeOnOutsideClick, closeMenu, log]);
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    if (!open || focusIndex < 0 || !items) return;
    requestAnimationFrame(() => {
      itemsRefs.current[focusIndex]?.focus();
    });
  }, [focusIndex, open, items]);
  (0, import_react.useEffect)(() => {
    log("Menu open state changed:", open);
  }, [open, log]);
  (0, import_react.useEffect)(() => {
    log("Menu items changed:", items);
  }, [items, log]);
  if (!open) return null;
  const menuContent = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
        debug && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "4px 8px", backgroundColor: "#ffe6e6", fontSize: "12px" }, children: "\u{1F41B} DEBUG MODE" }),
        loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 12px", color: "#666" }, children: "Laden..." }),
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 12px", color: "#d32f2f" }, children: error }),
        !loading && !error && items && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 12px", color: "#666" }, children: "Keine Aktionen verf\xFCgbar" }),
        !loading && !error && items && items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: items.map((item, idx) => {
          if (item.separator) {
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
              children: renderMenuItem ? renderMenuItem(item) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                item.icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.icon }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })
              ] })
            },
            item.id
          );
        }) })
      ]
    }
  );
  return portal ? import_react_dom.default.createPortal(menuContent, document.body) : menuContent;
}
//# sourceMappingURL=index.js.map