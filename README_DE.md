# Entity Context Menu für React/Cesium

Ein leichtgewichtiges, typsicheres und funktionales Kontextmenü-System für Resium/Cesium-Anwendungen. Vollständig über React Context gesteuert, ohne globale Registry oder Singletons.

## ✨ Features

- 🎯 **Context-first Architecture** - Alles wird deklarativ über React Context gesteuert
- 🔧 **Pure Functional Design** - Menu Factories als pure functions ohne Seiteneffekte
- 🎨 **Flexible Konfiguration** - Per-Entity Overrides, Type-basierte Factories
- ⚡ **Async Ready** - Unterstützt asynchrone Menu-Generierung mit Loading States
- ♿ **Vollständig zugänglich** - Keyboard Navigation, ARIA Roles, Focus Management
- 📦 **TypeScript Support** - Durchgehend typsicher
- 🚀 **Zero Dependencies** - Nur React als Peer Dependency

## 📦 Installation

```bash
npm install resium-entity-context-menu
# oder
yarn add resium-entity-context-menu
# oder
pnpm add resium-entity-context-menu
```

## 🚀 Quick Start

### 1. Provider einrichten

```tsx
import { EntityContextMenuProvider, EntityContextMenu } from 'resium-entity-context-menu';

function App() {
  // Standard-Factory für alle Entities
  const defaultFactory = (ctx) => [
    {
      id: 'info',
      label: 'Info anzeigen',
      onClick: () => console.log(ctx),
    },
  ];

  // Typ-spezifische Factories
  const factoriesByType = {
    city: (ctx) => [
      {
        id: 'fly',
        label: 'Hier hinfliegen',
        onClick: () => flyToCity(ctx.worldPosition),
      },
    ],
  };

  return (
    <EntityContextMenuProvider defaultFactory={defaultFactory} factoriesByType={factoriesByType}>
      <CesiumMap />
      <EntityContextMenu />
    </EntityContextMenuProvider>
  );
}
```

### 2. In Komponenten verwenden

```tsx
import { useEntityContextMenu } from entity-context-menu';

function MyEntity({ entity }) {
  const { showMenu } = useEntityContextMenu();

  const handleRightClick = (e) => {
    e.preventDefault();
    showMenu({
      entityId: entity.id,
      entityType: entity.type,
      position: { x: e.clientX, y: e.clientY },
      entityData: entity,
      clickedAt: new Date().toISOString(),
    });
  };

  return <div onContextMenu={handleRightClick}>{/* Entity-Inhalt */}</div>;
}
```

### 3. Per-Entity Override

Entities können ihre eigene Menu-Factory mitbringen:

```tsx
const berlinEntity = {
  id: 'berlin',
  type: 'city',
  name: 'Berlin',
  // Höchste Priorität!
  menuFactory: (ctx) => [
    {
      id: 'special',
      label: 'Berlin-spezifische Aktion',
      onClick: () => openBerlinDetails(),
    },
  ],
};
```

## 🎯 Prioritätssystem

Die Menu-Auflösung folgt dieser Priorität:

1. **entity.menuFactory** - Entity-spezifisches Menü (höchste Priorität)
2. **factoriesByType[entityType]** - Typ-basiertes Menü
3. **defaultFactory** - Standard-Menü (niedrigste Priorität)

## 📝 API Referenz

### EntityContextMenuProvider

```tsx
type EntityContextMenuProviderProps = {
  children: React.ReactNode;
  defaultFactory: (ctx: EntityContext) => MenuItem[] | Promise<MenuItem[]>;
  factoriesByType?: Record<string, MenuFactory>;
  onOpen?: (ctx: EntityContext) => void;
  onClose?: () => void;
  closeOnAction?: boolean; // default: true
};
```

### useEntityContextMenu Hook

```tsx
function useEntityContextMenu(): {
  showMenu: (ctx: EntityContext) => void;
  hideMenu: () => void;
  isVisible: boolean;
  context?: EntityContext;
  menuItems?: MenuItem[];
};
```

### MenuItem Type

