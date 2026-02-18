import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../../../../src/lib/tauriFS', () => ({
  readFile: vi.fn(),
}));

import ConsolePanel from '../../../../src/components/console/ConsolePanel';
import { useExecutionStore } from '../../../../src/store/executionStore';
import { useUIStore } from '../../../../src/store/uiStore';

describe('ConsolePanel', () => {
  beforeEach(() => {
    useExecutionStore.setState({ consoleEntries: [], problems: [] });
    useUIStore.setState({ bottomPanelActiveTab: 'console' });
  });

  it('should show "No console output" when empty', () => {
    render(<ConsolePanel />);
    expect(screen.getByText('No console output')).toBeInTheDocument();
  });

  it('should show console entries', () => {
    useExecutionStore.setState({
      consoleEntries: [
        { id: '1', type: 'log', content: 'Hello world', timestamp: Date.now() },
        { id: '2', type: 'error', content: 'Something failed', timestamp: Date.now() },
      ],
    });
    render(<ConsolePanel />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('should show entry type prefixes', () => {
    useExecutionStore.setState({
      consoleEntries: [
        { id: '1', type: 'log', content: 'test log', timestamp: Date.now() },
        { id: '2', type: 'error', content: 'test error', timestamp: Date.now() },
        { id: '3', type: 'warn', content: 'test warn', timestamp: Date.now() },
      ],
    });
    render(<ConsolePanel />);
    expect(screen.getByText('[LOG]')).toBeInTheDocument();
    expect(screen.getByText('[ERR]')).toBeInTheDocument();
    expect(screen.getByText('[WRN]')).toBeInTheDocument();
  });

  it('should clear console when clear button is clicked', () => {
    useExecutionStore.setState({
      consoleEntries: [
        { id: '1', type: 'log', content: 'Hello', timestamp: Date.now() },
      ],
    });
    render(<ConsolePanel />);
    fireEvent.click(screen.getByLabelText('Clear console'));
    expect(useExecutionStore.getState().consoleEntries).toHaveLength(0);
  });

  it('should switch to Problems tab', () => {
    render(<ConsolePanel />);
    fireEvent.click(screen.getByText('Problems'));
    expect(useUIStore.getState().bottomPanelActiveTab).toBe('problems');
    expect(screen.getByText('No problems detected')).toBeInTheDocument();
  });

  it('should switch back to Console tab', () => {
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    fireEvent.click(screen.getByText('Console'));
    expect(useUIStore.getState().bottomPanelActiveTab).toBe('console');
  });

  // --- New tests for problems functionality ---

  it('should show problem count badge when problems exist', () => {
    useExecutionStore.setState({
      problems: [
        { id: '1', severity: 'error', message: 'Error 1' },
        { id: '2', severity: 'warning', message: 'Warning 1' },
        { id: '3', severity: 'error', message: 'Error 2' },
      ],
    });
    render(<ConsolePanel />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should not show problem count badge when problems is empty', () => {
    useExecutionStore.setState({ problems: [] });
    render(<ConsolePanel />);
    // The "Problems" tab text should be present but no badge number
    expect(screen.getByText('Problems')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show problems list when on problems tab', () => {
    useExecutionStore.setState({
      problems: [
        { id: '1', severity: 'error', message: 'Undefined variable x' },
        { id: '2', severity: 'warning', message: 'Unused import y', filePath: '/src/main.ts', line: 5 },
      ],
    });
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    expect(screen.getByText('Undefined variable x')).toBeInTheDocument();
    expect(screen.getByText('Unused import y')).toBeInTheDocument();
  });

  it('should clear problems when clear button is clicked on problems tab', () => {
    useExecutionStore.setState({
      problems: [
        { id: '1', severity: 'error', message: 'Some error' },
      ],
    });
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    fireEvent.click(screen.getByLabelText('Clear problems'));
    expect(useExecutionStore.getState().problems).toHaveLength(0);
  });

  it('should show problem severity icon and message for error', () => {
    useExecutionStore.setState({
      problems: [
        { id: '1', severity: 'error', message: 'Type mismatch' },
      ],
    });
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    expect(screen.getByText('Type mismatch')).toBeInTheDocument();
    // The row should have the error color class
    const problemButton = screen.getByText('Type mismatch').closest('button');
    expect(problemButton).toBeInTheDocument();
    expect(problemButton!.className).toContain('text-[var(--error)]');
  });

  it('should show problem severity icon and message for warning', () => {
    useExecutionStore.setState({
      problems: [
        { id: '1', severity: 'warning', message: 'Deprecated function' },
      ],
    });
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    expect(screen.getByText('Deprecated function')).toBeInTheDocument();
    const problemButton = screen.getByText('Deprecated function').closest('button');
    expect(problemButton).toBeInTheDocument();
    expect(problemButton!.className).toContain('text-[var(--warning)]');
  });

  it('should show file path and line info in problem row', () => {
    useExecutionStore.setState({
      problems: [
        { id: '1', severity: 'error', message: 'Syntax error', filePath: '/src/app.tsx', line: 42, column: 10 },
      ],
    });
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    expect(screen.getByText('Syntax error')).toBeInTheDocument();
    // File info should show filename:line:column
    expect(screen.getByText('app.tsx:42:10')).toBeInTheDocument();
  });

  it('should show "No problems detected" when problems tab is empty', () => {
    useUIStore.setState({ bottomPanelActiveTab: 'problems' });
    render(<ConsolePanel />);
    expect(screen.getByText('No problems detected')).toBeInTheDocument();
  });
});
