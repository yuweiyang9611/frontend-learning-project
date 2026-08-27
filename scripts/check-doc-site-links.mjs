import fs from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const outputRoot = path.join(repositoryRoot, "docs", ".vitepress", "dist");
const siteBase = "/frontend-learning-project/";
const auditOrigin = "https://link-audit.invalid";
const siteRoot = new URL(siteBase, auditOrigin);

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
const htmlFiles = collectFiles(outputRoot, (name) => name.endsWith(".html"));
const attributePattern = /\b(?:href|src)="([^"]+)"/g;

for (const htmlFile of htmlFiles) {
  const sourcePath = path
    .relative(outputRoot, htmlFile)
    .split(path.sep)
    .join("/");
  const sourceUrl = new URL(sourcePath, siteRoot);
  const html = fs.readFileSync(htmlFile, "utf8");

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

console.log(
  `Checked ${htmlFiles.length} generated HTML page(s): all local href/src targets exist.`,
);
