# Architecture

Interactive Studio is a Tauri 2 desktop application (Rust backend + React/TypeScript frontend) functioning as an interactive code editor with live preview, similar to CodeSandbox or Claude Artifacts.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Zustand   │  │ Hooks    │  │ Components        │  │
│  │ Stores    │  │          │  │ (Editor, Preview, │  │
│  │ (5 stores)│  │          │  │  Sidebar, etc.)   │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│        │             │                 │             │
│        └─────────────┼─────────────────┘             │
│                      │                               │
│              Tauri IPC (invoke / listen)              │
├──────────────────────┼───────────────────────────────┤
│                      │                               │
│                  Rust Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ commands/    │  │ watchers/    │  │ Plugins    │ │
│  │ filesystem   │  │ fs_watcher   │  │ opener     │ │
│  │ workspace    │  │              │  │ shell      │ │
│  │ python       │  │              │  │ fs         │ │
│  │ shell        │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Backend (src-tauri/)

### Entry Points
- `src/main.rs` - Binary entry point, calls `tauri_app_lib::run()`
- `src/lib.rs` - Registers all plugins, managed state (FileWatcher), and 14 Tauri commands

### Command Modules (src/commands/)
- **filesystem.rs** - Low-level file CRUD: read_file, write_file, create_file, create_dir, delete_path, rename_path, list_dir. Defines the shared `FileEntry` struct used across modules.
- **workspace.rs** - Project-level operations: list_projects, create_project (with template scaffolding: blank/html/python/markdown), get_project_tree (recursive tree with noise filtering). In production first run, `list_projects` seeds bundled workspace examples when the workspace directory does not exist.
- **python.rs** - Python execution has two modes:
  - `run_python`: one-shot script execution (uv-first with fallback to system Python), emits `python-output` and `python-exit`.
  - `run_python_app` / `stop_python_app`: managed long-running Python app process (used for Dash/FastAPI), emits `python-output`, `python-app-ready` (URL), and `python-exit`. Includes local port selection (starting from 8050) and readiness probing.
- **shell.rs** - Generic command execution: execute_command with configurable args and working directory.

### Watchers (src/watchers/)
- **fs_watcher.rs** - `FileWatcher` struct wrapping `notify::RecommendedWatcher` in a `Mutex`. Watches directories recursively and emits `fs-change` events (create/modify/delete) to the frontend. Filters out hidden files and editor temp files.

### Key Patterns
- All commands use `#[tauri::command]` and return `Result<T, String>` with `map_err` for error handling
- `FileWatcher` and `PythonProcessManager` are both stored as Tauri managed state via `.manage()`
- Python execution is async: `tokio::spawn` runs the process on a background task, events stream results back
- FileEntry is the canonical type for file tree representation, reused by workspace module

## Frontend (src/)

### State Management (src/store/) - Zustand 5
- **workspaceStore.ts** - Projects, file tree, active project, expanded directories (Set<string>)
- **editorStore.ts** - Open tabs, active tab, content editing, cursor position, tab reordering
- **executionStore.ts** - Running state, running mode (`script`/`app`), console entries (with UUID IDs), preview content/type plus URL preview state, preview refresh key, problems list with severity/file/line tracking, Python output accumulator (separate from previewContent for async streaming)
- **settingsStore.ts** - Theme, font size, tab size, auto-save, word wrap, minimap
- **uiStore.ts** - Sidebar/bottom panel/preview visibility and dimensions

### Providers (src/providers/)
- **ThemeProvider.tsx** - Manages light/dark/system theme. Listens to `prefers-color-scheme` media query when set to 'system'. Applies 'dark' class on `<html>` and syncs resolved theme to settingsStore. Exposes `useTheme()` context hook.

### Layout Components (src/components/layout/)
- **AppShell.tsx** - Root layout using `react-resizable-panels`. Vertical stack: TopBar + horizontal PanelGroup (Sidebar | Center | Preview) + StatusBar. Center panel contains vertical PanelGroup: EditorPane + ConsolePanel. Panel visibility controlled by uiStore.
- **TopBar.tsx** - 48px header. Left: sidebar toggle + app title. Center: project selector dropdown with "New Project..." option. Right: theme cycle button + settings button (opens SettingsPanel modal).
- **StatusBar.tsx** - 24px footer. Shows active file language, cursor position (Ln/Col), encoding (UTF-8).
- **Sidebar.tsx** - Left panel with "EXPLORER" header, New File/Folder buttons, active project name with folder icon, renders FileTree component.

