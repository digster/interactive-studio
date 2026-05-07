import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import CodeEditor from '../../../../src/components/editor/CodeEditor';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { useEditorStore } from '../../../../src/store/editorStore';

// Mock tauriFS to prevent Tauri invoke errors
vi.mock('../../../../src/lib/tauriFS', () => ({
  readFile: vi.fn().mockResolvedValue(''),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('CodeEditor', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render without crash', () => {
    const { container } = render(
      <CodeEditor content="hello world" language="javascript" tabId="/test.js" />,
    );
    expect(container.querySelector('[data-testid="code-editor"]')).toBeInTheDocument();
  });

  it('should mount a .cm-editor DOM element', () => {
    const { container } = render(
      <CodeEditor content="const x = 1;" language="typescript" tabId="/test.ts" />,
    );
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
  });

  it('should display content in the editor', () => {
    const content = 'function hello() { return "world"; }';
    const { container } = render(
      <CodeEditor content={content} language="javascript" tabId="/test.js" />,
    );
    const cmContent = container.querySelector('.cm-content');
    expect(cmContent?.textContent).toContain('function hello');
  });

  it('should apply syntax highlighting tokens', () => {
    // CodeMirror's defaultHighlightStyle emits generated short class names
    // (e.g. ͼ1) on <span> children inside .cm-line. We just assert that
    // tokenization produced child spans — confirming the highlighter is wired
    // up — without coupling to a specific class name that could change.
    const { container } = render(
      <CodeEditor content="const x = 1;" language="javascript" tabId="/test.js" />,
    );
    const lineSpans = container.querySelectorAll('.cm-line span');
    expect(lineSpans.length).toBeGreaterThan(0);
  });

  it('reconfigures tab size at runtime without tearing down the editor', () => {
    useEditorStore.setState({
      tabs: [
        {
          id: '/tabsize.js',
          name: 'tabsize.js',
          path: '/tabsize.js',
          language: 'javascript',
          content: '',
          savedContent: '',
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/tabsize.js',
    });

    act(() => useSettingsStore.getState().setTabSize(2));
    const { container, rerender } = render(
      <CodeEditor content="" language="javascript" tabId="/tabsize.js" />,
    );
    const editorBefore = container.querySelector('.cm-editor');
    expect(editorBefore).toBeInTheDocument();

    // Changing tabSize should reconfigure the existing view (compartments)
    // rather than recreate it. The DOM node identity must survive.
    act(() => useSettingsStore.getState().setTabSize(4));
    rerender(<CodeEditor content="" language="javascript" tabId="/tabsize.js" />);
    expect(container.querySelector('.cm-editor')).toBe(editorBefore);
  });

  it('should clean up on unmount', () => {
    const { container, unmount } = render(
      <CodeEditor content="test" language="javascript" tabId="/test.js" />,
    );
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
    unmount();
    expect(container.querySelector('.cm-editor')).not.toBeInTheDocument();
  });
});
