import { create } from 'zustand';

export type ConsoleEntryType = 'log' | 'warn' | 'error' | 'info' | 'result';

export interface ConsoleEntry {
  id: string;
  type: ConsoleEntryType;
  content: string;
  timestamp: number;
}

export type PreviewType = 'html' | 'markdown' | 'mermaid' | 'svg' | 'json' | 'none';

export interface ExecutionState {
  isRunning: boolean;
  consoleEntries: ConsoleEntry[];
  previewContent: string;
  previewType: PreviewType;
  lastError: string | null;

  setRunning: (running: boolean) => void;
  addConsoleEntry: (type: ConsoleEntryType, content: string) => void;
  clearConsole: () => void;
  setPreview: (content: string, type: PreviewType) => void;
  clearPreview: () => void;
  setError: (error: string | null) => void;
}

export const useExecutionStore = create<ExecutionState>()((set) => ({
  isRunning: false,
  consoleEntries: [],
  previewContent: '',
  previewType: 'none',
  lastError: null,

  setRunning: (running) => set({ isRunning: running }),

  addConsoleEntry: (type, content) =>
    set((state) => ({
      consoleEntries: [
        ...state.consoleEntries,
        {
          id: crypto.randomUUID(),
          type,
          content,
          timestamp: Date.now(),
        },
      ],
    })),

  clearConsole: () => set({ consoleEntries: [] }),

  setPreview: (content, type) =>
    set({ previewContent: content, previewType: type }),

  clearPreview: () => set({ previewContent: '', previewType: 'none' }),

  setError: (error) => set({ lastError: error }),
}));
