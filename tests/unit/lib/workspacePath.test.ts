import { describe, expect, it } from 'vitest';
import { DEV_FALLBACK_WORKSPACE_PATH, resolveWorkspacePath } from '../../../src/lib/workspacePath';

describe('resolveWorkspacePath', () => {
  it('returns repo workspace when not running in Tauri', () => {
    expect(
      resolveWorkspacePath({
        isTauri: false,
        isDev: true,
        homeDir: '/Users/ishan/',
      }),
    ).toBe(DEV_FALLBACK_WORKSPACE_PATH);
  });

  it('returns repo workspace when running in Tauri dev mode', () => {
    expect(
      resolveWorkspacePath({
        isTauri: true,
        isDev: true,
        homeDir: '/Users/ishan/',
      }),
    ).toBe(DEV_FALLBACK_WORKSPACE_PATH);
  });

  it('returns home workspace when running in Tauri production mode', () => {
    expect(
      resolveWorkspacePath({
        isTauri: true,
        isDev: false,
        homeDir: '/Users/ishan/',
      }),
    ).toBe('/Users/ishan/interactive-studio/workspace');
  });

  it('falls back to repo workspace in Tauri production mode when homeDir is unavailable', () => {
    expect(
      resolveWorkspacePath({
        isTauri: true,
        isDev: false,
        homeDir: null,
      }),
    ).toBe(DEV_FALLBACK_WORKSPACE_PATH);
  });
});
