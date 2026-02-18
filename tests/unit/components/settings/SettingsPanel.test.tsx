import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPanel from '../../../../src/components/settings/SettingsPanel';
import { useSettingsStore } from '../../../../src/store/settingsStore';

describe('SettingsPanel', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      theme: 'system',
      resolvedTheme: 'dark',
      fontSize: 14,
      tabSize: 2,
      autoSave: true,
      autoSaveDelay: 1000,
      wordWrap: false,
      minimap: false,
    });
  });

  it('should render setting labels', () => {
    render(<SettingsPanel onClose={onClose} />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Tab Size')).toBeInTheDocument();
    expect(screen.getByText('Word Wrap')).toBeInTheDocument();
    expect(screen.getByText('Minimap')).toBeInTheDocument();
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
  });

  it('should render the Settings header', () => {
    render(<SettingsPanel onClose={onClose} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close on Escape key', () => {
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should decrease font size when minus button is clicked', () => {
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Decrease font size'));
    expect(useSettingsStore.getState().fontSize).toBe(13);
  });

  it('should increase font size when plus button is clicked', () => {
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Increase font size'));
    expect(useSettingsStore.getState().fontSize).toBe(15);
  });

  it('should not decrease font size below 10', () => {
    useSettingsStore.setState({ fontSize: 10 });
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Decrease font size'));
    expect(useSettingsStore.getState().fontSize).toBe(10);
  });

  it('should not increase font size above 24', () => {
    useSettingsStore.setState({ fontSize: 24 });
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Increase font size'));
    expect(useSettingsStore.getState().fontSize).toBe(24);
  });

  it('should display current font size', () => {
    render(<SettingsPanel onClose={onClose} />);
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('should change theme via segmented control', () => {
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByText('Light'));
    expect(useSettingsStore.getState().theme).toBe('light');

    fireEvent.click(screen.getByText('Dark'));
    expect(useSettingsStore.getState().theme).toBe('dark');

    fireEvent.click(screen.getByText('System'));
    expect(useSettingsStore.getState().theme).toBe('system');
  });

  it('should toggle word wrap', () => {
    expect(useSettingsStore.getState().wordWrap).toBe(false);
    render(<SettingsPanel onClose={onClose} />);
    // Word Wrap toggle - find the toggle button within the Word Wrap setting row
    const wordWrapRow = screen.getByText('Word Wrap').closest('div[class*="flex items-center justify-between"]');
    const toggle = wordWrapRow!.querySelector('button')!;
    fireEvent.click(toggle);
    expect(useSettingsStore.getState().wordWrap).toBe(true);
  });

  it('should toggle minimap', () => {
    expect(useSettingsStore.getState().minimap).toBe(false);
    render(<SettingsPanel onClose={onClose} />);
    const minimapRow = screen.getByText('Minimap').closest('div[class*="flex items-center justify-between"]');
    const toggle = minimapRow!.querySelector('button')!;
    fireEvent.click(toggle);
    expect(useSettingsStore.getState().minimap).toBe(true);
  });

  it('should toggle auto save', () => {
    expect(useSettingsStore.getState().autoSave).toBe(true);
    render(<SettingsPanel onClose={onClose} />);
    const autoSaveRow = screen.getByText('Auto Save').closest('div[class*="flex items-center justify-between"]');
    const toggle = autoSaveRow!.querySelector('button')!;
    fireEvent.click(toggle);
    expect(useSettingsStore.getState().autoSave).toBe(false);
  });

  it('should change tab size via segmented control', () => {
    render(<SettingsPanel onClose={onClose} />);
    fireEvent.click(screen.getByText('4'));
    expect(useSettingsStore.getState().tabSize).toBe(4);
  });
});
