import { create } from 'zustand';

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  extension?: string;
  children?: FileNode[];
}

export interface Project {
  name: string;
  path: string;
}

export interface WorkspaceState {
  workspacePath: string;
  projects: Project[];
  activeProject: Project | null;
  fileTree: FileNode[];
  expandedDirs: Set<string>;

  setWorkspacePath: (path: string) => void;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  toggleDir: (path: string) => void;
  expandDir: (path: string) => void;
  collapseDir: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  workspacePath: '',
  projects: [],
  activeProject: null,
  fileTree: [],
  expandedDirs: new Set<string>(),

  setWorkspacePath: (path) => set({ workspacePath: path }),

  setProjects: (projects) => set({ projects }),

  setActiveProject: (project) => set({ activeProject: project }),

  setFileTree: (tree) => set({ fileTree: tree }),

  toggleDir: (path) =>
    set((state) => {
      const next = new Set(state.expandedDirs);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedDirs: next };
    }),

  expandDir: (path) =>
    set((state) => {
      if (state.expandedDirs.has(path)) return state;
      const next = new Set(state.expandedDirs);
      next.add(path);
      return { expandedDirs: next };
    }),

  collapseDir: (path) =>
    set((state) => {
      if (!state.expandedDirs.has(path)) return state;
      const next = new Set(state.expandedDirs);
      next.delete(path);
      return { expandedDirs: next };
    }),
}));
