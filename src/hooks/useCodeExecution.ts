import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useExecutionStore } from '../store/executionStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useUIStore } from '../store/uiStore';
import * as tauriFS from '../lib/tauriFS';
import { getPreviewType } from '../lib/languageDetect';
import { isTauriRuntime } from '../lib/runtime';

const TRACEBACK_RE = /File "(.+)", line (\d+)/;

function parseTraceback(text: string): { filePath: string; line: number } | null {
  const match = TRACEBACK_RE.exec(text);
  if (!match) return null;
  return { filePath: match[1], line: parseInt(match[2], 10) };
}

export function useCodeExecution() {
  const unlistenersRef = useRef<(() => void)[]>([]);

  // Set up Tauri event listeners for Python output/exit
  useEffect(() => {
    if (!isTauriRuntime()) return;

    async function setupListeners() {
      const { listen } = await import('@tauri-apps/api/event');

      const unlistenOutput = await listen<{ stream: string; data: string }>(
        'python-output',
        (event) => {
          const { stream, data } = event.payload;
          const store = useExecutionStore.getState();

          if (stream === 'stderr') {
            store.addConsoleEntry('error', data);
            const parsed = parseTraceback(data);
            store.addProblem('error', data, parsed?.filePath, parsed?.line);
          } else {
            store.addConsoleEntry('log', data);
            store.appendPythonOutput(data);
          }
        },
      );

      const unlistenExit = await listen<{ code: number | null; success: boolean }>(
        'python-exit',
        (event) => {
          const { code, success } = event.payload;
          const store = useExecutionStore.getState();

          store.setRunning(false);
          store.setPythonOutputReady(true);

          if (success) {
            store.addConsoleEntry('result', `Process exited with code ${code ?? 0}`);
          } else {
            store.addConsoleEntry('error', `Process exited with code ${code ?? 1}`);
          }
        },
      );

      unlistenersRef.current = [unlistenOutput, unlistenExit];
    }

    setupListeners();

    return () => {
      for (const unlisten of unlistenersRef.current) {
        unlisten();
      }
      unlistenersRef.current = [];
    };
  }, []);

  const execute = useCallback(async () => {
    const { tabs, activeTabId } = useEditorStore.getState();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    const activeProject = useWorkspaceStore.getState().activeProject;
    if (!activeProject) return;

    const pvType = getPreviewType(activeTab.language);

    // For web languages, just refresh the preview
    if (pvType === 'html' && activeTab.language !== 'python') {
      useExecutionStore.getState().requestRefresh();
      return;
    }

    // For Python, run via Tauri backend
    if (activeTab.language === 'python') {
      const { clearConsole, clearProblems, setRunning, addConsoleEntry, clearPythonOutput, setPreview } =
        useExecutionStore.getState();

      // Save file first
      if (activeTab.isModified) {
        try {
          await tauriFS.writeFile(activeTab.path, activeTab.content);
          useEditorStore.getState().markSaved(activeTab.id);
        } catch (err) {
          addConsoleEntry('error', `Failed to save before running: ${err}`);
          return;
        }
      }

      clearConsole();
      clearProblems();
      clearPythonOutput();
      setPreview('', 'python');

      // Auto-open console panel
      useUIStore.getState().setBottomPanelVisible(true);
      useUIStore.getState().setBottomPanelActiveTab('console');

      setRunning(true);
      addConsoleEntry('info', `Running ${activeTab.name}...`);

      try {
        await tauriFS.runPython(activeProject.path, activeTab.name);
      } catch (err) {
        setRunning(false);
        addConsoleEntry('error', `Failed to start: ${err}`);
      }
    }
  }, []);

  return { execute };
}
