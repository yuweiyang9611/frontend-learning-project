// Run in the browser, the build side: which ```ts / ```js fences become a runnable panel.
//
// A fence runs when it is plain TypeScript or JavaScript that a transpile-only run can honour: no
// import / export / require, no DOM, storage or network, no React or TSX, no @ts-expect-error (a
// transpile cannot show a type error), and a dry run in Node at build time ends without an uncaught
// error, so a reader never meets a 运行 button whose only result is "x is not defined". The info string
// decides first: `ts run` forces the panel, `ts no-run` keeps the plain block. The same decision feeds
// the markdown rule (config.mts) and the lesson outline (course.data.mjs), so the band's 跑 step and the
// page agree. Node only: the browser side is run-code-browser.mjs.
import vm from 'node:vm';
import { transformSync } from 'esbuild';

export const RUNNABLE_LANGUAGES = new Set(['ts', 'js', 'typescript', 'javascript']);
export const RUN_WORD = 'run';
export const NO_RUN_WORD = 'no-run';

/** Splits a fence info string into its language and the words after it (`ts run`, `js{1,3} no-run`). */
export function fenceInfo(info) {
  const text = String(info ?? '').trim();
  const [first = '', ...rest] = text.split(/\s+/);
  const language = first.replace(/[{:[].*$/, '').toLowerCase();
  return { language, words: rest.map((word) => word.toLowerCase()) };
}

const blocked = [
  [/^\s*(?:import|export)\b/m, '含 import / export'],
  [/\brequire\s*\(/, '含 require'],
  [/\b(?:document|window|navigator|localStorage|sessionStorage|indexedDB)\b/, '用到 DOM 或浏览器存储'],
  [/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/, '用到网络'],
  [/\b(?:React|useState|useEffect|useMemo|useQuery|JSX)\b/, '用到 React'],
  [/@ts-expect-error|@ts-ignore/, '含 @ts-expect-error（转译不会报类型错误）'],
];

/** The syntactic rule alone, without the dry run. Returns null when the fence may run, else the reason. */
export function staticReason(info, content) {
  const { language, words } = fenceInfo(info);
  if (words.includes(NO_RUN_WORD)) return '标注了 no-run';
  if (!RUNNABLE_LANGUAGES.has(language)) return language === 'tsx' || language === 'jsx' ? '是 TSX' : '不是 TypeScript 或 JavaScript';
  if (words.includes(RUN_WORD)) return null;
  for (const [pattern, reason] of blocked) {
    if (pattern.test(content)) return reason;
  }
  return null;
}

export const DRY_RUN_TIMEOUT = 2000;

function wrap(js) {
  return `(async () => {\n${js}\n})().then(() => { __dryRun.state = 'ok'; }, (error) => { __dryRun.state = 'error'; __dryRun.message = String(error && error.message || error); });`;
}

/**
 * Transpiles the block and runs it once in a fresh VM context with silent console and timers that
 * never fire. Returns null when the block ends cleanly (or is still waiting on a timer), else the
 * reason it cannot run.
 */
export function dryRunReason(content, language = 'ts') {
  let js;
  try {
    js = transformSync(content, { loader: language === 'js' || language === 'javascript' ? 'js' : 'ts', target: 'es2022', logLevel: 'silent' }).code;
  } catch (error) {
    const message = error?.errors?.[0]?.text ?? error?.message ?? String(error);
    return `转译失败：${message}`;
  }
  if (js.trim() === '') return '只有类型声明，没有可运行的语句';
  const noop = () => {};
  const silent = Object.fromEntries(['log', 'info', 'warn', 'error', 'debug', 'table', 'dir', 'group', 'groupEnd', 'assert', 'count', 'time', 'timeEnd', 'trace'].map((name) => [name, noop]));
  const sandbox = {
    __dryRun: { state: 'pending', message: '' },
    console: silent,
    setTimeout: () => 0,
    clearTimeout: noop,
    setInterval: () => 0,
    clearInterval: noop,
    queueMicrotask: (callback) => Promise.resolve().then(callback),
    structuredClone: globalThis.structuredClone,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    crypto: globalThis.crypto,
    performance: globalThis.performance,
  };
  const context = vm.createContext(sandbox, { microtaskMode: 'afterEvaluate' });
  try {
    new vm.Script(wrap(js), { filename: 'fence.js' }).runInContext(context, { timeout: DRY_RUN_TIMEOUT });
  } catch (error) {
    return `运行出错：${error?.message ?? error}`;
  }
  return sandbox.__dryRun.state === 'error' ? `运行出错：${sandbox.__dryRun.message}` : null;
}

const decisions = new Map();

/**
 * Whether a fence becomes a runnable panel: `{ run: true }` or `{ run: false, reason }`. Memoised by
 * info and content, since the markdown rule and the outline ask about the same fences.
 */
export function fenceRun(info, content) {
  const key = `${String(info ?? '').trim()}\0${content}`;
  let decision = decisions.get(key);
  if (!decision) {
    const { language, words } = fenceInfo(info);
    const reason = staticReason(info, content) ?? (words.includes(RUN_WORD) ? null : dryRunReason(content, language));
    decision = reason ? { run: false, reason, language } : { run: true, language };
    decisions.set(key, decision);
  }
  return decision;
}

/** The language word a runnable panel shows on its tab. */
export function languageLabel(language) {
  return language === 'js' || language === 'javascript' ? 'JavaScript' : 'TypeScript';
}

/**
 * The fences of one markdown source, in order: `{ info, content, line }`. A plain scanner for the
 * outline (the renderer has markdown-it's own tokens); backtick and tilde fences, closed by a line of at
 * least the opening length of the same character, content with the fence's own indentation removed.
 */
export function markdownFences(source) {
  const fences = [];
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  let open = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!open) {
      const match = line.match(/^(\s*)(`{3,}|~{3,})\s*([^`]*)$/);
      if (match) open = { indent: match[1].length, mark: match[2], info: match[3].trim(), start: index + 1, body: [] };
      continue;
    }
    const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
    if (close && close[1][0] === open.mark[0] && close[1].length >= open.mark.length) {
      fences.push({ info: open.info, content: `${open.body.join('\n')}\n`, line: open.start });
      open = null;
      continue;
    }
    open.body.push(line.slice(Math.min(open.indent, line.match(/^\s*/)[0].length)));
  }
  return fences;
}

/**
 * markdown-it plugin: a fence that can run renders as the kit panel (RunPanel.vue) with the code as a
 * prop and the id `fe-code-N` on the page, so the band's 看代码 and 跑 steps can link to the first;
 * every other fence keeps VitePress's own rendering. `env.runnableFences` counts them for the tests.
 */
export function runnableFences(md) {
  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const decision = fenceRun(token.info, token.content);
    if (!decision.run) return fence(tokens, index, options, env, self);
    const state = env ?? {};
    state.runnableFences = (state.runnableFences ?? 0) + 1;
    const lang = decision.language === 'js' || decision.language === 'javascript' ? 'js' : 'ts';
    return `<RunPanel id="fe-code-${state.runnableFences}" lang="${lang}" code="${md.utils.escapeHtml(token.content)}"></RunPanel>\n`;
  };
}
