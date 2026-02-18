const extensionMap: Record<string, string> = {
  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  json: 'json',
  // Python
  py: 'python',
  pyw: 'python',
  // Markdown
  md: 'markdown',
  mdx: 'markdown',
  // Data
  svg: 'svg',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  // Config
  gitignore: 'plaintext',
  env: 'plaintext',
  txt: 'plaintext',
  // Rust
  rs: 'rust',
  // Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  // Mermaid
  mmd: 'mermaid',
  mermaid: 'mermaid',
};

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return extensionMap[ext] ?? 'plaintext';
}

export function getPreviewType(language: string): 'html' | 'markdown' | 'mermaid' | 'svg' | 'json' | 'python' | 'none' {
  switch (language) {
    case 'html':
      return 'html';
    case 'markdown':
      return 'markdown';
    case 'mermaid':
      return 'mermaid';
    case 'svg':
      return 'svg';
    case 'json':
      return 'json';
    case 'python':
      return 'python';
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
    case 'css':
      return 'html'; // These get executed in iframe
    default:
      return 'none';
  }
}

export function isExecutable(language: string): boolean {
  return ['html', 'javascript', 'typescript', 'jsx', 'tsx', 'python', 'css'].includes(language);
}

export function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    jsx: 'JSX',
    tsx: 'TSX',
    python: 'Python',
    markdown: 'Markdown',
    json: 'JSON',
    svg: 'SVG',
    mermaid: 'Mermaid',
    rust: 'Rust',
    shell: 'Shell',
    yaml: 'YAML',
    toml: 'TOML',
    plaintext: 'Plain Text',
  };
  return labels[language] ?? language;
}
