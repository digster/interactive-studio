import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../../../src/lib/tauriFS', () => ({
  readFile: vi.fn(),
}));

import { buildHtmlPreview } from '../../../src/lib/previewBuilder';
import { useEditorStore } from '../../../src/store/editorStore';
import { readFile } from '../../../src/lib/tauriFS';

describe('buildHtmlPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  it('should return empty string when no active tab', async () => {
    const result = await buildHtmlPreview('/projects/test');
    expect(result).toBe('');
  });

  it('should return empty string when active tab is not HTML and no HTML file exists', async () => {
    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/main.py',
          name: 'main.py',
          path: '/projects/test/main.py',
          language: 'python',
          content: 'print("hello")',
          savedContent: 'print("hello")',
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/main.py',
    });

    const result = await buildHtmlPreview('/projects/test');
    expect(result).toBe('');
  });

  it('should return HTML content with timestamp when active tab is HTML', async () => {
    const htmlContent = '<html><body><h1>Hello</h1></body></html>';
    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/index.html',
          name: 'index.html',
          path: '/projects/test/index.html',
          language: 'html',
          content: htmlContent,
          savedContent: htmlContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/index.html',
    });

    const result = await buildHtmlPreview('/projects/test');
    expect(result).toContain('<html><body><h1>Hello</h1></body></html>');
    expect(result).toMatch(/<!-- ts:\d+ -->/);
  });

  it('should skip external URLs (http://, https://, //)', async () => {
    const htmlContent = `<html>
<head>
  <link rel="stylesheet" href="https://cdn.example.com/style.css" />
  <link rel="stylesheet" href="http://cdn.example.com/other.css" />
  <link rel="stylesheet" href="//cdn.example.com/another.css" />
</head>
<body><h1>Test</h1></body>
</html>`;

    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/index.html',
          name: 'index.html',
          path: '/projects/test/index.html',
          language: 'html',
          content: htmlContent,
          savedContent: htmlContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/index.html',
    });

    const result = await buildHtmlPreview('/projects/test');
    // External links should remain as-is (not inlined)
    expect(result).toContain('href="https://cdn.example.com/style.css"');
    expect(result).toContain('href="http://cdn.example.com/other.css"');
    expect(result).toContain('href="//cdn.example.com/another.css"');
    // readFile should not have been called for external URLs
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should use tab content for linked CSS when available', async () => {
    const htmlContent = '<html><head><link rel="stylesheet" href="style.css" /></head><body></body></html>';
    const cssContent = 'body { color: red; }';

    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/index.html',
          name: 'index.html',
          path: '/projects/test/index.html',
          language: 'html',
          content: htmlContent,
          savedContent: htmlContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
        {
          id: '/projects/test/style.css',
          name: 'style.css',
          path: '/projects/test/style.css',
          language: 'css',
          content: cssContent,
          savedContent: cssContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/index.html',
    });

    const result = await buildHtmlPreview('/projects/test');
    expect(result).toContain('<style>/* style.css */');
    expect(result).toContain('body { color: red; }');
    expect(result).not.toContain('href="style.css"');
  });

  it('should use tab content for linked JS when available', async () => {
    const htmlContent = '<html><body><script src="app.js"></script></body></html>';
    const jsContent = 'console.log("hello");';

    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/index.html',
          name: 'index.html',
          path: '/projects/test/index.html',
          language: 'html',
          content: htmlContent,
          savedContent: htmlContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
        {
          id: '/projects/test/app.js',
          name: 'app.js',
          path: '/projects/test/app.js',
          language: 'javascript',
          content: jsContent,
          savedContent: jsContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/index.html',
    });

    const result = await buildHtmlPreview('/projects/test');
    expect(result).toContain('<script>/* app.js */');
    expect(result).toContain('console.log("hello");');
    expect(result).not.toContain('src="app.js"');
  });

  it('should fall back to readFile for linked assets not in tabs', async () => {
    const htmlContent = '<html><head><link rel="stylesheet" href="style.css" /></head><body></body></html>';
    vi.mocked(readFile).mockResolvedValue('body { background: blue; }');

    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/index.html',
          name: 'index.html',
          path: '/projects/test/index.html',
          language: 'html',
          content: htmlContent,
          savedContent: htmlContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/index.html',
    });

    const result = await buildHtmlPreview('/projects/test');
    expect(readFile).toHaveBeenCalledWith('/projects/test/style.css');
    expect(result).toContain('body { background: blue; }');
  });

  it('should find index.html when active tab is CSS', async () => {
    const htmlContent = '<html><head><link rel="stylesheet" href="style.css" /></head><body></body></html>';
    const cssContent = '.red { color: red; }';

    useEditorStore.setState({
      tabs: [
        {
          id: '/projects/test/index.html',
          name: 'index.html',
          path: '/projects/test/index.html',
          language: 'html',
          content: htmlContent,
          savedContent: htmlContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
        {
          id: '/projects/test/style.css',
          name: 'style.css',
          path: '/projects/test/style.css',
          language: 'css',
          content: cssContent,
          savedContent: cssContent,
          isModified: false,
          cursorPosition: { line: 1, col: 1 },
        },
      ],
      activeTabId: '/projects/test/style.css',
    });

    const result = await buildHtmlPreview('/projects/test');
    expect(result).toContain('<style>/* style.css */');
    expect(result).toContain('.red { color: red; }');
  });
});
