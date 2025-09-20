# 🌍 Resium Entity Context Menu

Eine flexible und benutzerfreundliche React-Komponente für Context Menus in Cesium/Resium-Anwendungen.

## ✨ Features

- 🖱️ **Mehrere Aktivierungsmodi**: Rechtsklick, Linksklick, Hover, Long Press
- ⌨️ **Vollständige Keyboard-Navigation**: Pfeiltasten, Enter, Escape
- 🎨 **Anpassbares Styling**: CSS-Klassen und Inline-Styles
- 🔄 **Asynchrone Menu Items**: Unterstützt sowohl synchrone als auch asynchrone Datenquellen
- 🎯 **Entity-Integration**: Nahtlose Integration mit Cesium Entities
- 📱 **Touch-Support**: Long-Press für mobile Geräte
- ♿ **Barrierefrei**: ARIA-Labels und Fokus-Management
- 🚪 **Portal-Rendering**: Vermeidet z-index Probleme
- 🎭 **Custom Renderer**: Eigene Menu-Item Darstellung möglich

## 📦 Installation

```bash
npm install @resium-entity-context-menu
# oder
pnpm add @resium-entity-context-menu
# oder
yarn add @resium-entity-context-menu
```

## 🚀 Schnellstart

```tsx
import React from 'react';
import ResiumEntityContextMenu from 'resium-entity-context-menu';
import type { MenuItem } from '@resium-entity-context-menu';

function MyComponent() {
  const getMenuItems = async (entity) => {
    return [
      { id: 'info', label: 'Information', icon: 'ℹ️' },
      { id: 'edit', label: 'Bearbeiten', icon: '✏️' },
      { id: 'sep1', separator: true },
      { id: 'delete', label: 'Löschen', icon: '🗑️' },
    ];
  };

  const handleSelect = (item: MenuItem, entity) => {
    console.log('Ausgewählt:', item.label, entity);
  };

  return (
    <div>
      {/* Ihr Cesium/Resium Content */}
      <ResiumEntityContextMenu
        entity={myEntity}
        getMenuItems={getMenuItems}
        onSelect={handleSelect}
        openOn="rightClick"
      />
    </div>
  );
}
```

## 📖 API Referenz

### Props

| Prop                  | Typ                                                     | Default        | Beschreibung                        |
| --------------------- | ------------------------------------------------------- | -------------- | ----------------------------------- |
| `entity`              | `Entity \| string`                                      | -              | Cesium Entity oder Entity-ID        |
| `getMenuItems`        | `(entity?) => MenuItem[] \| Promise<MenuItem[]>`        | **Required**   | Funktion zum Laden der Menu Items   |
| `onSelect`            | `(item, entity?) => void \| Promise<void>`              | -              | Callback bei Item-Auswahl           |
| `renderMenuItem`      | `(item) => ReactNode`                                   | -              | Custom Menu Item Renderer           |
| `openOn`              | `'rightClick' \| 'leftClick' \| 'hover' \| 'longPress'` | `'rightClick'` | Aktivierungsmodus                   |
| `positionOffset`      | `{x: number, y: number}`                                | `{x: 4, y: 4}` | Menu-Position Offset                |
| `portal`              | `boolean`                                               | `true`         | Portal-Rendering aktivieren         |
| `closeOnOutsideClick` | `boolean`                                               | `true`         | Bei Außenklick schließen            |
| `keyboardNavigation`  | `boolean`                                               | `true`         | Keyboard-Navigation                 |
| `className`           | `string`                                                | `''`           | CSS-Klasse für das Menu             |
| `style`               | `CSSProperties`                                         | `{}`           | Inline-Styles                       |
| `disabled`            | `boolean`                                               | `false`        | Menu deaktivieren                   |
| `zIndex`              | `number`                                                | `3000`         | Z-Index des Menus                   |
| `viewer`              | `Cesium.Viewer`                                         | `null`         | Cesium Viewer für Entity-Projektion |
| `hoverDelay`          | `number`                                                | `250`          | Verzögerung bei Hover (ms)          |
| `longPressDuration`   | `number`                                                | `500`          | Long-Press Dauer (ms)               |

### MenuItem Interface

```tsx
interface MenuItem {
  id: string; // Eindeutige ID
  label: string; // Anzeigetext
  icon?: React.ReactNode; // Optional: Icon
  disabled?: boolean; // Item deaktiviert
  separator?: boolean; // Trennlinie
  meta?: any; // Zusätzliche Daten
}
```

## 🎯 Verwendungsbeispiele

### Basis Setup

