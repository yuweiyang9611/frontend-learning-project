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

if (metadataProblems.length > 0) {
  console.error(`Found ${metadataProblems.length} metadata problem(s):`);
  for (const problem of metadataProblems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} generated HTML page(s): links, canonical URLs, Open Graph URLs, and homepage title are valid.`,
);
