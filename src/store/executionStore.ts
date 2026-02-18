import { create } from 'zustand';

export type ConsoleEntryType = 'log' | 'warn' | 'error' | 'info' | 'result';

export interface ConsoleEntry {
  id: string;
  type: ConsoleEntryType;
  content: string;
  timestamp: number;
}

export type PreviewType = 'html' | 'markdown' | 'mermaid' | 'svg' | 'json' | 'none';

export type ProblemSeverity = 'error' | 'warning';

export interface Problem {
  id: string;
  severity: ProblemSeverity;
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
}

export interface ExecutionState {
  isRunning: boolean;
  consoleEntries: ConsoleEntry[];
  previewContent: string;
  previewType: PreviewType;
  previewRefreshKey: number;
  lastError: string | null;
  problems: Problem[];

  setRunning: (running: boolean) => void;
  addConsoleEntry: (type: ConsoleEntryType, content: string) => void;
  clearConsole: () => void;
  setPreview: (content: string, type: PreviewType) => void;
  clearPreview: () => void;
  setError: (error: string | null) => void;
  requestRefresh: () => void;
  addProblem: (severity: ProblemSeverity, message: string, filePath?: string, line?: number, column?: number) => void;
  clearProblems: () => void;
}

export const useExecutionStore = create<ExecutionState>()((set) => ({
  isRunning: false,
  consoleEntries: [],
  previewContent: '',
  previewType: 'none',
  previewRefreshKey: 0,
  lastError: null,
  problems: [],

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

  setError: (error) =>
    set((state) => {
      if (!error) return { lastError: null };
      return {
        lastError: error,
        problems: [
          ...state.problems,
          {
            id: crypto.randomUUID(),
            severity: 'error',
            message: error,
          },
        ],
      };
    }),

  requestRefresh: () =>
    set((state) => ({ previewRefreshKey: state.previewRefreshKey + 1 })),

  addProblem: (severity, message, filePath, line, column) =>
    set((state) => ({
      problems: [
        ...state.problems,
        {
          id: crypto.randomUUID(),
          severity,
          message,
          filePath,
          line,
          column,
        },
      ],
    })),

  clearProblems: () => set({ problems: [] }),
}));
