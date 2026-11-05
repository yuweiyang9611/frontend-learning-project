// Source read in place, the part shared by the build and the browser: where the bundle is served, how a
// repository path becomes a URL, and how a GitHub link turns into the site's own source page. No Node
// imports here, so the Vue components can use it.

/** Where the site serves the bundle (`<base>/source/<path>.txt` and `index.json`) and shows it. */
export const SOURCE_ASSET_PATH = '/source/';
export const SOURCE_PAGE = '/reference/source';

/** Encodes a repository path for a URL, keeping its slashes readable. */
export function encodeSourcePath(filePath) {
  return filePath.split('/').map(encodeURIComponent).join('/');
}

/** A `#L5-L9` fragment, or `#L5`, as a sorted range; anything else is null. */
export function parseLineRange(hash) {
  const match = String(hash ?? '').match(/^#?L(\d+)(?:-L?(\d+))?$/);
  if (!match) return null;
  const from = Number(match[1]);
  const to = Number(match[2] ?? match[1]);
  return [Math.min(from, to), Math.max(from, to)];
}

export const fileName = (filePath) => String(filePath).split('/').pop();

/**
 * Turns a GitHub `blob/<ref>/<path>` or `tree/<ref>/<dir>` link into the site's own source page when
 * the target is in the bundle. Returns null for every other link. `isBundled(path)` and
 * `hasBundledDirectory(dir)` decide; `#L5-L9` keeps its line range, other fragments drop.
 */
export function rewriteRepositoryLink(href, { repository, isBundled, hasBundledDirectory, sourcePage = SOURCE_PAGE }) {
  const root = repository.replace(/\/+$/, '');
  if (!href.startsWith(`${root}/`)) return null;
  const match = href.slice(root.length + 1).match(/^(blob|tree)\/[^/]+\/([^#?]*)(#.*)?$/);
  if (!match) return null;
  const [, kind, rawPath, fragment = ''] = match;
  let target;
  try {
    target = decodeURIComponent(rawPath).replace(/\/+$/, '');
  } catch {
    return null;
  }
  if (!target) return null;
  if (kind === 'blob') {
    if (!isBundled(target)) return null;
    const range = parseLineRange(fragment);
    const lines = range ? `#L${range[0]}${range[1] !== range[0] ? `-L${range[1]}` : ''}` : '';
    return `${sourcePage}.html?path=${encodeSourcePath(target)}${lines}`;
  }
  if (!hasBundledDirectory(target)) return null;
  return `${sourcePage}.html?dir=${encodeSourcePath(target)}`;
}

/** Lookups over a list of bundled paths. */
export function bundleLookup(paths) {
  const files = new Set(paths);
  const directories = new Set();
  for (const filePath of files) {
    const parts = filePath.split('/');
    for (let depth = 1; depth < parts.length; depth += 1) directories.add(parts.slice(0, depth).join('/'));
  }
  return {
    isBundled: (filePath) => files.has(filePath),
    hasBundledDirectory: (directory) => directories.has(directory),
    files,
    directories,
  };
}

/** The entries of one bundled directory: subdirectories first, each with its file count, lines and bytes. */
export function directoryEntries(files, directory) {
  const prefix = directory ? `${directory}/` : '';
  const children = new Map();
  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    const rest = file.path.slice(prefix.length);
    const slash = rest.indexOf('/');
    const name = slash === -1 ? rest : rest.slice(0, slash);
    const entry = children.get(name) ?? { name, path: prefix + name, directory: slash !== -1, files: 0, bytes: 0, lines: 0 };
    entry.files += 1;
    entry.bytes += file.bytes;
    entry.lines += file.lines;
    children.set(name, entry);
  }
  return [...children.values()].sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
}

/** The other files beside `filePath` in its directory. */
export function siblingFiles(files, filePath) {
  const directory = filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/')) : '';
  return directoryEntries(files, directory).filter((entry) => !entry.directory && entry.path !== filePath);
}
