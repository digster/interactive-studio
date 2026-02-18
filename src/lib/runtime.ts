type TauriWindow = Window & {
  __TAURI__?: unknown;
  __TAURI_INTERNALS__?: unknown;
};

/**
 * Detect if code is running inside a Tauri webview.
 * Supports Tauri v2 (`__TAURI_INTERNALS__` / `globalThis.isTauri`)
 * and the v1 global API (`__TAURI__`).
 */
export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const w = window as TauriWindow;
  const g = globalThis as { isTauri?: boolean };

  return Boolean(g.isTauri || w.__TAURI_INTERNALS__ || w.__TAURI__);
}
