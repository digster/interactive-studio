import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsolePanel from '../../../../src/components/console/ConsolePanel';
import { useExecutionStore } from '../../../../src/store/executionStore';
import { useUIStore } from '../../../../src/store/uiStore';

describe('ConsolePanel', () => {
  beforeEach(() => {
    useExecutionStore.setState({ consoleEntries: [] });
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
});
