import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

interface ShortcutHandler {
  key: string;
  meta?: boolean;
  shift?: boolean;
  ctrl?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          metaMatch &&
          shiftMatch &&
          ctrlMatch
        ) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  const { toggleSidebar, toggleBottomPanel, togglePreview } = useUIStore();

  useKeyboardShortcuts([
    {
      key: 'b',
      meta: true,
      handler: () => toggleSidebar(),
    },
    {
      key: 'j',
      meta: true,
      handler: () => toggleBottomPanel(),
    },
    {
      key: '\\',
      meta: true,
      handler: () => togglePreview(),
    },
  ]);
}