```tsx
type MenuItem = {
  id: string;
  label: string;
  type?: 'action' | 'submenu' | 'toggle' | 'separator' | 'custom';
  visible?: (ctx: EntityContext) => boolean;
  enabled?: (ctx: EntityContext) => boolean;
  onClick?: (ctx: EntityContext) => void | Promise<void>;
  items?: MenuItem[]; // für Submenüs
  render?: (ctx: EntityContext) => React.ReactNode; // für custom items
  checked?: boolean; // für toggle items
};
```

## 🔥 Erweiterte Features

### Asynchrone Menu-Generierung

```tsx
const cityFactory = async (ctx) => {
  // Daten vom Server laden
  const cityData = await fetchCityData(ctx.entityId);

  return [
    {
      id: 'population',
      label: `Einwohner: ${cityData.population}`,
      onClick: () => showDetails(cityData),
    },
  ];
};
```

### Bedingte Sichtbarkeit & Aktivierung

```tsx
const menuItems = [
  {
    id: 'edit',
    label: 'Bearbeiten',
    visible: (ctx) => ctx.entityData.editable,
    enabled: (ctx) => !ctx.entityData.locked,
    onClick: (ctx) => editEntity(ctx.entityId),
  },
];
```

### Submenüs

```tsx
const menuItems = [
  {
    id: 'export',
    label: 'Exportieren',
    type: 'submenu',
    items: [
      { id: 'pdf', label: 'Als PDF', onClick: exportPDF },
      { id: 'csv', label: 'Als CSV', onClick: exportCSV },
    ],
  },
];
```

### Custom Rendering

```tsx
const menuItems = [
  {
    id: 'color',
    type: 'custom',
    render: (ctx) => (
      <ColorPicker
        value={ctx.entityData.color}
        onChange={(color) => updateColor(ctx.entityId, color)}
      />
    ),
  },
];
```

## ⌨️ Keyboard Shortcuts

- **↑/↓** - Navigation zwischen Menüpunkten
- **→** - Submenü öffnen
- **←** - Submenü schließen
- **Enter/Space** - Menüpunkt aktivieren
- **Escape** - Menü schließen

## 🎨 Styling

Das Menü verwendet basis CSS-Klassen. Für eigenes Styling:

```tsx
<EntityContextMenu className="my-custom-menu" />
```

```css
.my-custom-menu {
  background: #2a2a2a;
  border: 1px solid #444;
  /* Weitere Styles */
}
```

## 🧪 Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityContextMenuProvider, useEntityContextMenu } from entity-context-menu';

test('zeigt Menü bei showMenu Aufruf', () => {
  const TestComponent = () => {
    const { showMenu } = useEntityContextMenu();

    return (
      <button
        onClick={() =>
          showMenu({
            entityId: 'test',
            position: { x: 100, y: 100 },
            clickedAt: new Date().toISOString(),
          })
        }
      >
        Menü öffnen
      </button>
    );
  };

  render(
    <EntityContextMenuProvider defaultFactory={() => [{ id: 'test', label: 'Test Item' }]}>
      <TestComponent />
      <EntityContextMenu />
    </EntityContextMenuProvider>,
  );

  fireEvent.click(screen.getByText('Menü öffnen'));
  expect(screen.getByText('Test Item')).toBeInTheDocument();
});
```

## 🔧 Konfiguration für Cesium/Resium

```tsx
import { Viewer, Entity } from 'resium';
import { useEntityContextMenu } from 'resium-entity-context-menu';

function CesiumEntity({ position, name }) {
  const { showMenu } = useEntityContextMenu();

  const handleClick = (movement, target) => {
    if (!target) return;

    showMenu({
      entityId: target.id.id,
      entityType: 'cesium-entity',
      position: {
        x: movement.position.x,
        y: movement.position.y,
      },
      worldPosition: target.id.position,
      entityData: target.id,
      clickedAt: new Date().toISOString(),
    });
  };

  return <Entity position={position} name={name} onClick={handleClick} />;
}
```

## 📋 Anforderungen

- React 16.8+ (Hooks Support)
- TypeScript 4.0+ (optional, aber empfohlen)

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstellen Sie einen Issue oder Pull Request.

## 📄 Lizenz

MIT

## 🙏 Credits

Entwickelt mit ❤️ für die React/Cesium Community
