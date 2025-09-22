export type EntityContext = {
  entityId: string;
  entityType?: string;
  position: { x: number; y: number };
  worldPosition?: any;
  entityData?: any;
  clickedAt: string;
};

export type MenuItem = {
  id: string;
  label: string;
  type?: 'action' | 'submenu' | 'toggle' | 'separator' | 'custom';
  visible?: (ctx: EntityContext) => boolean;
  enabled?: (ctx: EntityContext) => boolean;
  onClick?: (ctx: EntityContext) => void | Promise<void>;
  items?: MenuItem[];
  render?: (ctx: EntityContext) => React.ReactNode;
  checked?: boolean;
};

export type MenuFactory = (ctx: EntityContext) => MenuItem[] | Promise<MenuItem[]>;

export type ResiumEntityContextMenuProviderProps = {
  children: React.ReactNode;
  defaultFactory: MenuFactory;
  factoriesByType?: Record<string, MenuFactory>;
  onOpen?: (ctx: EntityContext) => void;
  onClose?: () => void;
  closeOnAction?: boolean;
};

export type ContextMenuState = {
  isVisible: boolean;
  context?: EntityContext;
  menuItems?: MenuItem[];
  isLoading: boolean;
  showMenu: (ctx: EntityContext) => void;
  hideMenu: () => void;
};
