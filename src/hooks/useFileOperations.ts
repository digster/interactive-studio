import { useCallback } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useEditorStore } from '../store/editorStore';
import * as tauriFS from '../lib/tauriFS';

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

async function refreshFileTree() {
  const { activeProject, setFileTree } = useWorkspaceStore.getState();
  if (!activeProject) return;

  try {
    const entries = await tauriFS.getProjectTree(activeProject.path);
    setFileTree(mapFileEntries(entries));
  } catch (err) {
    console.warn('Failed to refresh file tree:', err);
  }
}

export function useFileOperations() {
  const saveFile = useCallback(async (tabId?: string) => {
    const { tabs, activeTabId, markSaved } = useEditorStore.getState();
    const targetId = tabId ?? activeTabId;
    if (!targetId) return;

    const tab = tabs.find((t) => t.id === targetId);
    if (!tab) return;

    try {
      await tauriFS.writeFile(tab.path, tab.content);
      markSaved(targetId);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, []);

  const createNewFile = useCallback(async (dirPath: string, name: string) => {
    const filePath = `${dirPath}/${name}`;
    try {
      await tauriFS.createFile(filePath);
      await refreshFileTree();
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  }, []);

  const createNewFolder = useCallback(async (dirPath: string, name: string) => {
    const folderPath = `${dirPath}/${name}`;
    try {
      await tauriFS.createDir(folderPath);
      await refreshFileTree();
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  }, []);

  const deleteFile = useCallback(async (path: string) => {
    try {
      await tauriFS.deletePath(path);

      // Close tab if the deleted file is open
      const { tabs, closeTab } = useEditorStore.getState();
      const openTab = tabs.find((t) => t.id === path);
      if (openTab) {
        closeTab(openTab.id);
      }

      await refreshFileTree();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }, []);

  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    try {
      await tauriFS.renamePath(oldPath, newPath);
      await refreshFileTree();
    } catch (err) {
      console.error('Failed to rename file:', err);
    }
  }, []);

  return {
    saveFile,
    createNewFile,
    createNewFolder,
    deleteFile,
    renameFile,
  };
}
