import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCodeExecution } from '../../../src/hooks/useCodeExecution';
import { useEditorStore } from '../../../src/store/editorStore';
import { useWorkspaceStore } from '../../../src/store/workspaceStore';
import { useExecutionStore } from '../../../src/store/executionStore';
import { useUIStore } from '../../../src/store/uiStore';

vi.mock('../../../src/lib/tauriFS', () => ({
  writeFile: vi.fn(),
  runPython: vi.fn(),
  runPythonApp: vi.fn(),
  stopPythonApp: vi.fn(),
}));

import * as tauriFS from '../../../src/lib/tauriFS';

const mockedTauriFS = vi.mocked(tauriFS);

function seedPythonTab(content: string) {
  useEditorStore.setState({
    tabs: [
      {
        id: '/workspace/python-dash/app.py',
        name: 'app.py',
        path: '/workspace/python-dash/app.py',
        language: 'python',
        content,
        savedContent: content,
        isModified: false,
        cursorPosition: { line: 1, col: 1 },
      },
    ],
    activeTabId: '/workspace/python-dash/app.py',
  });

  useWorkspaceStore.setState({
    activeProject: {
      name: 'python-dash',
      path: '/workspace/python-dash',
    },
  });
}

describe('useCodeExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useEditorStore.setState({ tabs: [], activeTabId: null });
    useWorkspaceStore.setState({ activeProject: null, projects: [], fileTree: [] });
    useExecutionStore.setState({
      isRunning: false,
      consoleEntries: [],
      previewContent: '',
      previewType: 'none',
      previewUrl: null,
      previewRefreshKey: 0,
      lastError: null,
      problems: [],
      pythonOutput: '',
      pythonOutputReady: false,
      runningMode: null,
    });
    useUIStore.setState({
      isSidebarVisible: true,
      isBottomPanelVisible: false,
      isPreviewVisible: true,
      sidebarWidth: 280,
      bottomPanelHeight: 200,
      previewWidth: 400,
      bottomPanelActiveTab: 'console',
    });
  });

  it('starts Dash-like python files with runPythonApp', async () => {
    seedPythonTab('from dash import Dash\napp = Dash(__name__)\napp.run(debug=True)\n');

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.execute();
    });

    expect(mockedTauriFS.runPythonApp).toHaveBeenCalledWith(
      '/workspace/python-dash',
      'app.py',
      '127.0.0.1',
      8050,
    );
    expect(mockedTauriFS.runPython).not.toHaveBeenCalled();
    expect(useExecutionStore.getState().runningMode).toBe('app');
    expect(useExecutionStore.getState().isRunning).toBe(true);
  });

  it('starts regular python files with runPython', async () => {
    seedPythonTab('print("hello")\n');

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.execute();
    });

    expect(mockedTauriFS.runPython).toHaveBeenCalledWith('/workspace/python-dash', 'app.py');
    expect(mockedTauriFS.runPythonApp).not.toHaveBeenCalled();
    expect(useExecutionStore.getState().runningMode).toBe('script');
    expect(useExecutionStore.getState().isRunning).toBe(true);
  });

  it('stops an active python app via stopPythonApp', async () => {
    useExecutionStore.setState({ isRunning: true, runningMode: 'app' });

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.stop();
    });

    expect(mockedTauriFS.stopPythonApp).toHaveBeenCalledTimes(1);
  });
});
