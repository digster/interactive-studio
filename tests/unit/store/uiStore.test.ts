import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../src/store/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarVisible: true,
      previewVisible: true,
      bottomPanelVisible: true,
      bottomPanelActiveTab: 'console',
    });
  });

  it('should have correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.sidebarVisible).toBe(true);
    expect(state.previewVisible).toBe(true);
    expect(state.bottomPanelVisible).toBe(true);
    expect(state.bottomPanelActiveTab).toBe('console');
  });

  it('should toggle sidebar visibility', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarVisible).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarVisible).toBe(true);
  });

  it('should set sidebar visibility directly', () => {
    useUIStore.getState().setSidebarVisible(false);
    expect(useUIStore.getState().sidebarVisible).toBe(false);
  });

  it('should toggle preview visibility', () => {
    useUIStore.getState().togglePreview();
    expect(useUIStore.getState().previewVisible).toBe(false);
    useUIStore.getState().togglePreview();
    expect(useUIStore.getState().previewVisible).toBe(true);
  });

  it('should toggle bottom panel visibility', () => {
    useUIStore.getState().toggleBottomPanel();
    expect(useUIStore.getState().bottomPanelVisible).toBe(false);
  });

  it('should set bottom panel active tab', () => {
    useUIStore.getState().setBottomPanelActiveTab('problems');
    expect(useUIStore.getState().bottomPanelActiveTab).toBe('problems');
    useUIStore.getState().setBottomPanelActiveTab('console');
    expect(useUIStore.getState().bottomPanelActiveTab).toBe('console');
  });
});
