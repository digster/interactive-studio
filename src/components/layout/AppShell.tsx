import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useUIStore } from '../../store/uiStore';
import TopBar from './TopBar';
import StatusBar from './StatusBar';
import Sidebar from './Sidebar';
import EditorPane from '../editor/EditorPane';
import PreviewPane from '../preview/PreviewPane';
import ConsolePanel from '../console/ConsolePanel';

function HorizontalResizeHandle() {
  return (
    <PanelResizeHandle className="w-[1px] bg-[var(--border)] hover:bg-[var(--accent)] transition-colors duration-150 relative group">
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </PanelResizeHandle>
  );
}

function VerticalResizeHandle() {
  return (
    <PanelResizeHandle className="h-[1px] bg-[var(--border)] hover:bg-[var(--accent)] transition-colors duration-150 relative group">
      <div className="absolute inset-x-0 -top-1 -bottom-1" />
    </PanelResizeHandle>
  );
}

export default function AppShell() {
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const previewVisible = useUIStore((s) => s.previewVisible);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" autoSaveId="main-horizontal">
          {/* Sidebar */}
          {sidebarVisible && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={20}
                minSize={12}
                maxSize={35}
              >
                <Sidebar />
              </Panel>
              <HorizontalResizeHandle />
            </>
          )}

          {/* Center: Editor + Bottom Panel */}
          <Panel id="center" order={2} minSize={30}>
            <PanelGroup direction="vertical" autoSaveId="center-vertical">
              {/* Editor Pane */}
              <Panel id="editor" order={1} minSize={20}>
                <EditorPane />
              </Panel>

              {/* Bottom Panel (Console) */}
              {bottomPanelVisible && (
                <>
                  <VerticalResizeHandle />
                  <Panel
                    id="bottom-panel"
                    order={2}
                    defaultSize={30}
                    minSize={10}
                    maxSize={60}
                  >
                    <ConsolePanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Preview Pane */}
          {previewVisible && (
            <>
              <HorizontalResizeHandle />
              <Panel
                id="preview"
                order={3}
                defaultSize={30}
                minSize={15}
                maxSize={50}
              >
                <PreviewPane />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
