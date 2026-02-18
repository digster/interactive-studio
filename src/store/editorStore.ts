import { create } from 'zustand';

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  savedContent: string;
  isModified: boolean;
  cursorPosition: { line: number; col: number };
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;

  openFile: (path: string, name: string, content: string, language: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
  updateCursorPosition: (id: string, line: number, col: number) => void;
  getActiveTab: () => EditorTab | undefined;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  openFile: (path, name, content, language) => {
    const { tabs } = get();
    const existing = tabs.find((tab) => tab.id === path);

    if (existing) {
      set({ activeTabId: path });
      return;
    }

    const newTab: EditorTab = {
      id: path,
      name,
      path,
      language,
      content,
      savedContent: content,
      isModified: false,
      cursorPosition: { line: 1, col: 1 },
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: path,
    }));
  },

  closeTab: (id) =>
    set((state) => {
      const index = state.tabs.findIndex((tab) => tab.id === id);
      const nextTabs = state.tabs.filter((tab) => tab.id !== id);

      let nextActiveId = state.activeTabId;
      if (state.activeTabId === id) {
        if (nextTabs.length === 0) {
          nextActiveId = null;
        } else if (index >= nextTabs.length) {
          nextActiveId = nextTabs[nextTabs.length - 1].id;
        } else {
          nextActiveId = nextTabs[index].id;
        }
      }

      return { tabs: nextTabs, activeTabId: nextActiveId };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? { ...tab, content, isModified: content !== tab.savedContent }
          : tab,
      ),
    })),

  markSaved: (id) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? { ...tab, savedContent: tab.content, isModified: false }
          : tab,
      ),
    })),

  updateCursorPosition: (id, line, col) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, cursorPosition: { line, col } } : tab,
      ),
    })),

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((tab) => tab.id === activeTabId);
  },

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex < 0 ||
        fromIndex >= state.tabs.length ||
        toIndex < 0 ||
        toIndex >= state.tabs.length ||
        fromIndex === toIndex
      ) {
        return state;
      }

      const nextTabs = [...state.tabs];
      const [moved] = nextTabs.splice(fromIndex, 1);
      nextTabs.splice(toIndex, 0, moved);

      return { tabs: nextTabs };
    }),
}));
