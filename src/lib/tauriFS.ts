import { invoke } from '@tauri-apps/api/core';

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  extension: string | null;
  children: FileEntry[] | null;
}

export interface ProjectInfo {
  name: string;
  path: string;
  modified_at: number;
}

export interface PythonEnvInfo {
  has_uv: boolean;
  has_python: boolean;
  python_version: string | null;
  has_venv: boolean;
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, contents: string): Promise<void> {
  return invoke('write_file', { path, contents });
}

export async function createFile(path: string): Promise<void> {
  return invoke('create_file', { path });
}

export async function createDir(path: string): Promise<void> {
  return invoke('create_dir', { path });
}

export async function deletePath(path: string): Promise<void> {
  return invoke('delete_path', { path });
}

export async function renamePath(from: string, to: string): Promise<void> {
  return invoke('rename_path', { from, to });
}

export async function listDir(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('list_dir', { path });
}

export async function listProjects(workspacePath: string): Promise<ProjectInfo[]> {
  return invoke<ProjectInfo[]>('list_projects', { workspacePath });
}

export async function createProject(
  workspacePath: string,
  name: string,
  template: string
): Promise<string> {
  return invoke<string>('create_project', { workspacePath, name, template });
}

export async function getProjectTree(projectPath: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('get_project_tree', { projectPath });
}

export async function runPython(
  projectPath: string,
  scriptName: string
): Promise<void> {
  return invoke('run_python', { projectPath, scriptName });
}

export async function checkPythonEnv(projectPath: string): Promise<PythonEnvInfo> {
  return invoke<PythonEnvInfo>('check_python_env', { projectPath });
}

export async function executeCommand(
  command: string,
  args: string[],
  cwd?: string
): Promise<string> {
  return invoke<string>('execute_command', { command, args, cwd });
}

export async function startWatching(path: string): Promise<void> {
  return invoke('start_watching', { path });
}

export async function stopWatching(): Promise<void> {
  return invoke('stop_watching');
}
