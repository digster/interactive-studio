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

---

## 2026-02-18

Implement all 6 missing features for Interactive Studio:

1. **Preview Pane** — Live HTML rendering via iframe srcdoc with inlined CSS/JS assets. Created previewBuilder.ts, usePreview.ts hook, updated PreviewPane.tsx with iframe rendering.
2. **Problems Tab** — Added Problem interface/state to executionStore, updated ConsolePanel with problem list, badge count, split clear button, clickable file paths.
3. **Run Button & Code Execution** — Created useCodeExecution hook with Tauri event listeners for python-output/python-exit. Added run toolbar to EditorPane with Play button and Cmd+Enter shortcut.
4. **File CRUD UI** — Created ContextMenu, ConfirmDialog, InlineInput components. Wired context menu into FileTreeNode (Rename/Delete for files, New File/Folder/Rename/Delete for folders). Added new file/folder buttons to Sidebar header.
5. **Settings Panel** — Created SettingsPanel modal with Theme, Font Size, Tab Size, Word Wrap, Minimap, Auto Save controls. Wired to TopBar settings button.
6. **Project Creation** — Created NewProjectDialog with name validation + template grid (Blank, HTML, Python, Markdown, React, Mermaid). Added "New Project..." to TopBar dropdown.

---

Write unit tests for new features added to the Interactive Studio project. The project uses vitest with jsdom environment, @testing-library/react for component tests, @testing-library/jest-dom for assertions, and Zustand stores tested via setState. Test files go in tests/unit/ mirroring the src/ structure.

Tests written:
1. `tests/unit/store/executionStore.test.ts` - Tests for previewRefreshKey, problems[], requestRefresh(), addProblem(), clearProblems(), setError() pushing to problems, and all existing console/preview state
2. `tests/unit/lib/previewBuilder.test.ts` - Tests for buildHtmlPreview: empty when no active tab, HTML content with timestamp, skipping external URLs, using tab content for linked CSS/JS, readFile fallback, finding index.html from CSS tab
3. `tests/unit/components/ui/ContextMenu.test.tsx` - Tests for rendering menu items, onClick/onClose callbacks, Escape key closing, separator rendering
4. `tests/unit/components/ui/ConfirmDialog.test.tsx` - Tests for title/message rendering, onConfirm/onCancel callbacks, Escape key, custom confirm label
5. `tests/unit/components/ui/InlineInput.test.tsx` - Tests for default value, Enter submit with trimming, Escape cancel, blur behavior, placeholder
6. `tests/unit/components/settings/SettingsPanel.test.tsx` - Tests for setting labels, close button, Escape, font size buttons with bounds, theme segmented control, toggle switches (wordWrap, minimap, autoSave), tab size control
7. `tests/unit/components/project/NewProjectDialog.test.tsx` - Tests for dialog title, template rendering, validation errors (empty name, invalid chars, duplicate), template selection, close/cancel buttons, Escape, error clearing, button disabled state
8. Updated `tests/unit/components/console/ConsolePanel.test.tsx` - Added tests for problem count badge, problems list rendering, clear problems button, severity icons/messages, file path info display

---

Implement the plan to add 3 new workspace example projects: python-hello-world, js-advanced, python-viz

---

Implement the plan to add Python file preview support: show Python execution output in the preview pane with auto-detection to render HTML output in an iframe when the script produces HTML.

---

Follow-up fixes after 2026-02-18 feature batch:

1. **Tauri Runtime Detection Hardening** — Added `src/lib/runtime.ts` with `isTauriRuntime()` and updated hooks to use it:
- `src/hooks/useCodeExecution.ts` (Python event listener setup now gated by Tauri runtime detection)
- `src/hooks/useWorkspace.ts` (shared runtime detection for Tauri-specific behavior)

2. **Workspace Path Resolution in Tauri Dev vs Production** — Added `src/lib/workspacePath.ts` with `resolveWorkspacePath()` and updated `useWorkspace` initialization:
- Dev/browser/Tauri dev (`import.meta.env.DEV`) uses repo workspace: `/Users/ishan/lab/interactive-studio/workspace`
- Production Tauri uses `$HOME/interactive-studio/workspace`
- Falls back to repo workspace if `homeDir()` resolution fails

3. **Python Execution Fallback Hardening** — Updated `src-tauri/src/commands/python.rs`:
- If `uv` is installed but execution fails, backend now emits stderr context and falls back to `python3`/`python` instead of failing immediately

4. **Tests Added**
- `tests/unit/lib/runtime.test.ts` (runtime detection matrix)
- `tests/unit/lib/workspacePath.test.ts` (workspace path resolution matrix)

5. **Documentation Sync**
- Updated `ARCHITECTURE.md` for runtime detection, workspace resolution behavior, and uv failure fallback
- Appended update section in `memory/2026-02-18.md`

---

## 2026-02-21

Can we use dash by plotly in our app? if yes, add an example in the workspace folder.

Implement the plan.

in our current app can we also use python code which requires backend like fastapi? If yes, add a fastapi example in the workspace folder.
