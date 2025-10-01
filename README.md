# Entity Context Menu for React/Cesium

A lightweight, type-safe context menu system for Resium/Cesium applications. Fully controlled via React Context with automatic Cesium event handling.

## 🌐 Live Demo

- 🌍 [Website](https://resium-entitiy-context-menu-example.okotester.de/)

## ✨ Features

- 🎯 **Context-first Architecture** - Everything is declaratively controlled via React Context
- 🔧 **Automatic Cesium Integration** - Event handlers automatically registered on Cesium canvas
- 🎨 **Flexible Configuration** - Per-entity overrides, type-based factories
- ⚡ **Async Ready** - Supports asynchronous menu generation with loading states
- ♿ **Fully Accessible** - Keyboard navigation, ARIA roles, focus management
- 📦 **TypeScript Support** - Type-safe throughout
- 🚀 **Zero Additional Dependencies** - Uses React, Cesium, and Resium (peer dependencies)

## 📦 Installation

```bash
npm install resium-entity-context-menu
# or
yarn add resium-entity-context-menu
# or
pnpm add resium-entity-context-menu
```

## 🚀 Quick Start

### 1. Import Styles

**Important:** Import the CSS file once in your application entry point:

```tsx
// src/main.tsx or src/index.tsx
import 'resium-entity-context-menu/styles.css';
```

### 2. Setup Provider and Component

The `EntityContextMenu` component **must** be placed inside a Resium `<Viewer>` as it uses the `useCesium()` hook to access the Cesium viewer and automatically registers event handlers.

```tsx
import { Viewer } from 'resium';
import { EntityContextMenuProvider, EntityContextMenu } from 'resium-entity-context-menu';
import { Cartesian3 } from 'cesium';

function App() {
  // Default factory for all entities
  const defaultFactory = (ctx) => [
    {
      id: 'info',
      label: 'Show Info',
      onClick: () => console.log('Entity info:', ctx),
    },
  ];

  // Type-specific factories
  const factoriesByType = {
    city: (ctx) => [
      {
        id: 'fly',
        label: 'Fly Here',
        onClick: () => {
          // ctx.worldPosition is available for Cesium entities
          if (ctx.worldPosition) {
            viewer.camera.flyTo({
              destination: ctx.worldPosition,
              duration: 2,
            });
          }
        },
      },
    ],
  };

  return (
    <EntityContextMenuProvider defaultFactory={defaultFactory} factoriesByType={factoriesByType}>
      <Viewer full>
        {/* Your Cesium entities here */}

        {/* EntityContextMenu MUST be inside Viewer */}
        <EntityContextMenu />
      </Viewer>
    </EntityContextMenuProvider>
  );
}
```

### 3. Trigger Context Menu

#### Option A: Using Resium Entity Component

```tsx
import { Entity } from 'resium';
import { useEntityContextMenu } from 'resium-entity-context-menu';
import { Cartesian3, Cartesian2 } from 'cesium';

function CesiumEntity({ position, name, id }) {
  const { showMenu } = useEntityContextMenu();

  const handleRightClick = (movement, target) => {
    if (!target?.id) return;

    showMenu({
      entityId: target.id.id || id,
      entityType: 'city', // or any custom type
      position: new Cartesian2(movement.position.x, movement.position.y),
      worldPosition: target.id.position?._value || position,
      entityData: target.id,
      clickedAt: new Date().toISOString(),
    });
  };

  return <Entity position={position} name={name} onRightClick={handleRightClick} />;
}
```

#### Option B: Using Custom Event Handler

```tsx
import { useEntityContextMenu } from 'resium-entity-context-menu';
import { useCesium } from 'resium';
import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2 } from 'cesium';
import { useEffect } from 'react';

function CustomEventHandler() {
  const { viewer } = useCesium();
  const { showMenu } = useEntityContextMenu();

  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement) => {
      const pickedObject = viewer.scene.pick(movement.position);

      if (pickedObject?.id) {
        showMenu({
          entityId: pickedObject.id.id,
          entityType: pickedObject.id.type || 'default',
          position: new Cartesian2(movement.position.x, movement.position.y),
          worldPosition: pickedObject.id.position?._value,
          entityData: pickedObject.id,
          clickedAt: new Date().toISOString(),
        });
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);

    return () => handler.destroy();
  }, [viewer, showMenu]);

  return null;
}
```

### 4. Per-Entity Menu Override

Entities can provide their own menu factory (highest priority):

```tsx
const berlinEntity = {
  id: 'berlin',
  type: 'city',
  name: 'Berlin',
  position: Cartesian3.fromDegrees(13.405, 52.52, 0),
  // Entity-specific menu factory (highest priority!)
  menuFactory: (ctx) => [
    {
      id: 'special',
      label: 'Berlin Special Actions',
      type: 'submenu',
      items: [
        {
          id: 'wiki',
          label: 'Open Wikipedia',
          onClick: () => window.open('https://en.wikipedia.org/wiki/Berlin', '_blank'),
        },
        {
          id: 'weather',
          label: 'Show Weather',
          onClick: async (ctx) => {
            const weather = await fetchWeather('Berlin');
            console.log(weather);
          },
        },
      ],
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
};
```

### EntityContext Type

```tsx
type EntityContext = {
  entityId: string;
  entityType?: string;
  position: Cartesian2; // Screen coordinates
  worldPosition?: Cartesian3; // 3D world position (optional)
  entityData?: any; // The Cesium entity or custom data
  clickedAt: string; // ISO timestamp
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

### useEntityContextMenu Hook

```tsx
function useEntityContextMenu(): {
  showMenu: (ctx: EntityContext) => void;
  hideMenu: () => void;
  isVisible: boolean;
  context?: EntityContext;
  menuItems?: MenuItem[];
  isLoading: boolean;
};
```

## 🔥 Advanced Features

### Asynchronous Menu Generation

```tsx
const cityFactory = async (ctx) => {
  // Fetch data from API
  const cityData = await fetch(`/api/cities/${ctx.entityId}`).then((r) => r.json());

  return [
    {
      id: 'population',
      label: `Population: ${cityData.population.toLocaleString()}`,
      onClick: () => showCityDetails(cityData),
    },
    {
      id: 'area',
      label: `Area: ${cityData.area} km²`,
      onClick: () => showAreaInfo(cityData),
    },
  ];
};
```

### Conditional Visibility & Enabling

```tsx
const menuFactory = (ctx) => [
  {
    id: 'edit',
    label: 'Edit Entity',
    // Only show for editable entities
    visible: (ctx) => ctx.entityData?.editable === true,
    // Only enable if not locked
    enabled: (ctx) => !ctx.entityData?.locked,
    onClick: (ctx) => openEditor(ctx.entityId),
  },
  {
    id: 'delete',
    label: 'Delete',
    visible: (ctx) => ctx.entityData?.canDelete,
    onClick: async (ctx) => {
      if (confirm('Delete this entity?')) {
        await deleteEntity(ctx.entityId);
      }
    },
  },
];
```

### Nested Submenus

```tsx
const exportMenu = [
  {
    id: 'export',
    label: 'Export',
    type: 'submenu',
    items: [
      {
        id: 'formats',
        label: 'Formats',
        type: 'submenu',
        items: [
          { id: 'json', label: 'JSON', onClick: () => exportAsJSON() },
          { id: 'csv', label: 'CSV', onClick: () => exportAsCSV() },
          { id: 'kml', label: 'KML', onClick: () => exportAsKML() },
        ],
      },
      { id: 'separator', type: 'separator' },
      { id: 'email', label: 'Send via Email', onClick: () => emailExport() },
    ],
  },
];
```

### Toggle Items

```tsx
const viewMenu = [
  {
    id: 'show-label',
    label: 'Show Label',
    type: 'toggle',
    checked: entity.label?.show,
    onClick: (ctx) => {
      const entity = viewer.entities.getById(ctx.entityId);
      if (entity.label) {
        entity.label.show = !entity.label.show;
      }
    },
  },
];
```

### Custom Rendering

```tsx
const customMenu = [
  {
    id: 'color-picker',
    type: 'custom',
    render: (ctx) => (
      <div style={{ padding: '8px' }}>
        <label>Entity Color:</label>
        <input
          type="color"
          defaultValue={ctx.entityData?.color}
          onChange={(e) => updateEntityColor(ctx.entityId, e.target.value)}
        />
      </div>
    ),
  },
];
```

### Separator Items

```tsx
const menuWithSeparators = [
  { id: 'info', label: 'Show Info', onClick: showInfo },
  { id: 'edit', label: 'Edit', onClick: edit },
  { id: 'sep1', type: 'separator' },
  { id: 'delete', label: 'Delete', onClick: deleteEntity },
];
```

## ⌨️ Keyboard Navigation

The context menu supports full keyboard navigation:

- **↑/↓** - Navigate between menu items
- **→** - Open submenu / Enter submenu
- **←** - Close submenu / Return to parent menu
- **Enter** or **Space** - Activate menu item
- **Escape** - Close menu completely

Focus is automatically managed and menu items are properly focused for screen readers.

## 🎨 Styling

### Import Required Styles

Import the base styles once in your application entry point:

```tsx
// src/main.tsx or src/index.tsx
import 'resium-entity-context-menu/styles.css';
```

### Custom Styling

You can customize the appearance using CSS:

```tsx
<EntityContextMenu className="my-custom-menu" />
```

```css
/* Override default styles */
.my-custom-menu {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.my-custom-menu .ecm-item {
  color: #fff;
  padding: 10px 16px;
}

.my-custom-menu .ecm-item--focused {
  background: #404040;
}

.my-custom-menu .ecm-item--enabled:hover {
  background: #505050;
}
```

### Available CSS Classes

- `.ecm-menu` - Main menu container
- `.ecm-list` - Menu items list
- `.ecm-item` - Individual menu item
- `.ecm-item--enabled` - Enabled item
- `.ecm-item--disabled` - Disabled item
- `.ecm-item--focused` - Focused item (keyboard navigation)
- `.ecm-item--toggle` - Toggle-type item
- `.ecm-item--submenu` - Item with submenu
- `.ecm-item__label` - Item label text
- `.ecm-item__submenu-indicator` - Submenu arrow
- `.ecm-separator` - Separator line
- `.ecm-submenu` - Submenu container
- `.ecm-checkmark` - Checkmark for toggle items
- `.ecm-loading` - Loading state
- `.ecm-empty` - Empty menu state

## 🧪 Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EntityContextMenuProvider,
  EntityContextMenu,
  useEntityContextMenu,
} from 'resium-entity-context-menu';
import { Cartesian2 } from 'cesium';

// Mock Cesium/Resium
jest.mock('resium', () => ({
  useCesium: () => ({
    viewer: {
      scene: {
        canvas: document.createElement('canvas'),
      },
    },
  }),
}));

test('shows menu on showMenu call', () => {
  const TestComponent = () => {
    const { showMenu } = useEntityContextMenu();

    return (
      <button
        onClick={() =>
          showMenu({
            entityId: 'test-entity',
            position: new Cartesian2(100, 100),
            clickedAt: new Date().toISOString(),
          })
        }
      >
        Open Menu
      </button>
    );
  };

  const defaultFactory = () => [{ id: 'test', label: 'Test Item', onClick: jest.fn() }];

  render(
    <EntityContextMenuProvider defaultFactory={defaultFactory}>
      <TestComponent />
      <EntityContextMenu />
    </EntityContextMenuProvider>,
  );

  fireEvent.click(screen.getByText('Open Menu'));
  expect(screen.getByText('Test Item')).toBeInTheDocument();
});
```

## 🔧 Complete Cesium/Resium Example

```tsx
import { Viewer, Entity } from 'resium';
import { Cartesian3, Color, Cartesian2 } from 'cesium';
import {
  EntityContextMenuProvider,
  EntityContextMenu,
  useEntityContextMenu,
} from 'resium-entity-context-menu';
import 'resium-entity-context-menu/styles.css';

function CesiumApp() {
  const cities = [
    { id: 'berlin', name: 'Berlin', position: Cartesian3.fromDegrees(13.405, 52.52, 0) },
    { id: 'paris', name: 'Paris', position: Cartesian3.fromDegrees(2.3522, 48.8566, 0) },
    { id: 'london', name: 'London', position: Cartesian3.fromDegrees(-0.1276, 51.5074, 0) },
  ];

  const defaultFactory = (ctx) => [
    {
      id: 'zoom',
      label: 'Zoom to Entity',
      onClick: () => console.log('Zoom to', ctx.entityId),
    },
  ];

  const cityFactory = (ctx) => [
    {
      id: 'info',
      label: `Info: ${ctx.entityData?.name}`,
      onClick: () => alert(`City: ${ctx.entityData?.name}`),
    },
    {
      id: 'actions',
      label: 'Actions',
      type: 'submenu',
      items: [
        {
          id: 'fly',
          label: 'Fly Here',
          onClick: () => {
            // Access viewer from context if needed
            console.log('Flying to', ctx.worldPosition);
          },
        },
        {
          id: 'highlight',
          label: 'Highlight',
          onClick: () => console.log('Highlight', ctx.entityId),
        },
      ],
    },
  ];

  return (
    <EntityContextMenuProvider
      defaultFactory={defaultFactory}
      factoriesByType={{ city: cityFactory }}
      onOpen={(ctx) => console.log('Menu opened for:', ctx.entityId)}
      onClose={() => console.log('Menu closed')}
    >
      <Viewer full timeline={false} animation={false}>
        {cities.map((city) => (
          <CityEntity key={city.id} city={city} />
        ))}

        <EntityContextMenu />
      </Viewer>
    </EntityContextMenuProvider>
  );
}

function CityEntity({ city }) {
  const { showMenu } = useEntityContextMenu();

  const handleRightClick = (movement, target) => {
    if (!target) return;

    showMenu({
      entityId: city.id,
      entityType: 'city',
      position: new Cartesian2(movement.position.x, movement.position.y),
      worldPosition: city.position,
      entityData: { ...city, editable: true },
      clickedAt: new Date().toISOString(),
    });
  };

  return (
    <Entity
      position={city.position}
      name={city.name}
      point={{ pixelSize: 10, color: Color.RED }}
      onRightClick={handleRightClick}
    />
  );
}

export default CesiumApp;
```

## 📋 Requirements

- React 18+ (Hooks support)
- Cesium 1.90+ (peer dependency)
- Resium 1.17+ (peer dependency)
- TypeScript 4.0+ (optional but recommended)

## ⚠️ Important Notes

1. **EntityContextMenu must be inside Viewer**: The component uses `useCesium()` hook and must be rendered within a Resium `<Viewer>` component.

2. **Automatic Event Handling**: The component automatically registers event handlers on the Cesium canvas. No need to manually handle right-clicks on the canvas level.

3. **Position Format**: The `position` in `EntityContext` must be a `Cartesian2` (screen coordinates), not `Cartesian3`.

4. **Import Styles**: Don't forget to import `resium-entity-context-menu/styles.css` in your application entry point.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🙏 Credits

Built with ❤️ for the React/Cesium community
