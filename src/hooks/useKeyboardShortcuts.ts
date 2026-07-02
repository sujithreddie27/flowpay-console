import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  /** If true, prevent default browser behavior */
  preventDefault?: boolean;
  /** Description for accessibility */
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs/textareas/contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      // Still allow Escape in inputs
      if (e.key !== 'Escape') return;
    }

    for (const shortcut of shortcutsRef.current) {
      const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
      const matchesModifier = ctrlOrMeta
        ? e.ctrlKey || e.metaKey
        : !e.ctrlKey && !e.metaKey;

      const matchesShift = shortcut.shift ? e.shiftKey : !shortcut.shift;
      const matchesAlt = shortcut.alt ? e.altKey : !shortcut.alt;
      const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (matchesKey && matchesModifier && matchesShift && matchesAlt) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
          e.stopPropagation();
        }
        shortcut.handler(e);
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
