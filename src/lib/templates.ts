export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  files: Record<string, string>;
}

export const templates: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'An empty project',
    files: {},
  },
  {
    id: 'html',
    name: 'HTML Starter',
    description: 'Basic HTML + CSS + JavaScript project',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>Hello, World!</h1>
    <p>Start editing to see changes.</p>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
      'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  color: #1a1a1a;
}

#app {
  text-align: center;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

p {
  color: #666;
}`,
      'main.js': `// Your JavaScript code here
console.log('Hello from Interactive Studio!');

document.querySelector('h1').addEventListener('click', () => {
  console.log('Title clicked!');
});`,
    },
  },
  {
    id: 'react',
    name: 'React Component',
    description: 'A React component with JSX',
    files: {
      'App.tsx': `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, sans-serif',
      background: '#fafafa'
    }}>
      <h1>React Counter</h1>
      <p style={{ fontSize: '3rem', margin: '1rem 0' }}>{count}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setCount(c => c - 1)}>-</button>
        <button onClick={() => setCount(0)}>Reset</button>
        <button onClick={() => setCount(c => c + 1)}>+</button>
      </div>
    </div>
  );
}`,
    },
  },
  {
    id: 'python',
    name: 'Python Script',
    description: 'A simple Python script',
    files: {
      'main.py': `# Interactive Studio - Python
import sys

def greet(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
    print(f"Python version: {sys.version}")
`,
    },
  },
  {
    id: 'markdown',
    name: 'Markdown Document',
    description: 'A Markdown document with sample content',
    files: {
      'README.md': `# My Document

Welcome to **Interactive Studio**. This is a sample Markdown document.

## Features

- Live preview as you type
- GitHub Flavored Markdown support
- Syntax highlighting in code blocks

## Code Example

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

## Table

| Feature | Status |
|---------|--------|
| Preview | Done |
| Editing | Done |

> This is a blockquote with some **bold** and *italic* text.
`,
    },
  },
  {
    id: 'mermaid',
    name: 'Mermaid Diagram',
    description: 'A Mermaid diagram document',
    files: {
      'diagram.mmd': `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`,
    },
  },
];

export function getTemplate(id: string): ProjectTemplate | undefined {
  return templates.find(t => t.id === id);
}
