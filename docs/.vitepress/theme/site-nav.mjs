// Route helpers for the running head and the contents column. Links in config.mts have no base.

/** '90-days/index.md' -> '/90-days/', '90-days/how-to-study.md' -> '/90-days/how-to-study'. */
export function pagePath(relativePath) {
  const path = '/' + String(relativePath ?? '').replace(/\.md$/, '');
  return path.endsWith('/index') ? path.slice(0, -'index'.length) : path;
}

/** Normalises a config link to the same shape as pagePath. */
export function linkPath(link) {
  const path = String(link ?? '').split('#')[0].replace(/\.(md|html)$/, '');
  return path.endsWith('/index') ? path.slice(0, -'index'.length) : path;
}

export function isCurrentPage(link, relativePath) {
  return linkPath(link) === pagePath(relativePath);
}

export function isActiveNav(item, relativePath) {
  const path = pagePath(relativePath);
  if (item.activeMatch) return new RegExp(item.activeMatch).test(path);
  const target = linkPath(item.link);
  return target === '/' ? path === '/' : path.startsWith(target);
}

/** The sidebar groups whose key prefixes the page, the longest key winning. */
export function sidebarFor(sidebar, relativePath) {
  if (!sidebar) return [];
  if (Array.isArray(sidebar)) return sidebar;
  const path = '/' + String(relativePath ?? '');
  const key = Object.keys(sidebar)
    .sort((left, right) => right.length - left.length)
    .find((prefix) => path.startsWith(prefix));
  return key ? sidebar[key] : [];
}

export function flatLinks(groups) {
  return groups.flatMap((group) => (group.items ?? [group]).filter((item) => item.link));
}

/** Previous and next pages in the section's reading order. */
export function neighbours(groups, relativePath) {
  const links = flatLinks(groups);
  const index = links.findIndex((item) => isCurrentPage(item.link, relativePath));
  if (index === -1) return { prev: null, next: null };
  return { prev: links[index - 1] ?? null, next: links[index + 1] ?? null };
}
