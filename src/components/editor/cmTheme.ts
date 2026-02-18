import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Extension } from '@codemirror/state';

export function createLightTheme(): Extension {
  return EditorView.theme({
    '&': {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      height: '100%',
    },
    '.cm-content': {
      fontFamily: 'var(--font-mono)',
      caretColor: 'var(--accent)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--accent)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-muted)',
      borderRight: '1px solid var(--border)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      color: 'var(--text-secondary)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      color: 'var(--text-muted)',
    },
  });
}

export function createDarkTheme(): Extension[] {
  return [
    oneDark,
    EditorView.theme({
      '&': {
        height: '100%',
      },
      '.cm-content': {
        fontFamily: 'var(--font-mono)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
      },
    }),
  ];
}
