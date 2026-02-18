import { useEditorStore, type EditorTab } from '../store/editorStore';
import { readFile } from './tauriFS';

function getTabContent(tabs: EditorTab[], filePath: string): string | null {
  const tab = tabs.find((t) => t.path === filePath);
  return tab ? tab.content : null;
}

async function resolveContent(tabs: EditorTab[], basePath: string, href: string): Promise<string | null> {
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return null;
  }

  const fullPath = href.startsWith('/')
    ? href
    : `${basePath}/${href}`;

  const tabContent = getTabContent(tabs, fullPath);
  if (tabContent !== null) return tabContent;

  try {
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

function getBasePath(htmlPath: string): string {
  const parts = htmlPath.split('/');
  parts.pop();
  return parts.join('/');
}

async function inlineAssets(html: string, tabs: EditorTab[], basePath: string): Promise<string> {
  let result = html;

  // Inline <link rel="stylesheet" href="...">
  const linkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
  const linkMatches = [...html.matchAll(linkRegex)];
  for (const match of linkMatches) {
    const href = match[1];
    const content = await resolveContent(tabs, basePath, href);
    if (content !== null) {
      result = result.replace(match[0], `<style>/* ${href} */\n${content}\n</style>`);
    }
  }

  // Also handle <link href="..." rel="stylesheet"> (reversed attributes)
  const linkRegex2 = /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi;
  const linkMatches2 = [...html.matchAll(linkRegex2)];
  for (const match of linkMatches2) {
    const href = match[1];
    if (result.includes(match[0])) {
      const content = await resolveContent(tabs, basePath, href);
      if (content !== null) {
        result = result.replace(match[0], `<style>/* ${href} */\n${content}\n</style>`);
      }
    }
  }

  // Inline <script src="..."></script>
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
  const scriptMatches = [...html.matchAll(scriptRegex)];
  for (const match of scriptMatches) {
    const src = match[1];
    const content = await resolveContent(tabs, basePath, src);
    if (content !== null) {
      result = result.replace(match[0], `<script>/* ${src} */\n${content}\n</script>`);
    }
  }

  return result;
}

function findHtmlFile(tabs: EditorTab[], projectPath: string): EditorTab | null {
  // Look for index.html in open tabs within the project
  const indexTab = tabs.find(
    (t) => t.name === 'index.html' && t.path.startsWith(projectPath),
  );
  if (indexTab) return indexTab;

  // Fall back to any HTML file in project
  return tabs.find(
    (t) => t.language === 'html' && t.path.startsWith(projectPath),
  ) ?? null;
}

export async function buildHtmlPreview(
  projectPath: string,
): Promise<string> {
  const { tabs, activeTabId } = useEditorStore.getState();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) return '';

  let htmlTab: EditorTab | null = null;

  if (activeTab.language === 'html') {
    htmlTab = activeTab;
  } else if (['css', 'javascript', 'typescript', 'jsx', 'tsx'].includes(activeTab.language)) {
    htmlTab = findHtmlFile(tabs, projectPath);
  }

  if (!htmlTab) return '';

  const basePath = getBasePath(htmlTab.path);
  let html = htmlTab.content;

  html = await inlineAssets(html, tabs, basePath);

  // Append timestamp comment to force browser re-render
  html += `\n<!-- ts:${Date.now()} -->`;

  return html;
}
