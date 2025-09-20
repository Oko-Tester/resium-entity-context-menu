# 🌍 Resium Entity Context Menu

A flexible and user-friendly React component for context menus in Cesium/Resium applications.

## ✨ Features

- 🖱️ **Multiple Activation Modes**: Right-click, left-click, hover, long press
- ⌨️ **Full Keyboard Navigation**: Arrow keys, Enter, Escape
- 🎨 **Customizable Styling**: CSS classes and inline styles
- 🔄 **Asynchronous Menu Items**: Supports both synchronous and asynchronous data sources
- 🎯 **Entity Integration**: Seamless integration with Cesium Entities
- 📱 **Touch Support**: Long-press for mobile devices
- ♿ **Accessible**: ARIA labels and focus management
- 🚪 **Portal Rendering**: Avoids z-index issues
- 🎭 **Custom Renderer**: Custom menu item rendering possible

## 📦 Installation

```bash
npm install resium-entity-context-menu
# or
pnpm add resium-entity-context-menu
# or
yarn add resium-entity-context-menu
```

## 🚀 Quick Start

```tsx
import React from 'react';
import ResiumEntityContextMenu from 'resium-entity-context-menu';
import type { MenuItem } from 'resium-entity-context-menu';

function MyComponent() {
  const getMenuItems = async (entity) => {
    return [
      { id: 'info', label: 'Information', icon: 'ℹ️' },
      { id: 'edit', label: 'Edit', icon: '✏️' },
      { id: 'sep1', separator: true },
      { id: 'delete', label: 'Delete', icon: '🗑️' },
    ];
  };

  const handleSelect = (item: MenuItem, entity) => {
    console.log('Selected:', item.label, entity);
  };

  return (
    <div>
      {/* Your Cesium/Resium Content */}
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

## 📖 API Reference

### Props

| Prop                  | Type                                                    | Default        | Description                         |
| --------------------- | ------------------------------------------------------- | -------------- | ----------------------------------- |
| `entity`              | `Entity \| string`                                      | -              | Cesium Entity or Entity ID          |
| `getMenuItems`        | `(entity?) => MenuItem[] \| Promise<MenuItem[]>`        | **Required**   | Function to load menu items         |
| `onSelect`            | `(item, entity?) => void \| Promise<void>`              | -              | Callback for item selection         |
| `renderMenuItem`      | `(item) => ReactNode`                                   | -              | Custom menu item renderer           |
| `openOn`              | `'rightClick' \| 'leftClick' \| 'hover' \| 'longPress'` | `'rightClick'` | Activation mode                     |
| `positionOffset`      | `{x: number, y: number}`                                | `{x: 4, y: 4}` | Menu position offset                |
| `portal`              | `boolean`                                               | `true`         | Enable portal rendering             |
| `closeOnOutsideClick` | `boolean`                                               | `true`         | Close on outside click              |
| `keyboardNavigation`  | `boolean`                                               | `true`         | Keyboard navigation                 |
| `className`           | `string`                                                | `''`           | CSS class for the menu              |
| `style`               | `CSSProperties`                                         | `{}`           | Inline styles                       |
| `disabled`            | `boolean`                                               | `false`        | Disable menu                        |
| `zIndex`              | `number`                                                | `3000`         | Z-index of the menu                 |
| `viewer`              | `Cesium.Viewer`                                         | `null`         | Cesium Viewer for entity projection |
| `hoverDelay`          | `number`                                                | `250`          | Hover delay (ms)                    |
| `longPressDuration`   | `number`                                                | `500`          | Long press duration (ms)            |

### MenuItem Interface

```tsx
interface MenuItem {
  id: string; // Unique ID
  label: string; // Display text
  icon?: React.ReactNode; // Optional: Icon
  disabled?: boolean; // Item disabled
  separator?: boolean; // Separator line
  meta?: any; // Additional data
}
```

## 🎯 Usage Examples

### Basic Setup

```tsx
import ResiumEntityContextMenu from 'resium-entity-context-menu';

const menuItems = [
  { id: 'zoom', label: 'Zoom In', icon: '🔍' },
  { id: 'info', label: 'Show Details', icon: 'ℹ️' },
  { id: 'sep1', separator: true },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'delete', label: 'Delete', icon: '🗑️', disabled: false },
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

### Asynchronous Menu Items

```tsx
const getAsyncMenuItems = async (entity) => {
  // API call or other asynchronous operations
  const permissions = await fetchUserPermissions(entity.id);

  return [
    { id: 'view', label: 'View', icon: '👁️' },
    ...(permissions.canEdit ? [{ id: 'edit', label: 'Edit', icon: '✏️' }] : []),
    ...(permissions.canDelete
      ? [
          { id: 'sep1', separator: true },
          { id: 'delete', label: 'Delete', icon: '🗑️' },
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
      label: 'Copy',
      icon: '📋',
      meta: { description: 'Copy to clipboard', shortcut: 'Ctrl+C' },
    },
  ]}
/>;
```

### Different Activation Modes

```tsx
// Hover activation
<ResiumEntityContextMenu
  openOn="hover"
  hoverDelay={300}
  entity={entity}
  getMenuItems={getMenuItems}
/>

// Long press for touch devices
<ResiumEntityContextMenu
  openOn="longPress"
  longPressDuration={800}
  entity={entity}
  getMenuItems={getMenuItems}
/>

// Left-click activation
<ResiumEntityContextMenu
  openOn="leftClick"
  entity={entity}
  getMenuItems={getMenuItems}
/>
```

### With Cesium Viewer Integration

```tsx
<ResiumEntityContextMenu
  entity={entity}
  viewer={cesiumViewer} // For precise entity positioning
  getMenuItems={getMenuItems}
  onSelect={(item, entity) => {
    if (item.id === 'center') {
      // Viewer can be used for entity operations
      cesiumViewer.camera.flyTo({ destination: entity.position });
    }
  }}
/>
```

## 🎨 Styling

### CSS Classes

```css
.resium-entity-contextmenu {
  /* Base menu styling */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
}

.resium-entity-contextmenu button {
  /* Menu item styling */
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

| Key       | Action                 |
| --------- | ---------------------- |
| `↑` / `↓` | Navigate between items |
| `Enter`   | Select item            |
| `Escape`  | Close menu             |
| `Home`    | Go to first item       |
| `End`     | Go to last item        |

## 🧪 Testing

```bash
# Run tests
pnpm test

# Tests with watch mode
pnpm test:watch

# Coverage report
pnpm test -- --coverage
```

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Create build
pnpm build

# Linting
pnpm lint

# Formatting
pnpm format
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Cesium](https://cesium.com/) for the 3D globe technology
- [Resium](https://github.com/reearth/resium) for React-Cesium integration
- [React](https://reactjs.org/) for the UI framework

## 📞 Support

- 🐛 [Issues](https://github.com/Oko-Tester/resium-entity-context-menu/issues)
- 💬 [Discussions](https://github.com/Oko-Tester/resium-entity-context-menu/discussions)
- 📧 Email: okotestproductions@gmail.com

---

Made with ❤️ by [Oko-Tester](https://github.com/Oko-Tester)
