import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { useSettingsStore } from '../../store/settingsStore';
import { useEditorStore } from '../../store/editorStore';
import { getLanguageExtension } from './cmLanguages';
import { createLightTheme, createDarkTheme } from './cmTheme';

interface CodeEditorProps {
  content: string;
  language: string;
  tabId: string;
}

export default function CodeEditor({ content, language, tabId }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const languageCompartment = useRef(new Compartment());
  const tabSizeCompartment = useRef(new Compartment());
  const wordWrapCompartment = useRef(new Compartment());
  const fontSizeCompartment = useRef(new Compartment());

  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const tabSize = useSettingsStore((s) => s.tabSize);
  const wordWrap = useSettingsStore((s) => s.wordWrap);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const settings = useSettingsStore.getState();

    const langExt = getLanguageExtension(language);
    const themeExt = settings.resolvedTheme === 'dark' ? createDarkTheme() : createLightTheme();

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const doc = update.state.doc.toString();
        useEditorStore.getState().updateContent(tabId, doc);
      }

      if (update.selectionSet) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        useEditorStore.getState().updateCursorPosition(
          tabId,
          line.number,
          pos - line.from + 1,
        );
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          ...foldKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        themeCompartment.current.of(themeExt),
        languageCompartment.current.of(langExt ?? []),
        tabSizeCompartment.current.of(EditorState.tabSize.of(settings.tabSize)),
        wordWrapCompartment.current.of(settings.wordWrap ? EditorView.lineWrapping : []),
        fontSizeCompartment.current.of(
          EditorView.theme({ '.cm-content': { fontSize: `${settings.fontSize}px` }, '.cm-gutters': { fontSize: `${settings.fontSize}px` } }),
        ),
        updateListener,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Intentionally only depends on tabId — editor is rebuilt per tab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  // Reconfigure theme when it changes
  useEffect(() => {
    if (!viewRef.current) return;
    const themeExt = resolvedTheme === 'dark' ? createDarkTheme() : createLightTheme();
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(themeExt),
    });
  }, [resolvedTheme]);

  // Reconfigure font size when it changes
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: fontSizeCompartment.current.reconfigure(
        EditorView.theme({ '.cm-content': { fontSize: `${fontSize}px` }, '.cm-gutters': { fontSize: `${fontSize}px` } }),
      ),
    });
  }, [fontSize]);

  // Reconfigure tab size when it changes
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: tabSizeCompartment.current.reconfigure(EditorState.tabSize.of(tabSize)),
    });
  }, [tabSize]);

  // Reconfigure word wrap when it changes
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: wordWrapCompartment.current.reconfigure(wordWrap ? EditorView.lineWrapping : []),
    });
  }, [wordWrap]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden" data-testid="code-editor" />
  );
}
