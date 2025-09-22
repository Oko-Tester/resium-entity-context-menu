import { createContext, useState, useCallback } from 'react';
import {
  ContextMenuState,
  EntityContext,
  MenuFactory,
  MenuItem,
  ResiumEntityContextMenuProviderProps,
} from '../types';

export const ContextMenuContext = createContext<ContextMenuState | null>(null);

export const ResiumEntityContextMenuProvider: React.FC<ResiumEntityContextMenuProviderProps> = ({
  children,
  defaultFactory,
  factoriesByType = {},
  onOpen,
  onClose,
  closeOnAction = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [context, setContext] = useState<EntityContext | undefined>();
  const [menuItems, setMenuItems] = useState<MenuItem[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const resolveFactory = useCallback(
    (ctx: EntityContext): MenuFactory => {
      if (ctx.entityData?.menuFactory && typeof ctx.entityData.menuFactory === 'function') {
        return ctx.entityData.menuFactory;
      }
      if (ctx.entityType && factoriesByType[ctx.entityType]) {
        return factoriesByType[ctx.entityType];
      }
      return defaultFactory;
    },
    [defaultFactory, factoriesByType],
  );

  const showMenu = useCallback(
    async (ctx: EntityContext) => {
      setContext(ctx);
      setIsVisible(true);
      setIsLoading(true);
      setMenuItems(undefined);

      onOpen?.(ctx);

      try {
        const factory = resolveFactory(ctx);
        const items = await factory(ctx);
        setMenuItems(items);
      } catch (error) {
        console.error('Failed to resolve menu items:', error);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [resolveFactory, onOpen],
  );

  const hideMenu = useCallback(() => {
    setIsVisible(false);
    setContext(undefined);
    setMenuItems(undefined);
    setIsLoading(false);
    onClose?.();
  }, [onClose]);

  const value: ContextMenuState = {
    isVisible,
    context,
    menuItems,
    isLoading,
    showMenu,
    hideMenu,
  };

  return <ContextMenuContext.Provider value={value}>{children}</ContextMenuContext.Provider>;
};
