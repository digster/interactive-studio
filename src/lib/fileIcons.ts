import {
  FileText,
  FileCode,
  FileJson,
  FileImage,
  File,
  Folder,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  // Web
  html: FileCode,
  htm: FileCode,
  css: FileCode,
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  // Data
  json: FileJson,
  // Documents
  md: FileText,
  mdx: FileText,
  txt: FileText,
  // Images
  svg: FileImage,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  // Code
  py: FileCode,
  rs: FileCode,
  sh: FileCode,
};

export function getFileIcon(filename: string): LucideIcon {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return iconMap[ext] ?? File;
}

export function getFolderIcon(isOpen: boolean): LucideIcon {
  return isOpen ? FolderOpen : Folder;
}

export function getFileIconColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const colorMap: Record<string, string> = {
    html: 'text-orange-500',
    css: 'text-blue-500',
    js: 'text-yellow-500',
    jsx: 'text-cyan-500',
    ts: 'text-blue-600',
    tsx: 'text-blue-400',
    json: 'text-yellow-600',
    md: 'text-gray-500',
    py: 'text-green-500',
    rs: 'text-orange-600',
    svg: 'text-purple-500',
    sh: 'text-green-600',
  };
  return colorMap[ext] ?? 'text-[var(--text-muted)]';
}
