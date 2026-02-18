import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '../../../../src/components/layout/TopBar';
import { useUIStore } from '../../../../src/store/uiStore';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { useWorkspaceStore } from '../../../../src/store/workspaceStore';

describe('TopBar', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarVisible: true });
    useSettingsStore.setState({ theme: 'system', resolvedTheme: 'dark' });
    useWorkspaceStore.setState({ activeProject: null });
  });

  it('should render the title text', () => {
    render(<TopBar />);
    expect(screen.getByText('Interactive Studio')).toBeInTheDocument();
  });

  it('should show "No Project" when no project is active', () => {
    render(<TopBar />);
    expect(screen.getByText('No Project')).toBeInTheDocument();
  });

  it('should show the active project name', () => {
    useWorkspaceStore.setState({
      activeProject: { name: 'My Project', path: '/path/to/project' },
    });
    render(<TopBar />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('should toggle sidebar when hamburger is clicked', () => {
    render(<TopBar />);
    const button = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(button);
    expect(useUIStore.getState().sidebarVisible).toBe(false);
  });

  it('should cycle theme on theme button click', () => {
    useSettingsStore.setState({ theme: 'light' });
    render(<TopBar />);
    const button = screen.getByLabelText('Theme: light');
    fireEvent.click(button);
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('should cycle from dark to system', () => {
    useSettingsStore.setState({ theme: 'dark' });
    render(<TopBar />);
    const button = screen.getByLabelText('Theme: dark');
    fireEvent.click(button);
    expect(useSettingsStore.getState().theme).toBe('system');
  });

  it('should cycle from system to light', () => {
    useSettingsStore.setState({ theme: 'system' });
    render(<TopBar />);
    const button = screen.getByLabelText('Theme: system');
    fireEvent.click(button);
    expect(useSettingsStore.getState().theme).toBe('light');
  });
});
