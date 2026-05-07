import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock esbuild-wasm so the test never touches the real wasm runtime.
vi.mock('esbuild-wasm', () => {
  const transform = vi.fn();
  const initialize = vi.fn(async () => undefined);
  return { transform, initialize };
});

vi.mock('esbuild-wasm/esbuild.wasm?url', () => ({ default: '/mock/esbuild.wasm' }));

import * as esbuild from 'esbuild-wasm';
import { transpile } from '../../../src/lib/previewTranspile';

const mockTransform = vi.mocked(esbuild.transform);
const mockInitialize = vi.mocked(esbuild.initialize);

describe('previewTranspile', () => {
  beforeEach(() => {
    mockTransform.mockReset();
    mockInitialize.mockReset();
    mockInitialize.mockResolvedValue(undefined);
  });

  it('initializes esbuild lazily and only once across calls', async () => {
    mockTransform.mockResolvedValue({
      code: 'const a = 1;',
      map: '',
      warnings: [],
      mangleCache: undefined,
      legalComments: '',
    } as Awaited<ReturnType<typeof esbuild.transform>>);

    await transpile('const a: number = 1;', 'typescript', '/abs/a.ts');
    await transpile('const b: number = 2;', 'typescript', '/abs/b.ts');

    // initialize() may be called twice if the first call's cache reset
    // path runs, but in a happy-path test we expect exactly one.
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledWith({ wasmURL: '/mock/esbuild.wasm' });
    expect(mockTransform).toHaveBeenCalledTimes(2);
  });

  it('passes the correct loader and sourcefile for tsx', async () => {
    mockTransform.mockResolvedValue({
      code: 'const A = () => /*@__PURE__*/_jsx("div", {});',
      map: '',
      warnings: [],
      mangleCache: undefined,
      legalComments: '',
    } as Awaited<ReturnType<typeof esbuild.transform>>);

    const out = await transpile('const A = () => <div/>;', 'tsx', '/abs/App.tsx');

    expect(mockTransform).toHaveBeenCalledWith(
      'const A = () => <div/>;',
      expect.objectContaining({
        loader: 'tsx',
        sourcefile: '/abs/App.tsx',
        sourcemap: 'inline',
        format: 'esm',
        jsx: 'automatic',
      }),
    );
    // sourceURL pragma appended after the transpiled code.
    expect(out).toContain('//# sourceURL=/abs/App.tsx');
  });

  it('wraps esbuild errors with a normalized line/column', async () => {
    mockTransform.mockRejectedValue({
      errors: [
        {
          text: 'Unexpected end of input',
          location: { file: '/abs/App.tsx', line: 5, column: 10 },
        },
      ],
    });

    await expect(transpile('const x = ', 'tsx', '/abs/App.tsx')).rejects.toMatchObject({
      message: 'Unexpected end of input',
      file: '/abs/App.tsx',
      line: 5,
      // esbuild reports columns 0-based; we report 1-based.
      column: 11,
    });
  });
});
