import ThemeProvider from './providers/ThemeProvider';
import AppShell from './components/layout/AppShell';
import { useWorkspace } from './hooks/useWorkspace';
import { useAutoSave } from './hooks/useAutoSave';
import { useGlobalShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  useWorkspace();
  useAutoSave();
  useGlobalShortcuts();

  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
