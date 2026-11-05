import fs from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const outputRoot = path.join(repositoryRoot, "docs", ".vitepress", "dist");
const siteBase = "/frontend-learning-project/";
const auditOrigin = "https://link-audit.invalid";
const siteRoot = new URL(siteBase, auditOrigin);
const canonicalRoot = new URL(siteBase, "https://yuweiyang9611.github.io");

if (!fs.existsSync(outputRoot)) {
  console.error(`Missing VitePress output: ${outputRoot}`);
  console.error('Run "npm run docs:build" before checking generated links.');
  process.exit(1);
}

function collectFiles(directory, predicate, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, predicate, result);
    } else if (entry.isFile() && predicate(entry.name)) {
      result.push(fullPath);
    }
  }
  return result;
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function targetCandidates(targetUrl) {
  const relativePath = decodeURIComponent(
    targetUrl.pathname.slice(siteRoot.pathname.length),
  ).replace(/^\/+/, "");

  if (!relativePath || targetUrl.pathname.endsWith("/")) {
    return [path.join(outputRoot, relativePath, "index.html")];
  }

  if (path.extname(relativePath)) {
    return [path.join(outputRoot, relativePath)];
  }

  return [
    path.join(outputRoot, `${relativePath}.html`),
    path.join(outputRoot, relativePath, "index.html"),
  ];
}

const brokenLinks = [];
const metadataProblems = [];
const htmlFiles = collectFiles(outputRoot, (name) => name.endsWith(".html"));
const attributePattern = /\b(?:href|src)="([^"]+)"/g;

function tagAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/\b([\w:-]+)="([^"]*)"/g)].map((match) => [
      match[1].toLowerCase(),
      decodeHtmlAttribute(match[2]),
    ]),
  );
}

for (const htmlFile of htmlFiles) {
  const sourcePath = path
    .relative(outputRoot, htmlFile)
    .split(path.sep)
    .join("/");
  const sourceUrl = new URL(sourcePath, siteRoot);
  const html = fs.readFileSync(htmlFile, "utf8");

  const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => tagAttributes(match[0]))
    .filter((attributes) => attributes.rel === "canonical");
  const openGraphUrlTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => tagAttributes(match[0]))
    .filter((attributes) => attributes.property === "og:url");

  const isNotFoundPage = sourcePath === "404.html";
  if (!isNotFoundPage && canonicalTags.length !== 1) {
    metadataProblems.push(`${sourcePath}: expected one canonical link, found ${canonicalTags.length}`);
  }
  if (!isNotFoundPage && openGraphUrlTags.length !== 1) {
    metadataProblems.push(`${sourcePath}: expected one og:url, found ${openGraphUrlTags.length}`);
  }
  if (canonicalTags.length === 1 && openGraphUrlTags.length === 1) {
    const canonical = canonicalTags[0].href;
    if (canonical !== openGraphUrlTags[0].content) {
      metadataProblems.push(`${sourcePath}: canonical and og:url differ`);
    }
    try {
      const canonicalTarget = new URL(canonical);
      if (
        canonicalTarget.origin !== canonicalRoot.origin ||
        !canonicalTarget.pathname.startsWith(canonicalRoot.pathname) ||
        !targetCandidates(canonicalTarget).some((candidate) => fs.existsSync(candidate))
      ) {
        metadataProblems.push(`${sourcePath}: canonical does not map to a generated page`);
      }
    } catch {
      metadataProblems.push(`${sourcePath}: canonical is not a valid absolute URL`);
    }
  }

  if (sourcePath === "index.html") {
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    if (title !== "IssueFlow 学习站") {
      metadataProblems.push(`index.html: expected non-duplicated title, got ${title ?? "missing"}`);
    }
  }

  for (const match of html.matchAll(attributePattern)) {
    const rawTarget = decodeHtmlAttribute(match[1]);
    if (
      rawTarget.startsWith("#") ||
      rawTarget.startsWith("data:") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("tel:") ||
      rawTarget.startsWith("javascript:")
    ) {
      continue;
    }

    let targetUrl;
    try {
      targetUrl = new URL(rawTarget, sourceUrl);
    } catch {
      brokenLinks.push({ sourcePath, rawTarget, reason: "invalid URL" });
      continue;
    }

    if (
      targetUrl.origin !== siteRoot.origin ||
      !targetUrl.pathname.startsWith(siteRoot.pathname)
    ) {
      continue;
    }

    const candidates = targetCandidates(targetUrl);
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      brokenLinks.push({
        sourcePath,
        rawTarget,
        reason: "missing generated target",
      });
    }
  }
}

const uniqueBrokenLinks = [
  ...new Map(
    brokenLinks.map((link) => [
      `${link.sourcePath}\0${link.rawTarget}\0${link.reason}`,
      link,
    ]),
  ).values(),
].sort(
  (left, right) =>
    left.sourcePath.localeCompare(right.sourcePath) ||
    left.rawTarget.localeCompare(right.rawTarget),
);

