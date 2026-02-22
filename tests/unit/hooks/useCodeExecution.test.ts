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

function seedPythonTab(
  content: string,
  options: {
    projectName?: string;
    fileName?: string;
    activeProjectName?: string;
    projects?: string[];
  } = {},
) {
  const projectName = options.projectName ?? 'python-dash';
  const fileName = options.fileName ?? 'app.py';
  const projectPath = `/workspace/${projectName}`;
  const filePath = `${projectPath}/${fileName}`;
  const activeProjectName = options.activeProjectName ?? projectName;
  const activeProjectPath = `/workspace/${activeProjectName}`;
  const projectNames = options.projects ?? [projectName];

  useEditorStore.setState({
    tabs: [
      {
        id: filePath,
        name: fileName,
        path: filePath,
        language: 'python',
        content,
        savedContent: content,
        isModified: false,
        cursorPosition: { line: 1, col: 1 },
      },
    ],
    activeTabId: filePath,
  });

  useWorkspaceStore.setState({
    activeProject: {
      name: activeProjectName,
      path: activeProjectPath,
    },
    projects: projectNames.map((name) => ({ name, path: `/workspace/${name}` })),
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

  it('starts FastAPI files with runPythonApp', async () => {
    seedPythonTab(
      [
        'from fastapi import FastAPI',
        'import uvicorn',
        '',
        'app = FastAPI()',
        '',
        '@app.get("/")',
        'def read_root():',
        '    return {"message": "hello"}',
        '',
        'if __name__ == "__main__":',
        '    uvicorn.run(app, host="127.0.0.1", port=8000)',
      ].join('\n'),
      { projectName: 'python-fastapi', fileName: 'main.py' },
    );

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.execute();
    });

    expect(mockedTauriFS.runPythonApp).toHaveBeenCalledWith(
      '/workspace/python-fastapi',
      'main.py',
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

  it('runs using the tab project when selected project is different', async () => {
    seedPythonTab('from dash import Dash\napp = Dash(__name__)\napp.run(debug=True)\n', {
      projectName: 'python-dash',
      fileName: 'app.py',
      activeProjectName: 'python-fastapi',
      projects: ['python-fastapi', 'python-dash'],
    });

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

  it('stops an active python app via stopPythonApp', async () => {
    useExecutionStore.setState({ isRunning: true, runningMode: 'app' });

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.stop();
    });

    expect(mockedTauriFS.stopPythonApp).toHaveBeenCalledTimes(1);
  });
});
