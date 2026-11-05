// Colours source text for the source panel with the kit's token classes: keyword and number purple,
// type cyan, call blue, string green, comment and meta soft. A port of the C# course's code-colors.js
// without the DOM, so it runs in Node tests and in the browser alike, extended for this site's
// languages: TypeScript, TSX, JavaScript, CSS, HTML, markdown, C#, data files and shells.

const words = (list) => list.trim().split(/\s+/).join('|');

const csharpKeywords = words(`abstract and as async await base bool break byte case catch char checked class const
  continue decimal default delegate do double else enum event explicit extern false file finally fixed float for
  foreach get goto if implicit in init int interface internal is lock long namespace new not null object operator or
  out override params partial private protected public readonly record ref required return sbyte sealed set short
  sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using
  var virtual void volatile when where while with yield`);

const csharp = {
  comment: String.raw`//[^\n]*|/\*[\s\S]*?\*/`,
  string: String.raw`\$?@?"""[\s\S]*?"""|\$?@?"(?:[^"\\\n]|\\.|"")*"|'(?:[^'\\\n]|\\.)+'`,
  meta: String.raw`^[ \t]*#[a-z]+[^\n]*|(?<=^[ \t]*)\[[A-Z]\w*(?:\([^)\n]*\))?\]`,
  number: String.raw`\b\d[\d_]*(?:\.\d+)?[fFdDmMlLuU]*\b`,
  keyword: String.raw`\b(?:${csharpKeywords})\b`,
  call: String.raw`\b[A-Za-z_]\w*(?=(?:<[\w<>, ?]*>)?\()`,
  type: String.raw`\b[A-Z]\w*`,
};

const typescriptKeywords = words(`abstract any as asserts async await boolean break case catch class const constructor
  continue debugger declare default delete do else enum export extends false finally for from function get if
  implements import in infer instanceof interface is keyof let module namespace never new null number object of
  override package private protected public readonly return satisfies set static string super switch symbol this throw
  true try type typeof undefined unique unknown var void while with yield`);

// TypeScript, TSX and JavaScript: a lowercase JSX tag is meta, a capitalised name is a type or component.
const typescript = {
  comment: String.raw`//[^\n]*|/\*[\s\S]*?\*/`,
  string: String.raw`\x60(?:[^\x60\\]|\\[\s\S])*\x60|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'`,
  meta: String.raw`@[A-Za-z_$][\w$]*|(?<=<\/?)[a-z][\w-]*(?=[\s/>])`,
  number: String.raw`\b0[xXbBoO][\da-fA-F_]+n?\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b`,
  keyword: String.raw`\b(?:${typescriptKeywords})\b`,
  call: String.raw`\b[A-Za-z_$][\w$]*(?=\s*(?:<[^<>()\n]*>)?\()`,
  type: String.raw`\b[A-Z][\w$]*`,
};

// CSS: properties as types, values' numbers and colours as numbers, functions as calls, at-rules as keywords.
const css = {
  comment: String.raw`/\*[\s\S]*?\*/`,
  string: String.raw`"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'`,
  keyword: String.raw`@[\w-]+|!important\b`,
  meta: String.raw`--[\w-]+`,
  type: String.raw`(?<=^[ \t]*|[{;][ \t]*)-?[a-z][\w-]*(?=[ \t]*:)`,
  call: String.raw`\b[a-zA-Z-]+(?=\()`,
  number: String.raw`#[0-9a-fA-F]{3,8}\b|(?<![\w-])-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?`,
};

const html = {
  comment: String.raw`<!--[\s\S]*?-->`,
  meta: String.raw`<!(?:DOCTYPE|doctype)[^>]*>|\b[a-zA-Z][\w:.-]*(?==)`,
  string: String.raw`"[^"]*"|'[^']*'`,
  type: String.raw`(?<=<\/?)[a-zA-Z][\w-]*`,
};

// Markdown: headings as types, fences and front matter as meta, inline code as strings.
const markdown = {
  comment: String.raw`<!--[\s\S]*?-->`,
  meta: String.raw`^(?:\x60{3,}|~{3,})[^\n]*|^---[ \t]*$`,
  type: String.raw`^#{1,6}[ \t][^\n]*`,
  string: String.raw`\x60[^\x60\n]+\x60`,
  keyword: String.raw`^[ \t]*(?:[-*+]|\d+\.)(?=[ \t])`,
};

