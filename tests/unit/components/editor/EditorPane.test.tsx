import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EditorPane from '../../../../src/components/editor/EditorPane';
import { useEditorStore } from '../../../../src/store/editorStore';
import { useExecutionStore } from '../../../../src/store/executionStore';

// Mock CodeEditor to avoid CodeMirror DOM issues in jsdom
vi.mock('../../../../src/components/editor/CodeEditor', () => ({
  default: ({ content, language, tabId }: { content: string; language: string; tabId: string }) => (
    <div data-testid="mock-code-editor" data-language={language} data-tab-id={tabId}>
      {content}
    </div>
  ),
}));

describe('EditorPane', () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [], activeTabId: null });
    useExecutionStore.setState({ isRunning: false, runningMode: null });
  });

  it('should show empty state when no tabs are open', () => {
    render(<EditorPane />);
    expect(screen.getByText('Open a file to start editing')).toBeInTheDocument();
  });

  it('should render CodeEditor when a tab is active', () => {
    useEditorStore.setState({
      tabs: [
        {
          id: '/hello.py',
          name: 'hello.py',
          path: '/hello.py',
          language: 'python',
          content: 'print("hello")',
          savedContent: 'print("hello")',
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/hello.py',
    });
    render(<EditorPane />);
    const editor = screen.getByTestId('mock-code-editor');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('data-language', 'python');
    expect(editor).toHaveTextContent('print("hello")');
  });

  it('should show Stop button when python app mode is running', () => {
    useEditorStore.setState({
      tabs: [
        {
          id: '/app.py',
          name: 'app.py',
          path: '/app.py',
          language: 'python',
          content: 'from dash import Dash',
          savedContent: 'from dash import Dash',
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/app.py',
    });
    useExecutionStore.setState({ isRunning: true, runningMode: 'app' });

    render(<EditorPane />);
    expect(screen.getByLabelText('Stop app')).toBeInTheDocument();
  });
});
