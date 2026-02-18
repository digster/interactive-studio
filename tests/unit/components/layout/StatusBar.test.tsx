import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBar from '../../../../src/components/layout/StatusBar';
import { useEditorStore } from '../../../../src/store/editorStore';

describe('StatusBar', () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [], activeTabId: null });
  });

  it('should show "No file open" when no tab is active', () => {
    render(<StatusBar />);
    expect(screen.getByText('No file open')).toBeInTheDocument();
  });

  it('should show language and cursor position for active tab', () => {
    useEditorStore.setState({
      tabs: [
        {
          id: '/test.ts',
          name: 'test.ts',
          path: '/test.ts',
          language: 'typescript',
          content: '',
          savedContent: '',
          isModified: false,
          cursorPosition: { line: 10, col: 5 },
        },
      ],
      activeTabId: '/test.ts',
    });
    render(<StatusBar />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Ln 10, Col 5')).toBeInTheDocument();
  });

  it('should show UTF-8 encoding', () => {
    render(<StatusBar />);
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
  });
});
