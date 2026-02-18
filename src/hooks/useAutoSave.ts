import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useSettingsStore } from '../store/settingsStore';
import { invoke } from '@tauri-apps/api/core';

export function useAutoSave() {
  const { tabs, activeTabId, markSaved } = useEditorStore();
  const { autoSave, autoSaveDelay } = useSettingsStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoSave) return;

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab || !activeTab.isModified) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        await invoke('write_file', {
          path: activeTab.path,
          contents: activeTab.content,
        });
        markSaved(activeTab.id);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, autoSaveDelay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [tabs, activeTabId, autoSave, autoSaveDelay, markSaved]);
}