### FileTree Components (src/components/filetree/)
- **FileTree.tsx** - Container that maps `workspaceStore.fileTree` to `FileTreeNode` at depth=0. Shows "No files found" empty state. `role="tree"`.
- **FileTreeNode.tsx** - Recursive component for single file/folder node. Directories show expand/collapse chevron with CSS grid animation. Right-click context menu for Rename/Delete (files) or New File/New Folder/Rename/Delete (folders). Inline input for rename and new file/folder creation. Delete confirmation dialog for destructive operations.

### Editor Components (src/components/editor/)
- **EditorPane.tsx** - TabBar + run toolbar (visible for executable files) + CodeEditor. Run toolbar has Run, and when a Python app is active it shows a Stop button. ⌘+Enter runs, and in app mode it stops the active app.
- **TabBar.tsx** - Horizontal scrollable tabs with file icons, modified dot indicator, close buttons.
- **CodeEditor.tsx** - CodeMirror 6 React wrapper using Compartment-based dynamic reconfiguration for theme, language, tabSize, wordWrap, and fontSize.
- **cmLanguages.ts** - Maps language strings to CodeMirror language extensions.
- **cmTheme.ts** - Light/dark theme creation for CodeMirror.

### Preview Components (src/components/preview/)
- **PreviewPane.tsx** - Supports three preview paths: HTML via `<iframe srcdoc>` with inlined assets, Python script output (text or HTML auto-detected), and URL mode for local Python web apps (Dash/FastAPI) via `<iframe src>`. Includes waiting and running states plus refresh control.

### Console Components (src/components/console/)
- **ConsolePanel.tsx** - Bottom panel with Console/Problems tab switcher. Console entries color-coded by type. Problems tab shows severity icons (error/warning), message, file path + line number. Clicking a problem opens the file. Badge count on Problems tab label. Clear button scoped to active tab.

### Settings Components (src/components/settings/)
- **SettingsPanel.tsx** - Modal dialog with all editor settings. Theme (segmented control), Font Size (+/- buttons), Tab Size (segmented control), Word Wrap (toggle), Minimap (toggle), Auto Save (toggle + delay input). Changes apply immediately via Zustand store setters.

### Project Components (src/components/project/)
- **NewProjectDialog.tsx** - Modal dialog for project creation. Name input with validation (alphanumeric/hyphens/underscores, no duplicates). 2-column template grid (Blank, HTML, Python, Markdown, React, Mermaid). React/Mermaid use client-side template files written after blank project creation.

### Reusable UI Components (src/components/ui/)
- **ContextMenu.tsx** - Generic positioned dropdown via React portal. Supports icons, danger styling, separators. Closes on outside click/Escape. Boundary detection nudges menu if it would overflow viewport.
- **ConfirmDialog.tsx** - Delete confirmation modal with backdrop blur. Title + message + Cancel/Delete buttons.
- **InlineInput.tsx** - Auto-focused inline text input for rename/create operations. Pre-selects filename (without extension). Commits on Enter, cancels on Escape/blur.

### Hooks (src/hooks/)
- **useAutoSave.ts** - Debounced auto-save triggered by editor content changes
- **usePreview.ts** - Watches editor tabs + active project + refresh key. Debounces 300ms, builds HTML preview (inlines CSS/JS assets) or sets raw content for other preview types.
- **useCodeExecution.ts** - Manages execution lifecycle. Saves file, clears console/problems, and (when `isTauriRuntime()` is true) listens for `python-output`, `python-app-ready`, and `python-exit` events. Detects Dash/FastAPI-like Python files and runs them in app mode (`run_python_app` + `stop_python_app`); other Python files use script mode (`run_python`). Parses Python tracebacks for file/line info. For web languages, triggers preview refresh.
- **useKeyboardShortcuts.ts** - Global keyboard shortcut handling (Cmd+B sidebar, Cmd+J bottom panel, Cmd+\ preview)
- **useWorkspace.ts** - Initializes workspace on mount: resolves path, lists projects, auto-selects first, loads file tree, starts file watcher, listens for `fs-change` events. Workspace resolution is environment-aware: repo workspace in dev (`pnpm tauri dev` / browser), home workspace in production Tauri.
- **useFileOperations.ts** - File CRUD callbacks: saveFile, createNewFile, createNewFolder, deleteFile, renameFile. Refreshes file tree after mutations.
- **useTheme.ts** - Theme detection and application
- **useDebounce.ts** - Generic debounce utility hook

