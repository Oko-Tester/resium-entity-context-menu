import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ResiumEntityContextMenu from '../src/components/ResiumEntityContextMenu';
import type { MenuItem } from '../src/types';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

describe('ResiumEntityContextMenu', () => {
  const mockMenuItems: MenuItem[] = [
    { id: 'item1', label: 'Item 1', icon: '🔍' },
    {
      id: 'separator1',
      separator: true,
      label: '',
    },
    { id: 'item2', label: 'Item 2', disabled: true },
    { id: 'item3', label: 'Item 3' },
  ];

  const mockEntity = { id: 'test-entity', name: 'Test Entity' };
  const getMenuItems = vi.fn().mockResolvedValue(mockMenuItems);
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup any open menus
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });

  it('should render without crashing', () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
      />,
    );

    // Menu should not be visible initially
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should open menu on right click', async () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
        openOn="rightClick"
      />,
    );

    // Simulate right click
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    expect(getMenuItems).toHaveBeenCalledWith(mockEntity);
  });

  it('should open menu on left click when configured', async () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
        openOn="leftClick"
      />,
    );

    fireEvent.click(document, {
      clientX: 100,
      clientY: 200,
      button: 0,
    });

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('should render menu items correctly', async () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    // Check disabled item
    const disabledItem = screen.getByRole('menuitem', { name: /Item 2/ });
    expect(disabledItem).toBeDisabled();
  });

  it('should call onSelect when item is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Click on Item 1
    const item1 = screen.getByRole('menuitem', { name: /Item 1/ });
    await user.click(item1);

    expect(onSelect).toHaveBeenCalledWith(
      mockMenuItems[0], // Item 1
      mockEntity,
    );
  });

  it('should close menu when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <ResiumEntityContextMenu
          entity={mockEntity}
          getMenuItems={getMenuItems}
          onSelect={onSelect}
        />
        <div data-testid="outside">Outside element</div>
      </div>,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should close menu when pressing Escape', async () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation', async () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
        keyboardNavigation={true}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Test arrow down navigation
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    // Test Enter key
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalled();
  });

  it('should show loading state', async () => {
    const slowGetMenuItems = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve(mockMenuItems), 100)),
    );

    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={slowGetMenuItems}
        onSelect={onSelect}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    // Should show loading
    await waitFor(() => {
      expect(screen.getByText(/laden/i)).toBeInTheDocument();
    });

    // Should eventually show menu items
    await waitFor(
      () => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });

  it('should handle error state', async () => {
    const errorGetMenuItems = vi.fn().mockRejectedValue(new Error('Test error'));

    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={errorGetMenuItems}
        onSelect={onSelect}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText(/fehler/i)).toBeInTheDocument();
    });
  });

  it('should use custom menu item renderer', async () => {
    const customRenderer = vi.fn((item: MenuItem) => (
      <div data-testid={`custom-${item.id}`}>Custom: {item.label}</div>
    ));

    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
        renderMenuItem={customRenderer}
      />,
    );

    // Open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('custom-item1')).toBeInTheDocument();
      expect(screen.getByText('Custom: Item 1')).toBeInTheDocument();
    });

    expect(customRenderer).toHaveBeenCalledWith(mockMenuItems[0]);
  });

  it('should not open menu when disabled', () => {
    render(
      <ResiumEntityContextMenu
        entity={mockEntity}
        getMenuItems={getMenuItems}
        onSelect={onSelect}
        disabled={true}
      />,
    );

    // Try to open menu
    fireEvent.contextMenu(document, {
      clientX: 100,
      clientY: 200,
      preventDefault: vi.fn(),
    });

    // Menu should not open
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getMenuItems).not.toHaveBeenCalled();
  });
});
