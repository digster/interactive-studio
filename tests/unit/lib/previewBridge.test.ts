import { describe, it, expect, beforeEach } from 'vitest';
import { handlePreviewMessage, BRIDGE_SCRIPT } from '../../../src/lib/previewBridge';
import { useExecutionStore } from '../../../src/store/executionStore';

function fakeEvent(data: unknown): MessageEvent {
  // We only read .data inside handlePreviewMessage, so a plain object is enough.
  return { data } as MessageEvent;
}

describe('previewBridge', () => {
  beforeEach(() => {
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
  });

  it('appends a console entry for a console envelope', () => {
    handlePreviewMessage(
      fakeEvent({
        __previewBridge: true,
        kind: 'console',
        level: 'log',
        content: 'hello world',
      }),
    );
    const entries = useExecutionStore.getState().consoleEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('log');
    expect(entries[0].content).toBe('hello world');
  });

  it('respects the level field (warn -> warn entry)', () => {
    handlePreviewMessage(
      fakeEvent({ __previewBridge: true, kind: 'console', level: 'warn', content: 'careful' }),
    );
    expect(useExecutionStore.getState().consoleEntries[0].type).toBe('warn');
  });

  it('records both a console error and a problem for an error envelope', () => {
    handlePreviewMessage(
      fakeEvent({
        __previewBridge: true,
        kind: 'error',
        message: 'Error: boom',
        file: '/abs/main.js',
        line: 12,
        column: 3,
      }),
    );
    const state = useExecutionStore.getState();
    expect(state.consoleEntries).toHaveLength(1);
    expect(state.consoleEntries[0].type).toBe('error');
    expect(state.consoleEntries[0].content).toBe('Error: boom');

    expect(state.problems).toHaveLength(1);
    expect(state.problems[0].severity).toBe('error');
    expect(state.problems[0].message).toBe('Error: boom');
    expect(state.problems[0].filePath).toBe('/abs/main.js');
    expect(state.problems[0].line).toBe(12);
    expect(state.problems[0].column).toBe(3);
  });

  it('handles unhandledrejection envelopes the same way as errors', () => {
    handlePreviewMessage(
      fakeEvent({
        __previewBridge: true,
        kind: 'unhandledrejection',
        message: 'Unhandled rejection: kaboom',
      }),
    );
    const state = useExecutionStore.getState();
    expect(state.consoleEntries).toHaveLength(1);
    expect(state.problems).toHaveLength(1);
  });

  it('ignores messages without the marker', () => {
    handlePreviewMessage(fakeEvent({ kind: 'console', level: 'log', content: 'pretender' }));
    handlePreviewMessage(fakeEvent('plain string'));
    handlePreviewMessage(fakeEvent(null));
    handlePreviewMessage(fakeEvent({ __previewBridge: false, kind: 'console' }));

    const state = useExecutionStore.getState();
    expect(state.consoleEntries).toHaveLength(0);
    expect(state.problems).toHaveLength(0);
  });

  it('exposes the bridge script with the install guard', () => {
    expect(BRIDGE_SCRIPT).toContain('__previewBridge_installed');
    // Sanity: must NOT contain a literal closing-script tag, otherwise it
    // would terminate its own <script> block when injected into HTML.
    expect(BRIDGE_SCRIPT).not.toContain('</script>');
  });
});
