import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../../../../src/components/editor/TabBar';
import { useEditorStore } from '../../../../src/store/editorStore';

function createTab(id: string, name: string, language = 'typescript', isModified = false) {
  return {
    id,
    name,
    path: id,
    language,
    content: '',
    savedContent: '',
    isModified,
    cursorPosition: { line: 1, col: 1 },
  };
}

describe('TabBar', () => {
  beforeEach(() => {
    useEditorStore.setState({ tabs: [], activeTabId: null });
  });

  it('should render tabs', () => {
    useEditorStore.setState({
      tabs: [createTab('/a.ts', 'a.ts'), createTab('/b.ts', 'b.ts')],
      activeTabId: '/a.ts',
    });
    render(<TabBar />);
    expect(screen.getByText('a.ts')).toBeInTheDocument();
    expect(screen.getByText('b.ts')).toBeInTheDocument();
  });

  it('should indicate the active tab', () => {
    useEditorStore.setState({
      tabs: [createTab('/a.ts', 'a.ts'), createTab('/b.ts', 'b.ts')],
      activeTabId: '/a.ts',
    });
    render(<TabBar />);
    const activeTab = screen.getByText('a.ts').closest('[role="tab"]');
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    const inactiveTab = screen.getByText('b.ts').closest('[role="tab"]');
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should switch active tab on click', () => {
    useEditorStore.setState({
      tabs: [createTab('/a.ts', 'a.ts'), createTab('/b.ts', 'b.ts')],
      activeTabId: '/a.ts',
    });
    render(<TabBar />);
    fireEvent.click(screen.getByText('b.ts'));
    expect(useEditorStore.getState().activeTabId).toBe('/b.ts');
  });

  it('should close a tab via the close button', () => {
    useEditorStore.setState({
      tabs: [createTab('/a.ts', 'a.ts'), createTab('/b.ts', 'b.ts')],
      activeTabId: '/a.ts',
    });
    render(<TabBar />);
    const closeBtn = screen.getByLabelText('Close a.ts');
    fireEvent.click(closeBtn);
    expect(useEditorStore.getState().tabs).toHaveLength(1);
    expect(useEditorStore.getState().tabs[0].id).toBe('/b.ts');
  });

  it('should show modified indicator for unsaved tabs', () => {
    useEditorStore.setState({
      tabs: [createTab('/a.ts', 'a.ts', 'typescript', true)],
      activeTabId: '/a.ts',
    });
    const { container } = render(<TabBar />);
    // The modified indicator is a small dot
    const dot = container.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });
});
