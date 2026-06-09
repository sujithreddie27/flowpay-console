import { useState, useCallback } from 'react';

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), []);

  return { isOpen, isCollapsed, open, close, toggle, toggleCollapse };
}
