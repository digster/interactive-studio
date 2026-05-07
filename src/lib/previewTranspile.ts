// In-browser TS / JSX / TSX -> JS transpiler used by the preview pipeline.
//
// Powered by esbuild-wasm. The WASM blob is loaded lazily on first call so
// it never costs anything for HTML / plain-JS-only projects.

import * as esbuild from 'esbuild-wasm';
import esbuildWasmURL from 'esbuild-wasm/esbuild.wasm?url';

export type TranspileLanguage = 'typescript' | 'tsx' | 'jsx';

export interface TranspileError extends Error {
  line?: number;
  column?: number;
  file?: string;
}

let initPromise: Promise<void> | null = null;

// Memoize initialization. esbuild only allows one `initialize()` per page.
function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = esbuild.initialize({ wasmURL: esbuildWasmURL }).catch((err) => {
      // Reset so a retry can re-attempt rather than getting stuck on a
      // permanently-rejected promise (e.g. transient network failure
      // fetching the wasm file).
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

function loaderFor(language: TranspileLanguage): 'ts' | 'tsx' | 'jsx' {
  if (language === 'typescript') return 'ts';
  if (language === 'tsx') return 'tsx';
  return 'jsx';
}

// Returns transpiled JS as a string. Inline source maps are appended by
// esbuild via `sourcemap: 'inline'`, then we tack on an explicit
// `//# sourceURL=...` so engines that ignore the source map still report
// the original path in `Error.filename` / stack frames.
export async function transpile(
  code: string,
  language: TranspileLanguage,
  absoluteFilePath: string,
): Promise<string> {
  await ensureInitialized();

  try {
    const result = await esbuild.transform(code, {
      loader: loaderFor(language),
      sourcefile: absoluteFilePath,
      sourcemap: 'inline',
      format: 'esm',
      target: 'es2020',
      // Automatic runtime so user code doesn't need an explicit React import.
      // Harmless for plain TS (no JSX, no effect).
      jsx: 'automatic',
    });

    return `${result.code}\n//# sourceURL=${absoluteFilePath}\n`;
  } catch (err) {
    // esbuild errors are { errors: [{ text, location: { file, line, column }}] }
    const e = err as {
      errors?: Array<{
        text?: string;
        location?: { file?: string; line?: number; column?: number };
      }>;
      message?: string;
    };
    const first = e.errors?.[0];
    const text = first?.text ?? e.message ?? 'Transpile failed';
    const wrapped: TranspileError = new Error(text);
    wrapped.file = first?.location?.file ?? absoluteFilePath;
    wrapped.line = first?.location?.line;
    // esbuild reports columns 0-based; bump to 1-based for editor parity.
    wrapped.column =
      typeof first?.location?.column === 'number' ? first.location.column + 1 : undefined;
    throw wrapped;
  }
}
