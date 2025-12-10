import { Cartesian2 } from 'cesium';
import { PropsWithChildren } from 'react';

declare const EntityContextMenu: React.FC<{
    className?: string;
}>;

type EntityContext = {
    entityId: string;
    entityType?: string;
    position: Cartesian2;
    worldPosition?: any;
    entityData?: any;
    clickedAt: string;
};
type MenuItem = {
    id: string;
    label: string;
    icon?: React.ReactNode;
    type?: 'action' | 'submenu' | 'toggle' | 'separator' | 'custom';
    visible?: (ctx: EntityContext) => boolean;
    enabled?: (ctx: EntityContext) => boolean;
    onClick?: (ctx: EntityContext) => void | Promise<void>;
    items?: MenuItem[];
    render?: (ctx: EntityContext) => React.ReactNode;
    checked?: boolean;
};
type MenuFactory = (ctx: EntityContext) => MenuItem[] | Promise<MenuItem[]>;
type EntityContextMenuProviderProps = PropsWithChildren<{
    defaultFactory: MenuFactory;
    factoriesByType?: Record<string, MenuFactory>;
    onOpen?: (ctx: EntityContext) => void;
    onClose?: () => void;
    closeOnAction?: boolean;
}>;
type ContextMenuState = {
    isVisible: boolean;
    context?: EntityContext;
    menuItems?: MenuItem[];
    isLoading: boolean;
    showMenu: (ctx: EntityContext) => void;
    hideMenu: () => void;
};

declare const EntityContextMenuProvider: React.FC<EntityContextMenuProviderProps>;

declare function useEntityContextMenu(): ContextMenuState;

export { type ContextMenuState, type EntityContext, EntityContextMenu, EntityContextMenuProvider, type EntityContextMenuProviderProps, type MenuFactory, type MenuItem, useEntityContextMenu };
