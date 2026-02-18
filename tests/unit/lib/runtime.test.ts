import { describe, it, expect, afterEach } from 'vitest';
import { isTauriRuntime } from '../../../src/lib/runtime';

type TauriGlobals = {
  isTauri?: boolean;
  __TAURI__?: unknown;
  __TAURI_INTERNALS__?: unknown;
};

const originalIsTauri = (globalThis as TauriGlobals).isTauri;
const originalTauri = (window as TauriGlobals).__TAURI__;
const originalTauriInternals = (window as TauriGlobals).__TAURI_INTERNALS__;

function resetTauriGlobals() {
  const g = globalThis as TauriGlobals;
  const w = window as TauriGlobals;

  if (originalIsTauri === undefined) {
    delete g.isTauri;
  } else {
    g.isTauri = originalIsTauri;
  }

  if (originalTauri === undefined) {
    delete w.__TAURI__;
  } else {
    w.__TAURI__ = originalTauri;
  }

  if (originalTauriInternals === undefined) {
    delete w.__TAURI_INTERNALS__;
  } else {
    w.__TAURI_INTERNALS__ = originalTauriInternals;
  }
}

afterEach(() => {
  resetTauriGlobals();
});

describe('isTauriRuntime', () => {
  it('returns false when no Tauri globals are present', () => {
    const g = globalThis as TauriGlobals;
    const w = window as TauriGlobals;
    delete g.isTauri;
    delete w.__TAURI__;
    delete w.__TAURI_INTERNALS__;

    expect(isTauriRuntime()).toBe(false);
  });

  it('returns true when globalThis.isTauri is true', () => {
    const g = globalThis as TauriGlobals;
    delete (window as TauriGlobals).__TAURI__;
    delete (window as TauriGlobals).__TAURI_INTERNALS__;
    g.isTauri = true;

    expect(isTauriRuntime()).toBe(true);
  });

  it('returns true when __TAURI_INTERNALS__ exists', () => {
    const g = globalThis as TauriGlobals;
    delete g.isTauri;
    delete (window as TauriGlobals).__TAURI__;
    (window as TauriGlobals).__TAURI_INTERNALS__ = {};

    expect(isTauriRuntime()).toBe(true);
  });

  it('returns true when legacy __TAURI__ exists', () => {
    const g = globalThis as TauriGlobals;
    delete g.isTauri;
    delete (window as TauriGlobals).__TAURI_INTERNALS__;
    (window as TauriGlobals).__TAURI__ = {};

    expect(isTauriRuntime()).toBe(true);
  });
});
