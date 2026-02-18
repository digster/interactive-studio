import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

export interface SettingsState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  autoSaveDelay: number;
  wordWrap: boolean;
  minimap: boolean;

  setTheme: (theme: Theme) => void;
  setResolvedTheme: (resolved: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveDelay: (delay: number) => void;
  setWordWrap: (enabled: boolean) => void;
  setMinimap: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  theme: 'system',
  resolvedTheme: 'dark',
  fontSize: 14,
  tabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  wordWrap: false,
  minimap: false,

  setTheme: (theme) => set({ theme }),
  setResolvedTheme: (resolved) => set({ resolvedTheme: resolved }),
  setFontSize: (size) => set({ fontSize: size }),
  setTabSize: (size) => set({ tabSize: size }),
  setAutoSave: (enabled) => set({ autoSave: enabled }),
  setAutoSaveDelay: (delay) => set({ autoSaveDelay: delay }),
  setWordWrap: (enabled) => set({ wordWrap: enabled }),
  setMinimap: (enabled) => set({ minimap: enabled }),
}));
