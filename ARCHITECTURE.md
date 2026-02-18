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
- **workspace.rs** - Project-level operations: list_projects, create_project (with template scaffolding: blank/html/python/markdown), get_project_tree (recursive tree with noise filtering).
- **python.rs** - Python execution: prefers `uv` (creates .venv automatically), falls back to `python3`/`python`. Streams output via Tauri events (`python-output`, `python-exit`) using `tokio::spawn`.
- **shell.rs** - Generic command execution: execute_command with configurable args and working directory.

### Watchers (src/watchers/)
- **fs_watcher.rs** - `FileWatcher` struct wrapping `notify::RecommendedWatcher` in a `Mutex`. Watches directories recursively and emits `fs-change` events (create/modify/delete) to the frontend. Filters out hidden files and editor temp files.

### Key Patterns
- All commands use `#[tauri::command]` and return `Result<T, String>` with `map_err` for error handling
- `FileWatcher` is stored as Tauri managed state via `.manage()`
- Python execution is async: `tokio::spawn` runs the process on a background task, events stream results back
- FileEntry is the canonical type for file tree representation, reused by workspace module

## Frontend (src/)

### State Management (src/store/) - Zustand 5
- **workspaceStore.ts** - Projects, file tree, active project, expanded directories (Set<string>)
- **editorStore.ts** - Open tabs, active tab, content editing, cursor position, tab reordering
- **executionStore.ts** - Running state, console entries (with UUID IDs), preview content/type
- **settingsStore.ts** - Theme, font size, tab size, auto-save, word wrap, minimap
- **uiStore.ts** - Sidebar/bottom panel/preview visibility and dimensions

### Providers (src/providers/)
- **ThemeProvider.tsx** - Manages light/dark/system theme. Listens to `prefers-color-scheme` media query when set to 'system'. Applies 'dark' class on `<html>` and syncs resolved theme to settingsStore. Exposes `useTheme()` context hook.

### Layout Components (src/components/layout/)
- **AppShell.tsx** - Root layout using `react-resizable-panels`. Vertical stack: TopBar + horizontal PanelGroup (Sidebar | Center | Preview) + StatusBar. Center panel contains vertical PanelGroup: EditorPane + ConsolePanel. Panel visibility controlled by uiStore.
- **TopBar.tsx** - 48px header. Left: sidebar toggle (hamburger) + app title. Center: project selector dropdown. Right: theme cycle button (light->dark->system) + settings. Has `data-tauri-drag-region` for macOS window dragging.
- **StatusBar.tsx** - 24px footer. Shows active file language, cursor position (Ln/Col), encoding (UTF-8).
- **Sidebar.tsx** - Left panel with "EXPLORER" header, active project name with folder icon, renders FileTree component. Shows "No project open" when empty.

### FileTree Components (src/components/filetree/)
- **FileTree.tsx** - Container that maps `workspaceStore.fileTree` to `FileTreeNode` at depth=0. Shows "No files found" empty state. `role="tree"`.
- **FileTreeNode.tsx** - Recursive component for single file/folder node. Directories show expand/collapse chevron with CSS grid animation (`grid-template-rows: 0fr → 1fr`). Files display language-colored icons. Children sorted: directories first (alpha), then files (alpha). Clicking a file reads content via `tauriFS.readFile()`, detects language, and opens in editor. Active file gets subtle accent highlight.

### Editor Components (src/components/editor/)
- **EditorPane.tsx** - TabBar + CodeEditor (keyed by `activeTab.id` for destroy/recreate on tab switch). Shows placeholder when no file is open.
- **TabBar.tsx** - Horizontal scrollable tabs with file icons, modified dot indicator, close buttons (visible on hover). Active tab has accent bottom border.
- **CodeEditor.tsx** - CodeMirror 6 React wrapper using ref-based imperative approach. `EditorView` lifecycle managed by `useEffect` keyed on `tabId`. Uses `Compartment` refs for dynamic reconfiguration of theme, language, tabSize, wordWrap, and fontSize. `EditorView.updateListener` wires doc changes to `editorStore.updateContent()` and cursor changes to `updateCursorPosition()`. Extensions: lineNumbers, highlightActiveLine, foldGutter, bracketMatching, closeBrackets, autocompletion, search, history.
- **cmLanguages.ts** - Maps app language strings to CodeMirror language extensions. Supports: javascript, typescript, jsx, tsx, html, css, python, json, markdown. Returns `null` for unsupported languages.
- **cmTheme.ts** - `createLightTheme()` uses CSS variables for colors. `createDarkTheme()` uses `oneDark` base with gutter overrides matching the app shell.

### Preview Components (src/components/preview/)
- **PreviewPane.tsx** - Header with "Preview" label, preview type indicator, refresh button. Content area placeholder.

### Console Components (src/components/console/)
- **ConsolePanel.tsx** - Bottom panel with Console/Problems tab switcher. Console entries color-coded by type (log/warn/error/info/result) with prefix badges. Clear button. Monospace font.

### Hooks (src/hooks/)
- **useAutoSave.ts** - Debounced auto-save triggered by editor content changes
- **useKeyboardShortcuts.ts** - Global keyboard shortcut handling (Cmd+B sidebar, Cmd+J bottom panel, Cmd+\ preview)
- **useWorkspace.ts** - Initializes workspace on mount: resolves path, lists projects, auto-selects first, loads file tree, starts file watcher, listens for `fs-change` events
- **useFileOperations.ts** - File CRUD callbacks: saveFile, createNewFile, createNewFolder, deleteFile, renameFile. Refreshes file tree after mutations.
- **useTheme.ts** - Theme detection and application
- **useDebounce.ts** - Generic debounce utility hook

### Utilities (src/lib/)
- **tauriFS.ts** - Tauri IPC wrappers for filesystem commands
- **languageDetect.ts** - File extension to language mapping
- **fileIcons.ts** - File extension to icon mapping
- **templates.ts** - Project template definitions

## Key Data Flows

### File Editing
1. User opens file via sidebar -> `editorStore.openFile()` calls `invoke("read_file")`
2. Content loads into editor tab
3. User edits -> `editorStore.updateContent()` tracks modified state
4. Auto-save hook debounces and calls `invoke("write_file")`
5. File watcher detects change, emits `fs-change` event (filtered to avoid echo)

### Python Execution
1. User clicks run -> `invoke("run_python")` with project path and script name
2. Backend checks for uv, creates venv if needed, spawns process
3. stdout/stderr streamed via `python-output` events -> `executionStore` appends console entries
4. Process completion emits `python-exit` with exit code

### Project Management
1. Workspace path set in workspaceStore
2. `invoke("list_projects")` scans workspace directory for project folders
3. `invoke("create_project")` scaffolds from template
4. `invoke("get_project_tree")` returns recursive FileEntry tree

## Build & Dev

```bash
# Frontend dev server
pnpm dev

# Tauri dev (starts frontend + Rust backend)
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Configuration
- `src-tauri/tauri.conf.json` - Tauri app config (window size, CSP, bundle settings)
- `src-tauri/capabilities/default.json` - Permission scopes for shell commands and filesystem access (scoped to $HOME)
