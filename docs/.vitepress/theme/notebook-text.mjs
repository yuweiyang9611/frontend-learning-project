// Chinese text setting that has to happen before Vue sees the page.
//
// The kit's theme.js sets the first of two touching marks at half width by replacing text nodes with
// <span class="nb-halt">, on DOMContentLoaded and for nodes added later. VitePress hydrates after
// DOMContentLoaded, so a replacement there would change server-rendered text under Vue. This module
// emits the same spans at build time (markdown) and at render time (Vue strings, through NbText), so
// the runtime pass finds nothing left to change.

// Keep this identical to `looseMarks` in docs/public/kit/theme.js; notebook-text.test.mjs checks it.
export const LOOSE_MARKS = /[”’](?=[，。、；：？！])|[，。、；：？！](?=[“‘])/g;

/** Splits text into plain runs and the marks the kit sets at half width. */
export function haltParts(text) {
  const value = String(text ?? '');
  const parts = [];
  let start = 0;
  for (const match of value.matchAll(LOOSE_MARKS)) {
    if (match.index > start) parts.push({ text: value.slice(start, match.index), halt: false });
    parts.push({ text: match[0], halt: true });
    start = match.index + 1;
  }
  if (start < value.length) parts.push({ text: value.slice(start), halt: false });
  return parts;
}

/** Wraps the loose marks of already-escaped HTML text. */
export function haltHtml(html) {
  return html.replace(LOOSE_MARKS, (mark) => `<span class="nb-halt">${mark}</span>`);
}

const han = /\p{Script=Han}/u;
// Full-width punctuation as it appears in Chinese copy, including curly double quotes, the dash and the
// ellipsis. The apostrophe is left out because English text uses it.
const fullWidthMark = /[　-〿＀-･︰-﹏“”—…]/u;

/**
 * A line break inside a Chinese paragraph renders as a space in Chromium, which opens a gap of one and a
 * half characters after a full-width mark (案例， 共). Drop the break when it touches a full-width mark or
 * sits between two Han characters; keep it as a space next to Latin text.
 */
export function joinsWithoutSpace(before, after) {
  if (!before || !after) return false;
  if (fullWidthMark.test(before) || fullWidthMark.test(after)) return true;
  return han.test(before) && han.test(after);
}

function edgeCharacter(tokens, start, step) {
  for (let index = start; index >= 0 && index < tokens.length; index += step) {
    const token = tokens[index];
    if (token.type === 'text' || token.type === 'code_inline') {
      if (token.content) return step < 0 ? token.content.at(-1) : token.content[0];
      continue;
    }
    if (token.type.endsWith('_open') || token.type.endsWith('_close')) continue;
    return '';
  }
  return '';
}

/** markdown-it plugin: Chinese line joins and the touching-marks spans. */
export function notebookMarkdown(md) {
  md.core.ruler.push('notebook_text', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue;
      const children = block.children;
      children.forEach((token, index) => {
        if (token.type !== 'softbreak') return;
        if (joinsWithoutSpace(edgeCharacter(children, index - 1, -1), edgeCharacter(children, index + 1, 1))) {
          token.type = 'text';
          token.content = '';
        }
      });
      // Adjacent text tokens become one DOM text node, so wrap marks across the join.
      const merged = [];
      for (const token of children) {
        const last = merged.at(-1);
        if (token.type === 'text' && last?.type === 'text') last.content += token.content;
        else merged.push(token);
      }
      block.children = merged;
    }
  });

  const renderText = md.renderer.rules.text;
  md.renderer.rules.text = (tokens, index, options, env, self) =>
    haltHtml(renderText ? renderText(tokens, index, options, env, self) : md.utils.escapeHtml(tokens[index].content));
}

/**
 * markdown-it plugin: a GitHub blob or tree link whose target the site bundles becomes a link into the
 * site's source page, so no page sends the reader to GitHub for a file it carries. `rewrite(href)` returns
 * the new href or null; `env.sourceLinks` counts the rewrites for the build log and tests.
 */
export function sourceLinks(md, rewrite) {
  md.core.ruler.push('notebook_source_links', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue;
      for (const token of block.children) {
        if (token.type !== 'link_open') continue;
        const href = token.attrGet('href');
        const replacement = href ? rewrite(href) : null;
        if (!replacement) continue;
        token.attrSet('href', replacement);
        if (state.env) state.env.sourceLinks = (state.env.sourceLinks ?? 0) + 1;
      }
    }
  });
}
