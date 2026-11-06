// Run in the browser, the page side: transpile a TypeScript or JavaScript block with esbuild-wasm and
// run it in a sandboxed iframe, the way the C# course runs a demo on its WebAssembly runtime.
//
// The transpiler (esbuild.js and esbuild.wasm under /runtime/, copied from esbuild-wasm at build time)
// loads on the first 运行 click. The code runs in an <iframe sandbox="allow-scripts"> built from srcdoc:
// no allow-same-origin, so it has an opaque origin and cannot reach this page, its storage or its
// cookies. Inside, the frame spawns a Worker from a blob of the code, so a busy loop never blocks the
// frame or this page; console output and uncaught errors come back by postMessage. A 5 second wall
// clock removes the iframe (and its worker) and the output says 运行超时; output stops at 64 KB. Nothing
// here calls eval or Function.
export const STAGES = {
  load: { timeout: 60000, label: '加载转译器' },
  compile: { timeout: 30000, label: '转译' },
  execute: { timeout: 5000, label: '执行' },
};
export const OUTPUT_LIMIT = 64 * 1024;
export const SOURCE_LIMIT = 100 * 1024;

let transpiler = null;

/** The esbuild-wasm browser module, initialised once per page. `base` is the site base ('/x/'). */
export function loadTranspiler(base) {
  transpiler ??= (async () => {
    const root = `${base.replace(/\/$/, '')}/runtime/`;
    const esbuild = await import(/* @vite-ignore */ `${root}esbuild.js`);
    await esbuild.initialize({ wasmURL: `${root}esbuild.wasm`, worker: true });
    return esbuild;
  })();
  transpiler.catch(() => {
    transpiler = null;
  });
  return transpiler;
}

export async function transpile(esbuild, source, language) {
  const result = await esbuild.transform(source, { loader: language === 'js' ? 'js' : 'ts', target: 'es2022', charset: 'utf8' });
  return result.code;
}

// What runs in the worker before the block: console and errors posted to the frame, timers counted so
// 'done' waits for them, the block itself inside one async function so top-level await works.
const WORKER_PRELUDE = String.raw`
const post = (message) => self.postMessage(message);
const seen = new WeakSet();
const show = (value, depth) => {
  if (typeof value === 'string') return depth ? JSON.stringify(value) : value;
  if (typeof value === 'bigint') return value + 'n';
  if (typeof value === 'symbol' || typeof value === 'function') return String(value);
  if (value === null || typeof value !== 'object') return String(value);
  if (value instanceof Error) return value.stack || String(value);
  if (seen.has(value)) return '[Circular]';
  if (depth > 3) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  try {
    if (value instanceof Map) return 'Map(' + value.size + ') {' + [...value].map(([k, v]) => show(k, depth + 1) + ' => ' + show(v, depth + 1)).join(', ') + '}';
    if (value instanceof Set) return 'Set(' + value.size + ') {' + [...value].map((v) => show(v, depth + 1)).join(', ') + '}';
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return String(value);
    if (Array.isArray(value)) return '[' + value.map((v) => show(v, depth + 1)).join(', ') + ']';
    const keys = Object.keys(value);
    const name = value.constructor && value.constructor !== Object && value.constructor.name ? value.constructor.name + ' ' : '';
    return name + '{' + keys.map((key) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)) + ': ' + show(value[key], depth + 1)).join(', ') + '}';
  } finally {
    seen.delete(value);
  }
};
const format = (args) => args.map((value) => show(value, 0)).join(' ');
const timers = new Set();
let settled = false;
const settle = () => { if (settled && timers.size === 0) post({ type: 'done' }); };
const finishMain = () => { if (settled) return; settled = true; post({ type: 'main' }); settle(); };
const nativeSetTimeout = self.setTimeout.bind(self);
const nativeClearTimeout = self.clearTimeout.bind(self);
self.setTimeout = (callback, delay, ...args) => {
  const id = nativeSetTimeout(() => { timers.delete(id); try { if (typeof callback === 'function') callback(...args); } finally { settle(); } }, delay);
  timers.add(id);
  return id;
};
self.clearTimeout = (id) => { timers.delete(id); nativeClearTimeout(id); settle(); };
for (const level of ['log', 'info', 'debug']) console[level] = (...args) => post({ type: 'console', level: 'log', text: format(args) });
console.warn = (...args) => post({ type: 'console', level: 'warn', text: format(args) });
console.error = (...args) => post({ type: 'console', level: 'error', text: format(args) });
console.table = (...args) => post({ type: 'console', level: 'log', text: format(args) });
console.dir = (...args) => post({ type: 'console', level: 'log', text: format(args) });
console.assert = (ok, ...args) => { if (!ok) post({ type: 'console', level: 'error', text: 'Assertion failed' + (args.length ? ': ' + format(args) : '') }); };
self.addEventListener('error', (event) => { event.preventDefault(); post({ type: 'error', text: event.error && event.error.stack || event.message }); finishMain(); });
self.addEventListener('unhandledrejection', (event) => { event.preventDefault(); post({ type: 'error', text: show(event.reason, 0) }); });
(async () => {
`;

const WORKER_EPILOGUE = String.raw`
})().then(() => finishMain(), (error) => { post({ type: 'error', text: error && error.stack || String(error) }); finishMain(); });
`;

