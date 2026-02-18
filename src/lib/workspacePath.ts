export const DEV_FALLBACK_WORKSPACE_PATH = '/Users/ishan/lab/interactive-studio/workspace';

interface ResolveWorkspacePathOptions {
  isTauri: boolean;
  isDev: boolean;
  homeDir: string | null;
  devWorkspacePath?: string;
}

function ensureTrailingSlash(path: string): string {
  return /[\\/]$/.test(path) ? path : `${path}/`;
}

export function resolveWorkspacePath({
  isTauri,
  isDev,
  homeDir,
  devWorkspacePath = DEV_FALLBACK_WORKSPACE_PATH,
}: ResolveWorkspacePathOptions): string {
  // Use repo workspace for browser and local dev to keep examples in sync.
  if (!isTauri || isDev) {
    return devWorkspacePath;
  }

  if (!homeDir) {
    return devWorkspacePath;
  }

  const normalizedHome = ensureTrailingSlash(homeDir);
  return `${normalizedHome}interactive-studio/workspace`;
}
