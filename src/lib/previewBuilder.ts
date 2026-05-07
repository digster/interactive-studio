import { useEditorStore, type EditorTab } from '../store/editorStore';
import { readFile } from './tauriFS';
import { detectLanguage } from './languageDetect';
import { BRIDGE_SCRIPT } from './previewBridge';
import { transpile, type TranspileLanguage } from './previewTranspile';

function getTabContent(tabs: EditorTab[], filePath: string): string | null {
  const tab = tabs.find((t) => t.path === filePath);
  return tab ? tab.content : null;
}

interface ResolvedAsset {
  content: string;
  absolutePath: string;
}

async function resolveAsset(
  tabs: EditorTab[],
  basePath: string,
  href: string,
): Promise<ResolvedAsset | null> {
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return null;
  }

  const absolutePath = href.startsWith('/') ? href : `${basePath}/${href}`;

  const tabContent = getTabContent(tabs, absolutePath);
  if (tabContent !== null) return { content: tabContent, absolutePath };

  try {
    const content = await readFile(absolutePath);
    return { content, absolutePath };
  } catch {
    return null;
  }
}

function getBasePath(htmlPath: string): string {
  const parts = htmlPath.split('/');
  parts.pop();
  return parts.join('/');
}

function languageToTranspileLang(language: string): TranspileLanguage | null {
  if (language === 'typescript') return 'typescript';
  if (language === 'tsx') return 'tsx';
  if (language === 'jsx') return 'jsx';
  return null;
}

// Replaces a `<script src="X"></script>` tag with an inline script containing
// the resolved (and possibly transpiled) source. JS is inlined as-is with a
// `//# sourceURL=` pragma; TS/JSX/TSX is transpiled via esbuild and emitted
// as `type="module"` because esbuild outputs ESM. Transpile failures are
// converted into an inert script that pings the bridge so the error shows
// up in the Problems tab without breaking the rest of the preview.
async function buildInlinedScriptTag(
  asset: ResolvedAsset,
  href: string,
): Promise<string> {
  const language = detectLanguage(asset.absolutePath.split('/').pop() ?? '');
  const transpileLang = languageToTranspileLang(language);

  if (transpileLang) {
    try {
      const transpiled = await transpile(asset.content, transpileLang, asset.absolutePath);
      // Comment goes AFTER the transpiled body so the first line of that
      // body is line 1 — keeps the inline source map's mappings aligned
      // when the browser maps back to original (TSX/TS) source lines.
      return `<script type="module">${transpiled}\n/* ${href} (transpiled) */</script>`;
    } catch (err) {
      const e = err as { message?: string; file?: string; line?: number; column?: number };
      // JSON.stringify is safe here because we control the message values.
      const payload = JSON.stringify({
        __previewBridge: true,
        kind: 'error',
        message: `Transpile failed: ${e.message ?? 'unknown error'}`,
        file: e.file ?? asset.absolutePath,
        line: e.line ?? null,
        column: e.column ?? null,
      });
      return `<script>/* ${href} (transpile error) */window.parent.postMessage(${payload}, '*');</script>`;
    }
  }

  // Plain JS path: tag with a sourceURL so runtime errors point at the
  // user's file. Comment + pragma go *after* the body so the first user
  // line maps to line 1 of the script body (keeps `event.lineno` aligned).
  return `<script>${asset.content}\n/* ${href} */\n//# sourceURL=${asset.absolutePath}\n</script>`;
}

async function inlineAssets(html: string, tabs: EditorTab[], basePath: string): Promise<string> {
  let result = html;

  // Inline <link rel="stylesheet" href="...">
  const linkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
  for (const match of [...html.matchAll(linkRegex)]) {
    const href = match[1];
    const asset = await resolveAsset(tabs, basePath, href);
    if (asset) {
      result = result.replace(match[0], `<style>/* ${href} */\n${asset.content}\n</style>`);
    }
  }

  // Also handle <link href="..." rel="stylesheet"> (reversed attributes)
  const linkRegex2 = /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi;
  for (const match of [...html.matchAll(linkRegex2)]) {
    const href = match[1];
    if (!result.includes(match[0])) continue;
    const asset = await resolveAsset(tabs, basePath, href);
    if (asset) {
      result = result.replace(match[0], `<style>/* ${href} */\n${asset.content}\n</style>`);
    }
  }

  // Inline <script src="..."></script>
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
  for (const match of [...html.matchAll(scriptRegex)]) {
    const src = match[1];
    const asset = await resolveAsset(tabs, basePath, src);
    if (asset) {
      const tag = await buildInlinedScriptTag(asset, src);
      result = result.replace(match[0], tag);
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

// Inject the bridge script as the very first executable element so it
// installs its console + error hooks before any user code runs. Prefer
// inserting after `<head>`; if the HTML has no head tag we just prepend.
function injectBridge(html: string): string {
  const tag = `<script>/* preview bridge */\n${BRIDGE_SCRIPT}\n</script>`;
  const headOpenMatch = html.match(/<head[^>]*>/i);
  if (headOpenMatch && headOpenMatch.index !== undefined) {
    const insertAt = headOpenMatch.index + headOpenMatch[0].length;
    return html.slice(0, insertAt) + '\n' + tag + html.slice(insertAt);
  }
  return tag + '\n' + html;
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
  html = injectBridge(html);

  // Append timestamp comment to force browser re-render
  html += `\n<!-- ts:${Date.now()} -->`;

  return html;
}
