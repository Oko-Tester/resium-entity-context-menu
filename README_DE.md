# Entity Context Menu für React/Cesium

Ein leichtgewichtiges, typsicheres Kontextmenü-System für Resium/Cesium-Anwendungen. Vollständig über React Context gesteuert mit automatischer Cesium-Event-Behandlung.

## 🌐 Live Demo

- 🌍 [Website](https://resium-entitiy-context-menu-example.okotester.de/)

## ✨ Features

- 🎯 **Context-first Architecture** - Alles wird deklarativ über React Context gesteuert
- 🔧 **Automatische Cesium-Integration** - Event Handler werden automatisch auf dem Cesium-Canvas registriert
- 🎨 **Flexible Konfiguration** - Per-Entity Overrides, typ-basierte Factories
- ⚡ **Async Ready** - Unterstützt asynchrone Menü-Generierung mit Loading States
- ♿ **Vollständig zugänglich** - Tastaturnavigation, ARIA Roles, Focus Management
- 📦 **TypeScript Support** - Durchgehend typsicher
- 🚀 **Keine zusätzlichen Abhängigkeiten** - Nutzt React, Cesium und Resium (Peer Dependencies)

## 📦 Installation

```bash
npm install resium-entity-context-menu
# oder
yarn add resium-entity-context-menu
# oder
pnpm add resium-entity-context-menu
```

## 🚀 Quick Start

### 1. Styles Importieren

**Wichtig:** Importiere die CSS-Datei einmal im Einstiegspunkt deiner Anwendung:

```tsx
// src/main.tsx oder src/index.tsx
import 'resium-entity-context-menu/styles.css';
```

### 2. Provider und Komponente Einrichten

Die `EntityContextMenu`-Komponente **muss** innerhalb eines Resium `<Viewer>` platziert werden, da sie den `useCesium()`-Hook verwendet, um auf den Cesium Viewer zuzugreifen und automatisch Event Handler zu registrieren.

```tsx
import { Viewer } from 'resium';
import { EntityContextMenuProvider, EntityContextMenu } from 'resium-entity-context-menu';
import { Cartesian3 } from 'cesium';

function App() {
  // Standard-Factory für alle Entities
  const defaultFactory = (ctx) => [
    {
      id: 'info',
      label: 'Info anzeigen',
      onClick: () => console.log('Entity-Info:', ctx),
    },
  ];

  // Typ-spezifische Factories
  const factoriesByType = {
    city: (ctx) => [
      {
        id: 'fly',
        label: 'Hierhin fliegen',
        onClick: () => {
          // ctx.worldPosition ist für Cesium-Entities verfügbar
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
        {/* Deine Cesium-Entities hier */}

        {/* EntityContextMenu MUSS innerhalb des Viewers sein */}
        <EntityContextMenu />
      </Viewer>
    </EntityContextMenuProvider>
  );
}
```

### 3. Kontextmenü Auslösen

#### Option A: Verwendung der Resium Entity-Komponente

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
      entityType: 'city', // oder ein beliebiger benutzerdefinierter Typ
      position: new Cartesian2(movement.position.x, movement.position.y),
      worldPosition: target.id.position?._value || position,
      entityData: target.id,
      clickedAt: new Date().toISOString(),
    });
  };

  return <Entity position={position} name={name} onRightClick={handleRightClick} />;
}
```

#### Option B: Verwendung eines benutzerdefinierten Event Handlers

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

### 4. Per-Entity Menü Override

Entities können ihre eigene Menü-Factory bereitstellen (höchste Priorität):

```tsx
const berlinEntity = {
  id: 'berlin',
  type: 'city',
  name: 'Berlin',
  position: Cartesian3.fromDegrees(13.405, 52.52, 0),
  // Entity-spezifische Menü-Factory (höchste Priorität!)
  menuFactory: (ctx) => [
    {
      id: 'special',
      label: 'Berlin Spezial-Aktionen',
      type: 'submenu',
      items: [
        {
          id: 'wiki',
          label: 'Wikipedia öffnen',
          onClick: () => window.open('https://de.wikipedia.org/wiki/Berlin', '_blank'),
        },
        {
          id: 'weather',
          label: 'Wetter anzeigen',
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

## 🎯 Prioritätssystem

Die Menü-Auflösung folgt dieser Priorität:

1. **entity.menuFactory** - Entity-spezifisches Menü (höchste Priorität)
2. **factoriesByType[entityType]** - Typ-basiertes Menü
3. **defaultFactory** - Standard-Menü (niedrigste Priorität)

## 📝 API-Referenz

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
  position: Cartesian2; // Bildschirmkoordinaten
  worldPosition?: Cartesian3; // 3D-Weltposition (optional)
  entityData?: any; // Die Cesium-Entity oder benutzerdefinierte Daten
  clickedAt: string; // ISO-Zeitstempel
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
  items?: MenuItem[]; // für Untermenüs
  render?: (ctx: EntityContext) => React.ReactNode; // für benutzerdefinierte Items
  checked?: boolean; // für Toggle-Items
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

## 🔥 Erweiterte Features

### Asynchrone Menü-Generierung

```tsx
const cityFactory = async (ctx) => {
  // Daten von der API abrufen
  const cityData = await fetch(`/api/cities/${ctx.entityId}`).then((r) => r.json());

  return [
    {
      id: 'population',
      label: `Einwohner: ${cityData.population.toLocaleString('de-DE')}`,
      onClick: () => showCityDetails(cityData),
    },
    {
      id: 'area',
      label: `Fläche: ${cityData.area} km²`,
      onClick: () => showAreaInfo(cityData),
    },
  ];
};
```

### Bedingte Sichtbarkeit & Aktivierung

```tsx
const menuFactory = (ctx) => [
  {
    id: 'edit',
    label: 'Entity bearbeiten',
    // Nur für bearbeitbare Entities anzeigen
    visible: (ctx) => ctx.entityData?.editable === true,
    // Nur aktivieren, wenn nicht gesperrt
    enabled: (ctx) => !ctx.entityData?.locked,
    onClick: (ctx) => openEditor(ctx.entityId),
  },
  {
    id: 'delete',
    label: 'Löschen',
    visible: (ctx) => ctx.entityData?.canDelete,
    onClick: async (ctx) => {
      if (confirm('Diese Entity löschen?')) {
        await deleteEntity(ctx.entityId);
      }
    },
  },
];
```

### Verschachtelte Untermenüs

```tsx
const exportMenu = [
  {
    id: 'export',
    label: 'Exportieren',
    type: 'submenu',
    items: [
      {
        id: 'formats',
        label: 'Formate',
        type: 'submenu',
        items: [
          { id: 'json', label: 'JSON', onClick: () => exportAsJSON() },
          { id: 'csv', label: 'CSV', onClick: () => exportAsCSV() },
          { id: 'kml', label: 'KML', onClick: () => exportAsKML() },
        ],
      },
      { id: 'separator', type: 'separator' },
      { id: 'email', label: 'Per E-Mail senden', onClick: () => emailExport() },
    ],
  },
];
```

### Toggle-Items

```tsx
const viewMenu = [
  {
    id: 'show-label',
    label: 'Label anzeigen',
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

### Benutzerdefiniertes Rendering

```tsx
const customMenu = [
  {
    id: 'color-picker',
    type: 'custom',
    render: (ctx) => (
      <div style={{ padding: '8px' }}>
        <label>Entity-Farbe:</label>
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

### Trennlinien

```tsx
const menuWithSeparators = [
  { id: 'info', label: 'Info anzeigen', onClick: showInfo },
  { id: 'edit', label: 'Bearbeiten', onClick: edit },
  { id: 'sep1', type: 'separator' },
  { id: 'delete', label: 'Löschen', onClick: deleteEntity },
];
```

## ⌨️ Tastaturnavigation

Das Kontextmenü unterstützt vollständige Tastaturnavigation:

- **↑/↓** - Navigation zwischen Menüpunkten
- **→** - Untermenü öffnen / In Untermenü wechseln
- **←** - Untermenü schließen / Zum Elternmenü zurückkehren
- **Enter** oder **Leertaste** - Menüpunkt aktivieren
- **Escape** - Menü vollständig schließen

Der Fokus wird automatisch verwaltet und Menüpunkte sind korrekt für Screenreader fokussierbar.

## 🎨 Styling

### Erforderliche Styles Importieren

Importiere die Basis-Styles einmal im Einstiegspunkt deiner Anwendung:

```tsx
// src/main.tsx oder src/index.tsx
import 'resium-entity-context-menu/styles.css';
```

### Benutzerdefiniertes Styling

Du kannst das Aussehen mit CSS anpassen:

```tsx
<EntityContextMenu className="my-custom-menu" />
```

```css
/* Standard-Styles überschreiben */
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

### Verfügbare CSS-Klassen

- `.ecm-menu` - Hauptmenü-Container
- `.ecm-list` - Menüpunkte-Liste
- `.ecm-item` - Einzelner Menüpunkt
- `.ecm-item--enabled` - Aktivierter Punkt
- `.ecm-item--disabled` - Deaktivierter Punkt
- `.ecm-item--focused` - Fokussierter Punkt (Tastaturnavigation)
- `.ecm-item--toggle` - Toggle-Typ Punkt
- `.ecm-item--submenu` - Punkt mit Untermenü
- `.ecm-item__label` - Punkt-Label-Text
- `.ecm-item__submenu-indicator` - Untermenü-Pfeil
- `.ecm-separator` - Trennlinie
- `.ecm-submenu` - Untermenü-Container
- `.ecm-checkmark` - Häkchen für Toggle-Items
- `.ecm-loading` - Ladezustand
- `.ecm-empty` - Leeres Menü-Zustand

## 🧪 Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EntityContextMenuProvider,
  EntityContextMenu,
  useEntityContextMenu,
} from 'resium-entity-context-menu';
import { Cartesian2 } from 'cesium';

// Cesium/Resium mocken
jest.mock('resium', () => ({
  useCesium: () => ({
    viewer: {
      scene: {
        canvas: document.createElement('canvas'),
      },
    },
  }),
}));

test('zeigt Menü bei showMenu-Aufruf', () => {
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
        Menü öffnen
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

  fireEvent.click(screen.getByText('Menü öffnen'));
  expect(screen.getByText('Test Item')).toBeInTheDocument();
});
```

## 🔧 Vollständiges Cesium/Resium-Beispiel

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
      label: 'Zur Entity zoomen',
      onClick: () => console.log('Zoomen zu', ctx.entityId),
    },
  ];

  const cityFactory = (ctx) => [
    {
      id: 'info',
      label: `Info: ${ctx.entityData?.name}`,
      onClick: () => alert(`Stadt: ${ctx.entityData?.name}`),
    },
    {
      id: 'actions',
      label: 'Aktionen',
      type: 'submenu',
      items: [
        {
          id: 'fly',
          label: 'Hierhin fliegen',
          onClick: () => {
            // Viewer aus Kontext bei Bedarf zugreifen
            console.log('Flug zu', ctx.worldPosition);
          },
        },
        {
          id: 'highlight',
          label: 'Hervorheben',
          onClick: () => console.log('Hervorheben', ctx.entityId),
        },
      ],
    },
  ];

  return (
    <EntityContextMenuProvider
      defaultFactory={defaultFactory}
      factoriesByType={{ city: cityFactory }}
      onOpen={(ctx) => console.log('Menü geöffnet für:', ctx.entityId)}
      onClose={() => console.log('Menü geschlossen')}
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

## 📋 Anforderungen

- React 18+ (Hooks Support)
- Cesium 1.90+ (Peer Dependency)
- Resium 1.17+ (Peer Dependency)
- TypeScript 4.0+ (optional, aber empfohlen)

## ⚠️ Wichtige Hinweise

1. **EntityContextMenu muss innerhalb des Viewers sein**: Die Komponente verwendet den `useCesium()`-Hook und muss innerhalb einer Resium `<Viewer>`-Komponente gerendert werden.

2. **Automatische Event-Behandlung**: Die Komponente registriert automatisch Event Handler auf dem Cesium-Canvas. Eine manuelle Behandlung von Rechtsklicks auf Canvas-Ebene ist nicht erforderlich.

3. **Positionsformat**: Die `position` in `EntityContext` muss ein `Cartesian2` (Bildschirmkoordinaten) sein, nicht `Cartesian3`.

4. **Styles Importieren**: Vergiss nicht, `resium-entity-context-menu/styles.css` im Einstiegspunkt deiner Anwendung zu importieren.

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle gerne einen Pull Request.

## 📄 Lizenz

MIT

## 🙏 Credits

Entwickelt mit ❤️ für die React/Cesium-Community
