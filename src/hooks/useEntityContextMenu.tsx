import { useContext } from 'react';
import { ContextMenuContext } from '../contexts/ContextMenuProvider';

export function useEntityContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useEntityContextMenu must be used within EntityContextMenuProvider');
  }
  return context;
}
