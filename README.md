# Interactive Studio

A macOS desktop application for interactive code editing and live execution, built with **Tauri 2** (Rust + native WebView) and **React 19**.

Write code in an editor pane and see results instantly: live HTML preview, console output, rendered markdown, Mermaid diagrams, and more. Each folder under `workspace/` is an independent project.

## Features

- **Multi-language support**: HTML/CSS/JS, TypeScript/JSX/TSX, Python, Markdown, Mermaid, SVG, JSON
- **Live preview**: Auto-refreshing iframe sandbox for web code, rendered previews for markdown/diagrams
- **Python execution**: Runs via `uv` with per-project venvs, falls back to system Python or Pyodide (WASM)
- **Python app preview**: Detects Dash/FastAPI apps, starts a local server, and embeds it in the preview pane with Run/Stop controls
- **File management**: Full file tree with create, rename, delete operations
- **CodeMirror 6 editor**: Syntax highlighting, autocomplete, bracket matching, multi-tab support
- **Resizable panels**: Sidebar, editor, preview, and console panels with draggable dividers
- **Light/dark theme**: Syncs with macOS system preference with manual override
- **Keyboard-driven**: Command palette, quick file open, and standard shortcuts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2.x (Rust) |
| Frontend | React 19 + TypeScript |
| Build tool | Vite 7.x |
| Code editor | CodeMirror 6 |
| State management | Zustand 5 |
| Split panels | react-resizable-panels |
| Styling | Tailwind CSS 4 |
| Testing | Vitest (unit) + Playwright (E2E) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server (frontend only, no Tauri)
pnpm dev

# Start Tauri dev (frontend + native window)
pnpm tauri dev

# Run tests
pnpm test

# Build for production
pnpm tauri build
```

## Project Structure

```
interactive-studio/
  src-tauri/          # Rust backend (Tauri commands, file watcher)
  src/                # React frontend
    components/       # UI components (layout, editor, preview, filetree, console)
    store/            # Zustand stores (workspace, editor, execution, settings, ui)
    hooks/            # React hooks (auto-save, keyboard shortcuts, workspace)
    lib/              # Utilities (language detection, file icons, Tauri FS wrappers)
    providers/        # Context providers (theme)
    styles/           # Global CSS + theme variables
  workspace/          # Default workspace with user projects
  tests/              # Unit and E2E tests
```

## Example Projects

The `workspace/` directory ships with several example projects that demonstrate different capabilities:

| Project | Language | Description |
|---------|----------|-------------|
| `hello-world` | HTML/CSS/JS | Basic starter project |
| `python-hello-world` | Python | Core Python features: type hints, Fibonacci sequence, golden ratio calculation, multiplication table |
| `js-advanced` | HTML/CSS/JS | Canvas-based particle system with glassmorphism controls, mouse attraction physics, and connection lines |
| `python-viz` | Python | Unicode-based data visualization: bar charts, sparklines, scatter plots, histograms (no external dependencies) |
| `python-dash` | Python | Dash + Plotly web app rendered from a local Python server directly in the preview pane |
| `python-fastapi` | Python | FastAPI + Uvicorn web app rendered from a local Python server directly in the preview pane |

These projects are auto-discovered at startup. Drop any folder into `workspace/` to add your own.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.
