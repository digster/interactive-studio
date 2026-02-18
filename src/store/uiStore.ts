import { create } from 'zustand';

export interface UIState {
  sidebarVisible: boolean;
  previewVisible: boolean;
  bottomPanelVisible: boolean;
  bottomPanelActiveTab: 'console' | 'problems';

  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  togglePreview: () => void;
  setPreviewVisible: (visible: boolean) => void;
  toggleBottomPanel: () => void;
  setBottomPanelVisible: (visible: boolean) => void;
  setBottomPanelActiveTab: (tab: 'console' | 'problems') => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarVisible: true,
  previewVisible: true,
  bottomPanelVisible: true,
  bottomPanelActiveTab: 'console',

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  togglePreview: () =>
    set((state) => ({ previewVisible: !state.previewVisible })),

  setPreviewVisible: (visible) => set({ previewVisible: visible }),

  toggleBottomPanel: () =>
    set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible })),

  setBottomPanelVisible: (visible) => set({ bottomPanelVisible: visible }),

  setBottomPanelActiveTab: (tab) => set({ bottomPanelActiveTab: tab }),
}));
