import type { Entity } from 'cesium';
import React from 'react';

export type MenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  meta?: any;
};

export interface ResiumEntityContextMenuProps {
  entity?: Entity | string;
  getMenuItems: (entity?: Entity | string) => MenuItem[] | Promise<MenuItem[]>;
  renderMenuItem?: (item: MenuItem) => React.ReactNode;
  onSelect?: (item: MenuItem, entity?: Entity | string) => void | Promise<void>;
  openOn?: 'rightClick' | 'leftClick' | 'hover' | 'longPress';
  positionOffset?: { x: number; y: number };
  portal?: boolean;
  closeOnOutsideClick?: boolean;
  keyboardNavigation?: boolean;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  zIndex?: number;
}
