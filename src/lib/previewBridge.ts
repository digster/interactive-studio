// Bridge between preview iframes and the host React app.
//
// `BRIDGE_SCRIPT` is a self-contained JS snippet injected into every preview
// HTML before any user script. It wraps `console.*`, listens for `error`
// and `unhandledrejection`, and posts tagged envelopes back to
// `window.parent` via `postMessage`. `handlePreviewMessage` is the parent-
// side receiver that pushes those envelopes into the execution store.
//
// Note: sandboxed iframes (`sandbox="allow-scripts"`) have an opaque "null"
// origin, so `targetOrigin` must be `'*'` for `postMessage` to succeed. We
// authenticate inbound messages by the `__previewBridge` marker rather than
// by origin.

import { useExecutionStore, type ConsoleEntryType } from '../store/executionStore';

export const BRIDGE_MARKER = '__previewBridge';

// Kept as a hand-written string so it can be inlined into `<script>` blocks
// inside iframe srcdoc. ES5-style + IIFE for maximum compatibility with
// whatever script context the user's HTML happens to provide.
export const BRIDGE_SCRIPT = `(function () {
  if (window.__previewBridge_installed) return;
  window.__previewBridge_installed = true;

  function safeStringify(value, depth) {
    if (depth === undefined) depth = 0;
    if (depth > 4) return '...';
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    var t = typeof value;
    if (t === 'string') return value;
    if (t === 'number' || t === 'boolean') return String(value);
    if (t === 'bigint') return value.toString() + 'n';
    if (t === 'function') return '[Function: ' + (value.name || 'anonymous') + ']';
    if (t === 'symbol') return value.toString();
    if (value instanceof Error) {
      return (value.name || 'Error') + ': ' + value.message + (value.stack ? '\\n' + value.stack : '');
    }
    try {
      var seen = new WeakSet();
      return JSON.stringify(value, function (_k, v) {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
        if (typeof v === 'bigint') return v.toString() + 'n';
        return v;
      });
    } catch (_e) {
      try { return String(value); } catch (_e2) { return '[Unserializable]'; }
    }
  }

  function serializeArgs(args) {
    var parts = [];
    for (var i = 0; i < args.length; i++) parts.push(safeStringify(args[i]));
    return parts.join(' ');
  }

  function post(payload) {
    try { window.parent.postMessage(payload, '*'); } catch (_e) {}
  }

  // Stack frames look like "at fn (file:line:col)" or "file:line:col". We
  // skip the synthetic about:srcdoc frame so the first user frame wins.
  function parseStack(stack) {
    if (!stack) return null;
    var lines = stack.split('\\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/([^\\s\\(\\)]+):(\\d+):(\\d+)/);
      if (m && !/<anonymous>|about:srcdoc/.test(m[1])) {
        return { file: m[1], line: parseInt(m[2], 10), column: parseInt(m[3], 10) };
      }
    }
    return null;
  }

  var levels = ['log', 'info', 'warn', 'error', 'debug'];
  for (var li = 0; li < levels.length; li++) {
    (function (level) {
      var orig = console[level] ? console[level].bind(console) : null;
      console[level] = function () {
        if (orig) { try { orig.apply(null, arguments); } catch (_e) {} }
        post({
          __previewBridge: true,
          kind: 'console',
          // Map debug -> log so the entry type matches the host store enum.
          level: level === 'debug' ? 'log' : level,
          content: serializeArgs(arguments),
        });
      };
    })(levels[li]);
  }

  window.addEventListener('error', function (event) {
    var stackInfo = event.error ? parseStack(event.error.stack) : null;
    var message = event.error
      ? ((event.error.name || 'Error') + ': ' + event.error.message)
      : (event.message || 'Error');
    post({
      __previewBridge: true,
      kind: 'error',
      message: message,
      stack: event.error && event.error.stack ? event.error.stack : null,
      file: (stackInfo && stackInfo.file) || event.filename || null,
      line: (stackInfo && stackInfo.line) || event.lineno || null,
      column: (stackInfo && stackInfo.column) || event.colno || null,
    });
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var stack = (reason && reason.stack) ? reason.stack : null;
    var stackInfo = parseStack(stack);
    var message = reason instanceof Error
      ? ((reason.name || 'Error') + ': ' + reason.message)
      : 'Unhandled rejection: ' + safeStringify(reason);
    post({
      __previewBridge: true,
      kind: 'unhandledrejection',
      message: message,
      stack: stack,
      file: stackInfo ? stackInfo.file : null,
      line: stackInfo ? stackInfo.line : null,
      column: stackInfo ? stackInfo.column : null,
    });
  });
})();`;

interface BridgeConsoleMessage {
  __previewBridge: true;
  kind: 'console';
  level: ConsoleEntryType;
  content: string;
}

interface BridgeErrorMessage {
  __previewBridge: true;
  kind: 'error' | 'unhandledrejection';
  message: string;
  stack?: string | null;
  file?: string | null;
  line?: number | null;
  column?: number | null;
}

type BridgeMessage = BridgeConsoleMessage | BridgeErrorMessage;

function isBridgeMessage(data: unknown): data is BridgeMessage {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  if (record[BRIDGE_MARKER] !== true) return false;
  return record.kind === 'console' || record.kind === 'error' || record.kind === 'unhandledrejection';
}

// Translates an inbound iframe message into store mutations. Unknown or
// unmarked messages are ignored — third-party iframes and devtool extensions
// also use postMessage, and we don't want their traffic in the user console.
export function handlePreviewMessage(event: MessageEvent): void {
  if (!isBridgeMessage(event.data)) return;
  const msg = event.data;
  const store = useExecutionStore.getState();

  if (msg.kind === 'console') {
    store.addConsoleEntry(msg.level, msg.content);
    return;
  }

  // error or unhandledrejection — surface in both Console and Problems.
  store.addConsoleEntry('error', msg.message);
  store.addProblem(
    'error',
    msg.message,
    msg.file ?? undefined,
    msg.line ?? undefined,
    msg.column ?? undefined,
  );
}
