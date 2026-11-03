// One Shiki theme whose colours are the kit's tokens, so code follows data-theme without a second
// theme and keeps the kit's `.tok-*` assignments: keyword and number purple, type cyan, call blue,
// string green, comment and meta Soft Ink. Red is not used in code.
const ink = 'var(--nb-ink)';
const soft = 'var(--nb-ink-soft)';
const purple = 'var(--nb-purple)';
const cyan = 'var(--nb-cyan)';
const blue = 'var(--nb-blue)';
const green = 'var(--nb-green)';

export const notebookCodeTheme = {
  name: 'notebook',
  type: 'light',
  colors: {
    'editor.foreground': ink,
    'editor.background': 'var(--nb-sheet)',
  },
  tokenColors: [
    { settings: { foreground: ink } },
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring.multi'],
      settings: { foreground: soft },
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.type',
        'variable.language',
        'constant.language',
        'constant.numeric',
        'constant.character.escape',
      ],
      settings: { foreground: purple },
    },
    {
      scope: [
        'keyword.operator',
        'keyword.operator.assignment',
        'keyword.operator.arithmetic',
        'keyword.operator.comparison',
        'keyword.operator.logical',
        'keyword.operator.relational',
        'keyword.operator.ternary',
        'keyword.operator.optional',
        'keyword.operator.spread',
        'keyword.operator.rest',
        'keyword.operator.accessor',
        'punctuation',
      ],
      settings: { foreground: ink },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'entity.name.tag',
        'support.type.primitive',
      ],
      settings: { foreground: cyan },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'],
      settings: { foreground: blue },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'string.regexp', 'punctuation.definition.string'],
      settings: { foreground: green },
    },
    {
      scope: ['meta.decorator', 'meta.preprocessor', 'entity.name.function.decorator', 'punctuation.decorator'],
      settings: { foreground: soft },
    },
  ],
};
