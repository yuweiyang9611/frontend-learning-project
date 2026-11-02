import { h, type FunctionalComponent } from 'vue';
import { haltParts } from './notebook-text.mjs';

/**
 * Renders a string with the kit's half-width spans already in place, so Vue owns them and theme.js's
 * runtime pass has nothing to replace. Use it for any text that comes from data: quiz copy, titles,
 * headings. Static template copy should simply avoid a curly quote touching a comma or full stop.
 */
const NbText: FunctionalComponent<{ text: string }> = (props) =>
  haltParts(props.text).map((part) => (part.halt ? h('span', { class: 'nb-halt' }, part.text) : part.text));

NbText.props = ['text'];

export default NbText;