// What the frame runs: build the worker, relay its messages up, terminate it on 'stop' from the parent.
const FRAME_SCRIPT = String.raw`
(() => {
  const relay = (message) => parent.postMessage(message, '*');
  const source = document.getElementById('code').textContent;
  let worker = null;
  try {
    let url;
    try {
      url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    } catch {
      url = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(source);
    }
    worker = new Worker(url);
    worker.onmessage = (event) => relay(event.data);
    worker.onerror = (event) => { relay({ type: 'error', text: event.message || '运行失败' }); relay({ type: 'main' }); relay({ type: 'done' }); };
  } catch (error) {
    relay({ type: 'error', text: String(error) });
    relay({ type: 'main' });
    relay({ type: 'done' });
  }
  window.addEventListener('message', (event) => {
    if (event.source === parent && event.data && event.data.type === 'stop' && worker) worker.terminate();
  });
})();
`;

/**
 * The sandbox document: the worker source as escaped text in a hidden <pre> (so no closing tag inside
 * the code can end anything, and textContent gives it back unchanged), the frame script beside it.
 */
export function sandboxDocument(js) {
  const source = `${WORKER_PRELUDE}${js}${WORKER_EPILOGUE}`;
  const escaped = source.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><meta charset="utf-8"><title>run</title><pre id="code" hidden>${escaped}</pre><script>${FRAME_SCRIPT}</script>`;
}

/**
 * Runs one block: `{ source, language, base, host, onStage }` → `{ done, stop }`. `host` is the element
 * the hidden iframe is appended to. The result is `{ ok, stage, output, error, timedOut, stopped }`.
 */
export function run({ source, language = 'ts', base = '/', host = document.body, onStage }) {
  let timer = 0;
  let frame = null;
  let settle = null;
  let output = '';
  let truncated = false;
  let finished = false;
  let lastError = null;
  let mainFinished = false;
  const done = new Promise((resolve) => {
    settle = resolve;
  });

  const errorText = () => (lastError ? `运行异常：${lastError.split('\n')[0]}` : null);

  function listener(event) {
    if (!frame || event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    const { type } = event.data;
    if (type === 'console' || type === 'error') {
      if (type === 'error') lastError = String(event.data.text);
      append(String(event.data.text), type === 'error' ? 'error' : event.data.level);
      return;
    }
    if (type === 'main') mainFinished = true;
    if (type === 'done') finish({ ok: !lastError, stage: 'execute', output, error: errorText() });
  }

  function append(text, level) {
    if (truncated) return;
    const line = level === 'warn' ? `[warn] ${text}` : level === 'error' ? `[error] ${text}` : text;
    output += `${line}\n`;
    if (output.length > OUTPUT_LIMIT) {
      output = `${output.slice(0, OUTPUT_LIMIT)}\n[输出已达到 64 KB，后续输出已截断]`;
      truncated = true;
      finish({ ok: !lastError, stage: 'execute', output, error: errorText() });
    }
  }

  function finish(result) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    window.removeEventListener('message', listener);
    try {
      frame?.contentWindow?.postMessage({ type: 'stop' }, '*');
    } catch {
      // The frame is gone already.
    }
    frame?.remove();
    frame = null;
    settle({ output: '', error: null, timedOut: false, stopped: false, ...result });
  }

  function stage(name) {
    clearTimeout(timer);
    const { timeout, label } = STAGES[name];
    onStage?.(name, label);
    timer = setTimeout(() => {
      if (name === 'execute' && mainFinished) {
        finish({ ok: !lastError, stage: name, output: `${output}（${timeout / 1000} 秒后停止：还有定时器没有结束）`, error: errorText() });
        return;
      }
      finish({ ok: false, timedOut: true, stage: name, output, error: `${label}超时（${timeout / 1000} 秒），已停止。` });
    }, timeout);
  }

  (async () => {
    if (new TextEncoder().encode(source).length > SOURCE_LIMIT) {
      finish({ ok: false, stage: 'compile', error: '源码超过 100 KB，已拒绝运行。' });
      return;
    }
    stage('load');
    let esbuild;
    try {
      esbuild = await loadTranspiler(base);
    } catch (error) {
      finish({ ok: false, stage: 'load', error: `无法加载转译器：${error?.message ?? error}` });
      return;
    }
    if (finished) return;
    stage('compile');
    let js;
    try {
      js = await transpile(esbuild, source, language);
    } catch (error) {
      const messages = (error?.errors ?? []).map((item) => `${item.location ? `(${item.location.line},${item.location.column}) ` : ''}${item.text}`);
      finish({ ok: false, stage: 'compile', error: messages.length ? `转译失败：\n${messages.join('\n')}` : `转译失败：${error?.message ?? error}` });
      return;
    }
    if (finished) return;
    stage('execute');
    window.addEventListener('message', listener);
    frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('title', '代码沙箱');
    frame.hidden = true;
    // The worker posts 'main' when the block's own code has ended and 'done' once its timers have too;
    // a busy loop posts neither and the wall clock removes the frame.
    frame.srcdoc = sandboxDocument(js);
    host.append(frame);
  })();

  return { done, stop: () => finish({ ok: false, stopped: true, stage: 'stopped', output, error: '已停止。' }) };
}
