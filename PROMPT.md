# Prompts

## 2026-02-17

Write the following Zustand 5 store files for an Interactive Studio application (code editor + preview). These stores manage all application state:

1. `src/store/workspaceStore.ts` - Manages projects and file trees (workspacePath, projects, activeProject, fileTree, expandedDirs with Set<string>)
2. `src/store/editorStore.ts` - Manages open tabs and editor state (tabs, activeTabId, openFile, closeTab, updateContent, markSaved, cursorPosition, reorderTabs)
3. `src/store/executionStore.ts` - Manages execution state and console output (isRunning, consoleEntries with crypto.randomUUID(), previewContent/Type, lastError)
4. `src/store/settingsStore.ts` - Application settings (theme, fontSize, tabSize, autoSave, wordWrap, minimap)
5. `src/store/uiStore.ts` - UI layout state (sidebar, bottomPanel, preview visibility and dimensions)

---

Write the following Rust backend files for a Tauri 2 application. This is an interactive code studio (like CodeSandbox/Artifacts). The workspace is at /Users/ishan/lab/interactive-studio.

The crate is named `interactive-studio` with lib name `tauri_app_lib`.

Files created:
1. `src-tauri/src/lib.rs` - Register all Tauri commands, plugins (opener, shell, fs), and FileWatcher managed state
2. `src-tauri/src/main.rs` - Entry point (kept as-is)
3. `src-tauri/src/commands/mod.rs` - Module declarations for filesystem, workspace, python, shell
4. `src-tauri/src/commands/filesystem.rs` - File CRUD operations (read, write, create, delete, rename, list_dir) with FileEntry struct
5. `src-tauri/src/commands/workspace.rs` - Project management (list_projects, create_project with templates, get_project_tree)
6. `src-tauri/src/commands/python.rs` - Python execution via uv with fallback (run_python, check_python_env)
7. `src-tauri/src/commands/shell.rs` - Generic shell command execution
8. `src-tauri/src/watchers/mod.rs` - Module declaration for fs_watcher
9. `src-tauri/src/watchers/fs_watcher.rs` - File system watcher using notify crate with Tauri event emission

---

Write the following React layout components for an Interactive Studio desktop application. The workspace is at /Users/ishan/lab/interactive-studio. Use React 19 + TypeScript, Tailwind CSS 4 utility classes, Zustand stores, and lucide-react icons.

The design aesthetic is Linear/Notion-inspired: minimal chrome, subtle shadows, muted backgrounds, smooth transitions, clean typography. Use CSS custom properties defined in the theme (--bg-primary, --bg-secondary, --bg-tertiary, --text-primary, --text-secondary, --text-muted, --border, --accent, --surface, --surface-hover).

Components created:
1. `src/App.tsx` - Root app wrapping ThemeProvider + AppShell
2. `src/providers/ThemeProvider.tsx` - Theme provider reading settings store, system media query, applies dark class
3. `src/components/layout/AppShell.tsx` - Main shell with react-resizable-panels (Sidebar | Editor+Console | Preview)
4. `src/components/layout/TopBar.tsx` - Top bar with hamburger toggle, title, project selector, theme cycle, settings
5. `src/components/layout/StatusBar.tsx` - Bottom status bar with language, cursor position, encoding
6. `src/components/layout/Sidebar.tsx` - Explorer sidebar with project name and file tree placeholder
7. `src/components/editor/EditorPane.tsx` - TabBar + editor content area placeholder
8. `src/components/editor/TabBar.tsx` - Scrollable tab bar with file icons, modified indicators, close buttons
9. `src/components/preview/PreviewPane.tsx` - Preview pane with header and refresh button
10. `src/components/console/ConsolePanel.tsx` - Console/Problems tabs, color-coded entries, clear button

---

Implement Phase 2 (FileTree) + Phase 3 (CodeMirror 6 Editor) for Interactive Studio:

Step 0 - Housekeeping:
- ESLint flat config (eslint.config.js) with TypeScript + React Hooks + React Refresh
- Prettier config (.prettierrc)
- Rewrite README.md with actual project description

Step 1 - FileTree Components (finish Phase 2):
- `src/components/filetree/FileTreeNode.tsx` - Recursive tree node with expand/collapse animation
- `src/components/filetree/FileTree.tsx` - Container mapping workspaceStore.fileTree to nodes
- `src/components/filetree/index.ts` - Barrel export
- Modified `src/components/layout/Sidebar.tsx` - Replace placeholder with real FileTree

Step 2 - CodeMirror 6 Editor (Phase 3):
- Installed @codemirror/* packages (state, view, language, commands, autocomplete, search, lint, lang-javascript, lang-html, lang-css, lang-python, lang-json, lang-markdown, theme-one-dark)
- `src/components/editor/cmLanguages.ts` - Language string to CM extension mapper
- `src/components/editor/cmTheme.ts` - Light/dark CM themes using CSS variables
- `src/components/editor/CodeEditor.tsx` - CM6 wrapper with Compartment-based dynamic reconfiguration
- Modified `src/components/editor/EditorPane.tsx` - Replace `<pre>` with CodeEditor
