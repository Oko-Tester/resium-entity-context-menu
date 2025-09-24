# Entity Context Menu for React/Cesium

A lightweight, type-safe, and functional context menu system for Resium/Cesium applications. Fully controlled via React Context without global registries or singletons.

## Example Website

- [Resium-Entity-Context-Menu](https://resium-entitiy-context-menu-example.okotester.de/)

## ✨ Features

- 🎯 **Context-first Architecture** - Everything is declaratively controlled via React Context
- 🔧 **Pure Functional Design** - Menu factories as pure functions without side effects
- 🎨 **Flexible Configuration** - Per-entity overrides, type-based factories
- ⚡ **Async Ready** - Supports asynchronous menu generation with loading states
- ♿ **Fully Accessible** - Keyboard navigation, ARIA roles, focus management
- 📦 **TypeScript Support** - Type-safe throughout
- 🚀 **Zero Dependencies** - Only React as peer dependency

## 📦 Installation

```bash
npm install resium-entity-context-menu
# or
yarn add resium-entity-context-menu
# or
pnpm add resium-entity-context-menu
```

## 🚀 Quick Start

### 1. Setup Provider

```tsx
import { EntityContextMenuProvider, EntityContextMenu } from 'resium-entity-context-menu';

function App() {
  // Default factory for all entities
  const defaultFactory = (ctx) => [
    {
      id: 'info',
      label: 'Show Info',
      onClick: () => console.log(ctx),
    },
  ];

  // Type-specific factories
  const factoriesByType = {
    city: (ctx) => [
      {
        id: 'fly',
        label: 'Fly Here',
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

### 2. Use in Components

```tsx
import { useEntityContextMenu } from 'resium-entity-context-menu';

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

  return <div onContextMenu={handleRightClick}>{/* Entity content */}</div>;
}
```

### 3. Per-Entity Override

Entities can provide their own menu factory:

```tsx
const berlinEntity = {
  id: 'berlin',
  type: 'city',
  name: 'Berlin',
  // Highest priority!
  menuFactory: (ctx) => [
    {
      id: 'special',
      label: 'Berlin-specific Action',
      onClick: () => openBerlinDetails(),
    },
  ],
};
```

## 🎯 Priority System

Menu resolution follows this priority:

1. **entity.menuFactory** - Entity-specific menu (highest priority)
2. **factoriesByType[entityType]** - Type-based menu
3. **defaultFactory** - Default menu (lowest priority)

## 📝 API Reference

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
  items?: MenuItem[]; // for submenus
  render?: (ctx: EntityContext) => React.ReactNode; // for custom items
  checked?: boolean; // for toggle items
};
```

## 🔥 Advanced Features

### Asynchronous Menu Generation

```tsx
const cityFactory = async (ctx) => {
  // Load data from server
  const cityData = await fetchCityData(ctx.entityId);

  return [
    {
      id: 'population',
      label: `Population: ${cityData.population}`,
      onClick: () => showDetails(cityData),
    },
  ];
};
```

### Conditional Visibility & Enabling

```tsx
const menuItems = [
  {
    id: 'edit',
    label: 'Edit',
    visible: (ctx) => ctx.entityData.editable,
    enabled: (ctx) => !ctx.entityData.locked,
    onClick: (ctx) => editEntity(ctx.entityId),
  },
];
```

### Submenus

```tsx
const menuItems = [
  {
    id: 'export',
    label: 'Export',
    type: 'submenu',
    items: [
      { id: 'pdf', label: 'As PDF', onClick: exportPDF },
      { id: 'csv', label: 'As CSV', onClick: exportCSV },
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

- **↑/↓** - Navigate between menu items
- **→** - Open submenu
- **←** - Close submenu
- **Enter/Space** - Activate menu item
- **Escape** - Close menu

## 🎨 Styling / CSS (important)

This package ships **unstyled CSS** that you must import yourself once in your application so the context menu looks correct.

**Where the file is located:**  
`resium-entity-context-menu/styles.css`

### How to import

Import the stylesheet **once** in your application's entry point (root). Examples:

- **Create React App / Vite / Parcel** (anywhere in app entry, e.g. `src/main.tsx` or `src/index.tsx`):

```ts
// src/main.tsx
import 'resium-entity-context-menu/styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
// ...
```

```tsx
<EntityContextMenu className="my-custom-menu" />
```

```css
.my-custom-menu {
  background: #2a2a2a;
  border: 1px solid #444;
  /* More styles */
}
```

## 🧪 Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityContextMenuProvider, useEntityContextMenu } from 'resium-entity-context-menu';

test('shows menu on showMenu call', () => {
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
        Open Menu
      </button>
    );
  };

  render(
    <EntityContextMenuProvider defaultFactory={() => [{ id: 'test', label: 'Test Item' }]}>
      <TestComponent />
      <EntityContextMenu />
    </EntityContextMenuProvider>,
  );

  fireEvent.click(screen.getByText('Open Menu'));
  expect(screen.getByText('Test Item')).toBeInTheDocument();
});
```

## 🔧 Configuration for Cesium/Resium

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

## 📋 Requirements

- React 16.8+ (Hooks support)
- TypeScript 4.0+ (optional but recommended)

## 🤝 Contributing

Contributions are welcome! Please create an issue or pull request.

## 📄 License

MIT

## 🙏 Credits

Built with ❤️ for the React/Cesium community