if (uniqueBrokenLinks.length > 0) {
  console.error(
    `Found ${uniqueBrokenLinks.length} broken link(s) in generated documentation:`,
  );
  for (const link of uniqueBrokenLinks) {
    console.error(`- ${link.sourcePath} -> ${link.rawTarget} (${link.reason})`);
  }
  process.exit(1);
}

// Source read in place: the bundle and its index are in the output, every file the index lists is there,
// every panel tab on a page points at a bundled file, and no page sends the reader to GitHub for a file or
// folder the site carries. The panel's own 在 GitHub 打开 link (a.nb-code-link) and <noscript> content are
// the two allowed exceptions. The source page is noindex and out of the sitemap.
const sourceProblems = [];
const sourceIndexPath = path.join(outputRoot, "source", "index.json");
const bundledPaths = new Set();
const bundledDirectories = new Set();
if (!fs.existsSync(sourceIndexPath)) {
  sourceProblems.push("source/index.json is missing: run scripts/bundle-doc-source.mjs before the build");
} else {
  const sourceIndex = JSON.parse(fs.readFileSync(sourceIndexPath, "utf8"));
  if (sourceIndex.version !== 1 || !Array.isArray(sourceIndex.files) || sourceIndex.files.length < 150) {
    sourceProblems.push("source/index.json must list the learning folders (version 1, at least 150 files)");
  }
  for (const entry of sourceIndex.files ?? []) {
    bundledPaths.add(entry.path);
    const parts = entry.path.split("/");
    for (let depth = 1; depth < parts.length; depth += 1) bundledDirectories.add(parts.slice(0, depth).join("/"));
    if (!fs.existsSync(path.join(outputRoot, "source", `${entry.path}.txt`))) {
      sourceProblems.push(`bundled source file is missing: ${entry.path}`);
    }
  }
}
const repositoryLink = /href="https:\/\/github\.com\/yuweiyang9611\/frontend-learning-project\/(blob|tree)\/[^/"]+\/([^"#?]+?)\/?(?:[#?][^"]*)?"/g;
let sourcePageLinks = 0;
for (const htmlFile of htmlFiles) {
  const sourcePath = path.relative(outputRoot, htmlFile).split(path.sep).join("/");
  const html = fs.readFileSync(htmlFile, "utf8");
  const body = html.slice(html.indexOf("<body"));
  const visible = body.replace(/<noscript>[\s\S]*?<\/noscript>/g, "").replace(/<a class="nb-code-link"[^>]*>/g, "");
  for (const match of visible.matchAll(repositoryLink)) {
    const target = decodeURIComponent(decodeHtmlAttribute(match[2]));
    if (match[1] === "blob" && bundledPaths.has(target)) {
      sourceProblems.push(`${sourcePath} sends the reader to GitHub for a bundled file: ${target}`);
    }
    if (match[1] === "tree" && bundledDirectories.has(target)) {
      sourceProblems.push(`${sourcePath} sends the reader to GitHub for a bundled folder: ${target}`);
    }
  }
  for (const match of body.matchAll(/class="nb-code-tab"[^>]*\bdata-path="([^"]+)"/g)) {
    const target = decodeHtmlAttribute(match[1]);
    if (!bundledPaths.has(target)) sourceProblems.push(`${sourcePath} shows a panel tab for a file outside the bundle: ${target}`);
  }
  sourcePageLinks += (body.match(/href="[^"]*\/reference\/source\.html\?(?:path|dir)=/g) ?? []).length;
  if (sourcePath === "reference/source.html") {
    if (!/<meta name="robots" content="noindex">/.test(html)) sourceProblems.push("reference/source.html must be noindex");
    if (!body.includes("<noscript>")) sourceProblems.push("reference/source.html must keep a <noscript> way to the repository");
  }
}
if (sourcePageLinks < 100) sourceProblems.push(`expected the pages to link into the source page at least 100 times, found ${sourcePageLinks}`);
const sitemapPath = path.join(outputRoot, "sitemap.xml");
if (fs.existsSync(sitemapPath) && fs.readFileSync(sitemapPath, "utf8").includes("reference/source.html")) {
  sourceProblems.push("sitemap.xml must not list reference/source.html");
}

if (sourceProblems.length > 0) {
  console.error(`Found ${sourceProblems.length} source-in-place problem(s):`);
  for (const problem of sourceProblems) console.error(`- ${problem}`);
  process.exit(1);
}

if (metadataProblems.length > 0) {
  console.error(`Found ${metadataProblems.length} metadata problem(s):`);
  for (const problem of metadataProblems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} generated HTML page(s): links, canonical URLs, Open Graph URLs, homepage title and source-in-place links are valid (${bundledPaths.size} bundled files, ${sourcePageLinks} links into the source page).`,
);
