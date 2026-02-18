import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import * as tauriFS from '../lib/tauriFS';

const DEV_FALLBACK_WORKSPACE = '/Users/ishan/lab/interactive-studio/workspace';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

function mapFileEntries(entries: tauriFS.FileEntry[]): {
  name: string;
  path: string;
  isDir: boolean;
  extension?: string;
  children?: ReturnType<typeof mapFileEntries>;
}[] {
  return entries.map((entry) => ({
    name: entry.name,
    path: entry.path,
    isDir: entry.is_dir,
    extension: entry.extension ?? undefined,
    children: entry.children ? mapFileEntries(entry.children) : undefined,
  }));
}

export function useWorkspace() {
  const {
    workspacePath,
    setWorkspacePath,
    setProjects,
    activeProject,
    setActiveProject,
    setFileTree,
  } = useWorkspaceStore();

  const initializedRef = useRef(false);

  // On mount: determine workspace path, list projects, auto-select first
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      let wsPath = workspacePath;

      if (!wsPath) {
        if (isTauri()) {
          try {
            const { homeDir } = await import('@tauri-apps/api/path');
            const home = await homeDir();
            wsPath = `${home}interactive-studio/workspace`;
          } catch (err) {
            console.warn('Failed to resolve Tauri home directory, using fallback:', err);
            wsPath = DEV_FALLBACK_WORKSPACE;
          }
        } else {
          wsPath = DEV_FALLBACK_WORKSPACE;
        }
        setWorkspacePath(wsPath);
      }

      try {
        const projectInfos = await tauriFS.listProjects(wsPath);
        const projects = projectInfos.map((p) => ({
          name: p.name,
          path: p.path,
        }));
        setProjects(projects);

        // Auto-select first project if none is active
        const current = useWorkspaceStore.getState().activeProject;
        if (!current && projects.length > 0) {
          setActiveProject(projects[0]);
        }
      } catch (err) {
        console.warn('Failed to list projects:', err);
      }
    }

    init();
  }, [workspacePath, setWorkspacePath, setProjects, setActiveProject, setFileTree]);

  // When activeProject changes, load file tree and start watching
  useEffect(() => {
    if (!activeProject) return;

    let cancelled = false;

    async function loadTree() {
      try {
        const entries = await tauriFS.getProjectTree(activeProject!.path);
        if (!cancelled) {
          setFileTree(mapFileEntries(entries));
        }
      } catch (err) {
        console.warn('Failed to load project tree:', err);
      }
    }

    async function startWatch() {
      try {
        await tauriFS.startWatching(activeProject!.path);
      } catch (err) {
        console.warn('Failed to start file watching:', err);
      }
    }

    loadTree();
    startWatch();

    return () => {
      cancelled = true;
      tauriFS.stopWatching().catch(() => {
        // Ignore errors when stopping watcher on cleanup
      });
    };
  }, [activeProject, setFileTree]);

  // Listen for fs-change events from Tauri and refresh tree
  useEffect(() => {
    if (!isTauri() || !activeProject) return;

    let unlisten: (() => void) | null = null;

    async function setupListener() {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen('fs-change', async () => {
          const current = useWorkspaceStore.getState().activeProject;
          if (!current) return;
          try {
            const entries = await tauriFS.getProjectTree(current.path);
            setFileTree(mapFileEntries(entries));
          } catch (err) {
            console.warn('Failed to refresh file tree on fs-change:', err);
          }
        });
      } catch (err) {
        console.warn('Failed to set up fs-change listener:', err);
      }
    }

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [activeProject, setFileTree]);
}
