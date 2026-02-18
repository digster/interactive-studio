import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ThemeProvider, { useTheme } from '../../../src/providers/ThemeProvider';
import { useSettingsStore } from '../../../src/store/settingsStore';

function ThemeConsumer() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  );
}

describe('ThemeProvider', () => {
  let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = [];
  let matchMediaMatches = false;

  beforeEach(() => {
    matchMediaListeners = [];
    matchMediaMatches = false;
    document.documentElement.classList.remove('dark');

    useSettingsStore.setState({ theme: 'system', resolvedTheme: 'dark' });

    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
      matches: matchMediaMatches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event: string, handler: EventListenerOrEventListenerObject) => {
        matchMediaListeners.push(handler as (e: MediaQueryListEvent) => void);
      },
      removeEventListener: (_event: string, handler: EventListenerOrEventListenerObject) => {
        matchMediaListeners = matchMediaListeners.filter((h) => h !== handler);
      },
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide theme context values', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('system');
  });

  it('should add dark class when resolved to dark', () => {
    matchMediaMatches = true;
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class when resolved to light', () => {
    matchMediaMatches = false;
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply explicit dark theme regardless of system preference', () => {
    matchMediaMatches = false;
    useSettingsStore.setState({ theme: 'dark' });
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply explicit light theme regardless of system preference', () => {
    matchMediaMatches = true;
    useSettingsStore.setState({ theme: 'light' });
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should respond to system theme changes when set to system', () => {
    useSettingsStore.setState({ theme: 'system' });
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      matchMediaListeners.forEach((fn) =>
        fn({ matches: true } as MediaQueryListEvent),
      );
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
