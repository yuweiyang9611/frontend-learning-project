// The kit switches colours on <html data-theme>, and VitePress's own styles switch on <html class="dark">.
// The family's choice lives under `site-theme` (light or dark) and theme.js applies it in <head>. This
// site turns VitePress's own appearance machinery off (appearance: false in config.mts) and keeps the
// `dark` class mirroring data-theme, in both directions, from the first paint on.

export const SCHEME_KEY = 'site-theme';
// What VitePress stored before the redesign. Read only, and only when the family has no choice yet,
// so a reader who picked dark on the old site keeps it until they pick in the family control.
export const LEGACY_KEY = 'vitepress-theme-appearance';
export const PAPER = { light: '#f4efe4', dark: '#1c1a17' };

/** The scheme the reader chose, or null to follow the system, as theme.js does. */
export function storedScheme(storage) {
  try {
    const family = storage?.getItem(SCHEME_KEY);
    if (family === 'light' || family === 'dark') return family;
    const legacy = storage?.getItem(LEGACY_KEY);
    if (legacy === 'light' || legacy === 'dark') return legacy;
  } catch {
    // Storage can be unavailable; the system scheme still applies.
  }
  return null;
}

/**
 * Runs inline in <head> right after theme.js (see config.mts), so it must not use anything outside its
 * own body. It applies the legacy choice when the family has none, mirrors data-theme to the `dark`
 * class and back, and marks the page as scripted for the kit's collapsing nav.
 */
export function headBridge() {
  const root = document.documentElement;
  const paper = { light: '#f4efe4', dark: '#1c1a17' };
  const setScheme = (scheme) => {
    if (root.dataset.theme !== scheme) root.dataset.theme = scheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paper[scheme]);
  };
  try {
    const family = localStorage.getItem('site-theme');
    const legacy = localStorage.getItem('vitepress-theme-appearance');
    if (family !== 'light' && family !== 'dark' && (legacy === 'light' || legacy === 'dark')) setScheme(legacy);
  } catch {
    // Storage can be unavailable; theme.js has already applied the system scheme.
  }
  const classFollows = () => {
    const dark = root.dataset.theme === 'dark';
    if (root.classList.contains('dark') !== dark) root.classList.toggle('dark', dark);
  };
  classFollows();
  root.classList.add('js');
  new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === 'data-theme')) classFollows();
    else setScheme(root.classList.contains('dark') ? 'dark' : 'light');
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
}

/**
 * VitePress's `isDark` follows data-theme too, once the app has mounted, and writes back if anything
 * sets it, so a default-theme part that reads it agrees with the page. Nothing here stores a choice.
 */
export function bridgeIsDark(isDark, root, watch) {
  const follow = () => {
    const dark = root.dataset.theme === 'dark';
    if (isDark.value !== dark) isDark.value = dark;
  };
  follow();
  new MutationObserver(follow).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  watch(isDark, (dark) => {
    const scheme = dark ? 'dark' : 'light';
    if (root.dataset.theme !== scheme) chooseScheme(root, null, scheme);
  });
}

/** The 白天 and 晚上 words: apply the scheme now and remember it for the whole family. */
export function chooseScheme(root, storage, scheme) {
  if (scheme !== 'light' && scheme !== 'dark') return;
  root.dataset.theme = scheme;
  root.ownerDocument?.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAPER[scheme]);
  try {
    storage?.setItem(SCHEME_KEY, scheme);
  } catch {
    // The scheme still applies for this visit if storage is unavailable.
  }
}