### Utilities (src/lib/)
- **tauriFS.ts** - Tauri IPC wrappers for filesystem commands
- **previewBuilder.ts** - Builds self-contained HTML for iframe preview by inlining `<link>` and `<script src>` assets. Reads content from open editor tabs (unsaved edits) first, falls back to disk via `invoke('read_file')`. Skips external URLs.
- **languageDetect.ts** - File extension to language mapping, preview type detection, executable language check
- **fileIcons.ts** - File extension to icon mapping
- **runtime.ts** - Runtime detection helpers (`isTauriRuntime`) compatible with both Tauri v2 (`globalThis.isTauri` / `__TAURI_INTERNALS__`) and legacy globals.
- **workspacePath.ts** - Centralized workspace path resolver (`resolveWorkspacePath`) for dev vs production Tauri behavior.

## Key Data Flows

### File Editing
1. User opens file via sidebar -> `editorStore.openFile()` calls `invoke("read_file")`
2. Content loads into editor tab
3. User edits -> `editorStore.updateContent()` tracks modified state
4. Auto-save hook debounces and calls `invoke("write_file")`
5. File watcher detects change, emits `fs-change` event (filtered to avoid echo)

### Live Preview
1. `usePreview` hook watches editor state (tabs, activeTabId, previewRefreshKey)
2. On change, debounces 300ms then calls `buildHtmlPreview()`
3. Preview builder reads active HTML tab content, inlines CSS/JS from open tabs or disk
4. Resulting HTML set as iframe `srcdoc` with `sandbox="allow-scripts"`
5. Refresh button triggers `requestRefresh()` which increments previewRefreshKey

### Python Execution
1. User clicks run on a Python file.
2. `useCodeExecution` detects execution mode:
   - Script mode: default Python execution (`invoke("run_python")`)
   - App mode: Dash/FastAPI-like files (`invoke("run_python_app")`)
3. Backend resolves runtime (`uv` first, else `python3`/`python`) and sets `DASH_HOST` / `DASH_PORT` / `HOST` / `PORT` env vars for app mode.
4. App mode picks an available localhost port (starting at 8050), spawns a managed process, streams logs via `python-output`, and probes readiness.
5. On readiness, backend emits `python-app-ready` with URL; frontend switches preview to URL iframe mode.
6. Script mode uses `python-output` for stdout/stderr and updates `pythonOutput`; stderr tracebacks are parsed into Problems.
7. `python-exit` finalizes either mode: stops running state and keeps script output preview (script mode) or clears URL preview (app mode).

### Project Management
1. Workspace path is resolved and stored:
   - Dev/browser/Tauri dev -> repo workspace (`/Users/ishan/lab/interactive-studio/workspace`)
   - Production Tauri -> `$HOME/interactive-studio/workspace`
2. `invoke("list_projects")` scans workspace directory for project folders; when the directory is missing (first run in production), backend creates it and seeds bundled example projects once
3. `invoke("create_project")` scaffolds from template (Rust-side: blank/html/python/markdown)
4. Client-side templates (React/Mermaid) write extra files after blank project creation
5. `invoke("get_project_tree")` returns recursive FileEntry tree

## Build & Dev

```bash
# Frontend dev server
pnpm dev

# Tauri dev (starts frontend + Rust backend)
pnpm tauri dev

# Build for production
pnpm tauri build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Configuration
- `src-tauri/tauri.conf.json` - Tauri app config (window size, CSP, bundle settings)
- `src-tauri/capabilities/default.json` - Permission scopes for shell commands and filesystem access (scoped to $HOME)
