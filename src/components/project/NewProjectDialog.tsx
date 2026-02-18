import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, File, Globe, Code2, Terminal, FileText, GitBranch } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import * as tauriFS from '../../lib/tauriFS';
import clsx from 'clsx';

interface NewProjectDialogProps {
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  backendTemplate: string;
  extraFiles?: Record<string, string>;
}

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty project',
    icon: File,
    backendTemplate: 'blank',
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'HTML, CSS & JS',
    icon: Globe,
    backendTemplate: 'html',
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python script',
    icon: Terminal,
    backendTemplate: 'python',
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Markdown document',
    icon: FileText,
    backendTemplate: 'markdown',
  },
  {
    id: 'react',
    name: 'React',
    description: 'React component playground',
    icon: Code2,
    backendTemplate: 'blank',
    extraFiles: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Playground</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="app.jsx"><\/script>
</body>
</html>`,
      'app.jsx': `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="app">
      <h1>Hello React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
      'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.app {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h1 { margin-bottom: 1rem; }
p { margin-bottom: 1rem; color: #666; }

button {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: #0070f3;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

button:hover { background: #005cc5; }`,
    },
  },
  {
    id: 'mermaid',
    name: 'Mermaid',
    description: 'Mermaid diagram',
    icon: GitBranch,
    backendTemplate: 'blank',
    extraFiles: {
      'diagram.mmd': `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    },
  },
];

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export default function NewProjectDialog({ onClose }: NewProjectDialogProps) {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath);
  const projects = useWorkspaceStore((s) => s.projects);
  const setProjects = useWorkspaceStore((s) => s.setProjects);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);

  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('html');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const validate = (value: string): string => {
    if (!value.trim()) return 'Project name is required';
    if (!NAME_REGEX.test(value)) return 'Only letters, numbers, hyphens, and underscores';
    if (projects.some((p) => p.name === value)) return 'Project already exists';
    return '';
  };

  const handleCreate = async () => {
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const template = TEMPLATES.find((t) => t.id === selectedTemplate)!;
    setCreating(true);
    setError('');

    try {
      const projectPath = await tauriFS.createProject(
        workspacePath,
        name,
        template.backendTemplate,
      );

      // Write extra files for client-side templates
      if (template.extraFiles) {
        for (const [fileName, content] of Object.entries(template.extraFiles)) {
          await tauriFS.writeFile(`${projectPath}/${fileName}`, content);
        }
      }

      // Refresh project list and select new project
      const projectInfos = await tauriFS.listProjects(workspacePath);
      const mappedProjects = projectInfos.map((p) => ({ name: p.name, path: p.path }));
      setProjects(mappedProjects);

      const newProject = mappedProjects.find((p) => p.name === name);
      if (newProject) {
        setActiveProject(newProject);
      }

      onClose();
    } catch (err) {
      setError(`Failed to create project: ${err}`);
    } finally {
      setCreating(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[480px] bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">New Project</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              placeholder="my-project"
              autoFocus
              className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
            />
            {error && (
              <p className="mt-1 text-xs text-[var(--error)]">{error}</p>
            )}
          </div>

          {/* Template Grid */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150',
                      selectedTemplate === template.id
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    <Icon
                      size={18}
                      className={clsx(
                        'shrink-0',
                        selectedTemplate === template.id
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-muted)]',
                      )}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)]">
                        {template.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {template.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity duration-150"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
