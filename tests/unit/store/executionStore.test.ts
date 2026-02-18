import { describe, it, expect, beforeEach } from 'vitest';
import { useExecutionStore } from '../../../src/store/executionStore';

describe('executionStore', () => {
  beforeEach(() => {
    useExecutionStore.setState({
      isRunning: false,
      consoleEntries: [],
      previewContent: '',
      previewType: 'none',
      previewRefreshKey: 0,
      lastError: null,
      problems: [],
      pythonOutput: '',
      pythonOutputReady: false,
    });
  });

  // --- Initial state ---

  it('should have previewRefreshKey=0 in initial state', () => {
    expect(useExecutionStore.getState().previewRefreshKey).toBe(0);
  });

  it('should have empty problems array in initial state', () => {
    expect(useExecutionStore.getState().problems).toEqual([]);
  });

  // --- requestRefresh ---

  it('should increment previewRefreshKey on requestRefresh', () => {
    useExecutionStore.getState().requestRefresh();
    expect(useExecutionStore.getState().previewRefreshKey).toBe(1);
    useExecutionStore.getState().requestRefresh();
    expect(useExecutionStore.getState().previewRefreshKey).toBe(2);
  });

  // --- addProblem ---

  it('should add a problem with all fields via addProblem', () => {
    useExecutionStore.getState().addProblem('error', 'Syntax error', '/src/main.ts', 10, 5);
    const { problems } = useExecutionStore.getState();
    expect(problems).toHaveLength(1);
    expect(problems[0].severity).toBe('error');
    expect(problems[0].message).toBe('Syntax error');
    expect(problems[0].filePath).toBe('/src/main.ts');
    expect(problems[0].line).toBe(10);
    expect(problems[0].column).toBe(5);
    expect(problems[0].id).toBeTruthy();
  });

  it('should add a problem with only required fields', () => {
    useExecutionStore.getState().addProblem('warning', 'Unused variable');
    const { problems } = useExecutionStore.getState();
    expect(problems).toHaveLength(1);
    expect(problems[0].severity).toBe('warning');
    expect(problems[0].message).toBe('Unused variable');
    expect(problems[0].filePath).toBeUndefined();
    expect(problems[0].line).toBeUndefined();
    expect(problems[0].column).toBeUndefined();
  });

  it('should accumulate multiple problems', () => {
    useExecutionStore.getState().addProblem('error', 'Error 1');
    useExecutionStore.getState().addProblem('warning', 'Warning 1');
    useExecutionStore.getState().addProblem('error', 'Error 2');
    expect(useExecutionStore.getState().problems).toHaveLength(3);
  });

  // --- clearProblems ---

  it('should reset problems to empty array on clearProblems', () => {
    useExecutionStore.getState().addProblem('error', 'Problem 1');
    useExecutionStore.getState().addProblem('warning', 'Problem 2');
    expect(useExecutionStore.getState().problems).toHaveLength(2);

    useExecutionStore.getState().clearProblems();
    expect(useExecutionStore.getState().problems).toEqual([]);
  });

  // --- setError ---

  it('should set lastError and push a problem when error is non-null', () => {
    useExecutionStore.getState().setError('Runtime error occurred');
    const state = useExecutionStore.getState();
    expect(state.lastError).toBe('Runtime error occurred');
    expect(state.problems).toHaveLength(1);
    expect(state.problems[0].severity).toBe('error');
    expect(state.problems[0].message).toBe('Runtime error occurred');
  });

  it('should clear lastError but not affect problems when error is null', () => {
    useExecutionStore.getState().setError('Some error');
    expect(useExecutionStore.getState().problems).toHaveLength(1);

    useExecutionStore.getState().setError(null);
    const state = useExecutionStore.getState();
    expect(state.lastError).toBeNull();
    expect(state.problems).toHaveLength(1); // problems remain
  });

  // --- Existing console/preview state ---

  it('should set running state', () => {
    useExecutionStore.getState().setRunning(true);
    expect(useExecutionStore.getState().isRunning).toBe(true);
    useExecutionStore.getState().setRunning(false);
    expect(useExecutionStore.getState().isRunning).toBe(false);
  });

  it('should add console entries', () => {
    useExecutionStore.getState().addConsoleEntry('log', 'Hello');
    const { consoleEntries } = useExecutionStore.getState();
    expect(consoleEntries).toHaveLength(1);
    expect(consoleEntries[0].type).toBe('log');
    expect(consoleEntries[0].content).toBe('Hello');
    expect(consoleEntries[0].timestamp).toBeTruthy();
    expect(consoleEntries[0].id).toBeTruthy();
  });

  it('should clear console entries', () => {
    useExecutionStore.getState().addConsoleEntry('log', 'test');
    useExecutionStore.getState().clearConsole();
    expect(useExecutionStore.getState().consoleEntries).toEqual([]);
  });

  it('should set preview content and type', () => {
    useExecutionStore.getState().setPreview('<h1>Hi</h1>', 'html');
    const state = useExecutionStore.getState();
    expect(state.previewContent).toBe('<h1>Hi</h1>');
    expect(state.previewType).toBe('html');
  });

  it('should clear preview', () => {
    useExecutionStore.getState().setPreview('<p>test</p>', 'html');
    useExecutionStore.getState().clearPreview();
    const state = useExecutionStore.getState();
    expect(state.previewContent).toBe('');
    expect(state.previewType).toBe('none');
  });

  // --- Python output ---

  it('should have empty pythonOutput in initial state', () => {
    expect(useExecutionStore.getState().pythonOutput).toBe('');
    expect(useExecutionStore.getState().pythonOutputReady).toBe(false);
  });

  it('should append to pythonOutput via appendPythonOutput', () => {
    useExecutionStore.getState().appendPythonOutput('Hello ');
    useExecutionStore.getState().appendPythonOutput('World\n');
    expect(useExecutionStore.getState().pythonOutput).toBe('Hello World\n');
  });

  it('should clear pythonOutput and reset pythonOutputReady', () => {
    useExecutionStore.getState().appendPythonOutput('data');
    useExecutionStore.getState().setPythonOutputReady(true);

    useExecutionStore.getState().clearPythonOutput();
    const state = useExecutionStore.getState();
    expect(state.pythonOutput).toBe('');
    expect(state.pythonOutputReady).toBe(false);
  });

  it('should set pythonOutputReady via setPythonOutputReady', () => {
    useExecutionStore.getState().setPythonOutputReady(true);
    expect(useExecutionStore.getState().pythonOutputReady).toBe(true);

    useExecutionStore.getState().setPythonOutputReady(false);
    expect(useExecutionStore.getState().pythonOutputReady).toBe(false);
  });
});