```tsx
import ResiumEntityContextMenu from '@resium-entity-context-menu';

const menuItems = [
  { id: 'zoom', label: 'Hineinzoomen', icon: '🔍' },
  { id: 'info', label: 'Details anzeigen', icon: 'ℹ️' },
  { id: 'sep1', separator: true },
  { id: 'edit', label: 'Bearbeiten', icon: '✏️' },
  { id: 'delete', label: 'Löschen', icon: '🗑️', disabled: false },
];

<ResiumEntityContextMenu
  entity={selectedEntity}
  getMenuItems={() => menuItems}
  onSelect={(item, entity) => {
    switch (item.id) {
      case 'zoom':
        viewer.zoomTo(entity);
        break;
      case 'delete':
        viewer.entities.remove(entity);
        break;
    }
  }}
/>;
```

### Asynchrone Menu Items

```tsx
const getAsyncMenuItems = async (entity) => {
  // API-Aufruf oder andere asynchrone Operationen
  const permissions = await fetchUserPermissions(entity.id);

  return [
    { id: 'view', label: 'Anzeigen', icon: '👁️' },
    ...(permissions.canEdit ? [{ id: 'edit', label: 'Bearbeiten', icon: '✏️' }] : []),
    ...(permissions.canDelete
      ? [
          { id: 'sep1', separator: true },
          { id: 'delete', label: 'Löschen', icon: '🗑️' },
        ]
      : []),
  ];
};
```

### Custom Menu Item Renderer

```tsx
const customRenderer = (item) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    {item.icon && <span style={{ fontSize: 18 }}>{item.icon}</span>}
    <div>
      <div style={{ fontWeight: 'bold' }}>{item.label}</div>
      {item.meta?.description && (
        <div style={{ fontSize: 12, color: '#666' }}>{item.meta.description}</div>
      )}
    </div>
    {item.meta?.shortcut && <kbd style={{ marginLeft: 'auto' }}>{item.meta.shortcut}</kbd>}
  </div>
);

<ResiumEntityContextMenu
  renderMenuItem={customRenderer}
  getMenuItems={() => [
    {
      id: 'copy',
      label: 'Kopieren',
      icon: '📋',
      meta: { description: 'In Zwischenablage kopieren', shortcut: 'Ctrl+C' },
    },
  ]}
/>;
```

### Verschiedene Aktivierungsmodi

```tsx
// Hover-Aktivierung
<ResiumEntityContextMenu
  openOn="hover"
  hoverDelay={300}
  entity={entity}
  getMenuItems={getMenuItems}
/>

// Long Press für Touch-Geräte
<ResiumEntityContextMenu
  openOn="longPress"
  longPressDuration={800}
  entity={entity}
  getMenuItems={getMenuItems}
/>

// Linksklick-Aktivierung
<ResiumEntityContextMenu
  openOn="leftClick"
  entity={entity}
  getMenuItems={getMenuItems}
/>
```

### Mit Cesium Viewer Integration

```tsx
<ResiumEntityContextMenu
  entity={entity}
  viewer={cesiumViewer} // Für präzise Entity-Positionierung
  getMenuItems={getMenuItems}
  onSelect={(item, entity) => {
    if (item.id === 'center') {
      // Viewer kann für Entity-Operationen verwendet werden
      cesiumViewer.camera.flyTo({ destination: entity.position });
    }
  }}
/>
```

## 🎨 Styling

### CSS-Klassen

```css
.resium-entity-contextmenu {
  /* Basis Menu Styling */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
}

.resium-entity-contextmenu button {
  /* Menu Item Styling */
  transition: background-color 0.2s ease;
}

.resium-entity-contextmenu button:hover {
  background-color: #f0f8ff !important;
  transform: translateX(2px);
}
```

### Inline Styles

```tsx
<ResiumEntityContextMenu
  style={{
    backgroundColor: '#2c3e50',
    color: 'white',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  }}
  className="dark-menu"
/>
```

## ⌨️ Keyboard Shortcuts

| Taste     | Aktion                    |
| --------- | ------------------------- |
| `↑` / `↓` | Navigation zwischen Items |
| `Enter`   | Item auswählen            |
| `Escape`  | Menu schließen            |
| `Home`    | Zum ersten Item           |
| `End`     | Zum letzten Item          |

## 🧪 Testing

```bash
# Tests ausführen
pnpm test

# Tests mit Watch-Modus
pnpm test:watch

# Coverage Report
pnpm test -- --coverage
```

## 🔧 Entwicklung

```bash
# Abhängigkeiten installieren
pnpm install

# Entwicklungsmodus
pnpm dev

# Build erstellen
pnpm build

# Linting
pnpm lint

# Formatierung
pnpm format
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne eine Pull Request

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- [Cesium](https://cesium.com/) für die 3D-Globus-Technologie
- [Resium](https://github.com/reearth/resium) für React-Cesium Integration
- [React](https://reactjs.org/) für das UI-Framework

## 📞 Support

- 🐛 [Issues](https://github.com/Oko-Tester/resium-entity-context-menu/issues)
- 💬 [Discussions](https://github.com/Oko-Tester/resium-entity-context-menu/discussions)
- 📧 Email: okotestproductions@gmail.com

---

Made with ❤️ by [Oko-Tester](https://github.com/Oko-Tester)