// In a shell the program is the type and its switches are the keywords.
const shell = {
  comment: String.raw`(?<!\S)#[^\n]*`,
  string: String.raw`"[^"\n]*"|'[^'\n]*'`,
  type: String.raw`^[ \t]*(?:[.&][ \t]+)?[A-Za-z_./\\][\w./\\:-]*(?![\w./\\:-]|[ \t]*=)`,
  keyword: String.raw`(?<=\s)--?[A-Za-z][\w-]*`,
  meta: String.raw`\$[A-Za-z_][\w:]*`,
  number: String.raw`(?<![\w.-])\d+(?:\.\d+)?\b`,
};

// Data files: keys as types, literals as strings and numbers.
const data = {
  comment: String.raw`//[^\n]*|/\*[\s\S]*?\*/|(?<!\S)#[^\n]*`,
  type: String.raw`"(?:[^"\\\n]|\\.)*"(?=\s*:)|^[ \t]*(?:-[ \t]+)?[\w.-]+(?=:(?:\s|$))`,
  string: String.raw`"(?:[^"\\\n]|\\.)*"|'[^'\n]*'`,
  number: String.raw`(?<![\w.-])-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`,
  keyword: String.raw`\b(?:true|false|null)\b`,
};

const xml = {
  comment: String.raw`<!--[\s\S]*?-->`,
  meta: String.raw`<\?[\s\S]*?\?>|\b[a-zA-Z][\w:.-]*(?==)`,
  string: String.raw`"[^"]*"|'[^']*'`,
  type: String.raw`(?<=<\/?)[a-zA-Z][\w:.-]*`,
};

const compile = (rules) =>
  new RegExp(
    Object.entries(rules)
      .map(([name, source]) => `(?<${name}>${source})`)
      .join('|'),
    'gm',
  );

const patterns = {
  csharp: compile(csharp),
  typescript: compile(typescript),
  css: compile(css),
  html: compile(html),
  markdown: compile(markdown),
  powershell: compile(shell),
  bat: compile(shell),
  shell: compile(shell),
  json: compile(data),
  yaml: compile(data),
  xml: compile(xml),
};

const languages = {
  cs: 'csharp',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  js: 'typescript',
  jsx: 'typescript',
  mjs: 'typescript',
  cjs: 'typescript',
  css: 'css',
  html: 'html',
  md: 'markdown',
  ps1: 'powershell',
  psd1: 'powershell',
  cmd: 'bat',
  bat: 'bat',
  sh: 'shell',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  csproj: 'xml',
  props: 'xml',
  slnx: 'xml',
  http: 'shell',
};

/** The language a file is coloured as, by its extension. */
export function languageFor(filePath) {
  const extension = String(filePath).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  return languages[extension] ?? (extension || 'text');
}

/** Colours `source` as a flat list of `{ cls, text }` segments; `cls` is empty for plain text. */
export function tokenize(source, language) {
  const text = String(source ?? '').replace(/\r\n/g, '\n');
  const pattern = patterns[language];
  if (!pattern) return text ? [{ cls: '', text }] : [];
  const segments = [];
  let position = 0;
  for (const match of text.matchAll(pattern)) {
    if (match[0].length === 0) continue;
    if (match.index > position) segments.push({ cls: '', text: text.slice(position, match.index) });
    const name = Object.keys(match.groups).find((group) => match.groups[group] !== undefined);
    segments.push({ cls: `tok-${name}`, text: match[0] });
    position = match.index + match[0].length;
  }
  if (position < text.length) segments.push({ cls: '', text: text.slice(position) });
  return segments;
}

/**
 * Colours `source` line by line: one array of segments per line, a token that spans lines keeping its
 * class on each. A trailing newline does not add an empty last line.
 */
export function highlight(source, language) {
  const lines = [[]];
  for (const segment of tokenize(source, language)) {
    segment.text.split('\n').forEach((piece, index) => {
      if (index > 0) lines.push([]);
      if (piece) lines.at(-1).push({ cls: segment.cls, text: piece });
    });
  }
  if (lines.length > 1 && lines.at(-1).length === 0) lines.pop();
  return lines;
}

const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (character) => escapes[character]);

/** One line's segments as HTML for a single `.nb-code-text` span. */
export function lineHtml(segments) {
  return segments.map(({ cls, text }) => (cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text))).join('');
}
