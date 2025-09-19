import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { Entity, Viewer } from 'cesium';

type MenuItem$1 = {
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    separator?: boolean;
    meta?: any;
};
type PositionOffset$1 = {
    x: number;
    y: number;
};
interface ResiumEntityContextMenuProps$1 {
    entity?: Entity | string;
    getMenuItems: (entity?: Entity | string) => MenuItem$1[] | Promise<MenuItem$1[]>;
    renderMenuItem?: (item: MenuItem$1) => React.ReactNode;
    onSelect?: (item: MenuItem$1, entity?: Entity | string) => void | Promise<void>;
    openOn?: 'rightClick' | 'leftClick' | 'hover' | 'longPress';
    positionOffset?: PositionOffset$1;
    portal?: boolean;
    closeOnOutsideClick?: boolean;
    keyboardNavigation?: boolean;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    zIndex?: number;
    viewer?: Viewer | null;
    hoverDelay?: number;
    longPressDuration?: number;
}
declare function ResiumEntityContextMenu(props: ResiumEntityContextMenuProps$1): react_jsx_runtime.JSX.Element | null;

type MenuItem = {
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    separator?: boolean;
    meta?: any;
};
type PositionOffset = {
    x: number;
    y: number;
};
interface ResiumEntityContextMenuProps {
    entity?: Entity | string;
    getMenuItems: (entity?: Entity | string) => MenuItem[] | Promise<MenuItem[]>;
    renderMenuItem?: (item: MenuItem) => React.ReactNode;
    onSelect?: (item: MenuItem, entity?: Entity | string) => void | Promise<void>;
    openOn?: 'rightClick' | 'leftClick' | 'hover' | 'longPress';
    positionOffset?: PositionOffset;
    portal?: boolean;
    closeOnOutsideClick?: boolean;
    keyboardNavigation?: boolean;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    zIndex?: number;
    viewer?: Viewer | null;
    hoverDelay?: number;
    longPressDuration?: number;
}

export { type MenuItem, type PositionOffset, type ResiumEntityContextMenuProps, ResiumEntityContextMenu as default };
