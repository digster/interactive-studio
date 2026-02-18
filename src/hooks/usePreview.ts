import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useExecutionStore } from '../store/executionStore';
import { getPreviewType } from '../lib/languageDetect';
import { buildHtmlPreview } from '../lib/previewBuilder';

export function usePreview() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeProject = useWorkspaceStore((s) => s.activeProject);
  const previewRefreshKey = useExecutionStore((s) => s.previewRefreshKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !activeProject) {
      useExecutionStore.getState().clearPreview();
      return;
    }

    const pvType = getPreviewType(activeTab.language);
    if (pvType === 'none') {
      useExecutionStore.getState().clearPreview();
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        if (pvType === 'html') {
          const html = await buildHtmlPreview(activeProject.path);
          if (html) {
            useExecutionStore.getState().setPreview(html, 'html');
          }
        } else {
          // For markdown, svg, json, mermaid — use raw content
          useExecutionStore.getState().setPreview(activeTab.content, pvType);
        }
      } catch (err) {
        console.error('Preview build failed:', err);
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [tabs, activeTabId, activeProject, previewRefreshKey]);
}
