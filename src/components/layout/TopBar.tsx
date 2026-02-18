import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Sun, Moon, Monitor, Settings, Folder, Plus } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore, type Theme } from '../../store/settingsStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import SettingsPanel from '../settings/SettingsPanel';
import NewProjectDialog from '../project/NewProjectDialog';

function cycleTheme(current: Theme): Theme {
  switch (current) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
    case 'system':
      return 'light';
  }
}

function ThemeIcon({ theme, resolvedTheme }: { theme: Theme; resolvedTheme: 'light' | 'dark' }) {
  if (theme === 'system') {
    return <Monitor size={16} />;
  }
  if (resolvedTheme === 'dark') {
    return <Moon size={16} />;
  }
  return <Sun size={16} />;
}

export default function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useSettingsStore((s) => s.theme);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const activeProject = useWorkspaceStore((s) => s.activeProject);
  const projects = useWorkspaceStore((s) => s.projects);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <>
      <header
        className="h-12 flex items-center justify-between px-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] select-none shrink-0"
        data-tauri-drag-region
      >
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <span
            className="text-sm font-semibold text-[var(--text-primary)] truncate"
            data-tauri-drag-region
          >
            Interactive Studio
          </span>
        </div>

        {/* Center Section - Project Selector */}
        <div className="flex items-center relative" ref={dropdownRef} data-tauri-drag-region>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors duration-150"
          >
            <span className="truncate max-w-[200px]">
              {activeProject?.name ?? 'No Project'}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-56 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] shadow-lg py-1 z-50">
              {projects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => {
                    setActiveProject(project);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors duration-100 ${
                    activeProject?.path === project.path
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Folder size={14} className="shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
              {projects.length > 0 && (
                <div className="my-1 border-t border-[var(--border)]" />
              )}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setNewProjectOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors duration-100"
              >
                <Plus size={14} className="shrink-0" />
                <span>New Project...</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(cycleTheme(theme))}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            aria-label={`Theme: ${theme}`}
            title={`Theme: ${theme} (click to cycle)`}
          >
            <ThemeIcon theme={theme} resolvedTheme={resolvedTheme} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {newProjectOpen && <NewProjectDialog onClose={() => setNewProjectOpen(false)} />}
    </>
  );
}
