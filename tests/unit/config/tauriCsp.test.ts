import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readCspDirectives(): Map<string, string[]> {
  const configPath = join(process.cwd(), 'src-tauri', 'tauri.conf.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    app?: {
      security?: {
        csp?: string;
      };
    };
  };

  const csp = config.app?.security?.csp ?? '';

  return new Map(
    csp
      .split(';')
      .map((directive) => directive.trim())
      .filter((directive) => directive.length > 0)
      .map((directive) => {
        const [name, ...values] = directive.split(/\s+/);
        return [name, values];
      }),
  );
}

describe('tauri production CSP', () => {
  it('allows localhost Python app previews in iframes', () => {
    const directives = readCspDirectives();
    const frameSrc = directives.get('frame-src');

    expect(frameSrc).toBeDefined();
    expect(frameSrc).toContain('http://127.0.0.1:*');
    expect(frameSrc).toContain('http://localhost:*');
  });
});
