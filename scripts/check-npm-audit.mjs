import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = process.cwd();
const options = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), values[index + 1]]);
    return pairs;
  }, []),
);
const workspace = options.workspace;
const minimumSeverity = options.level ?? 'high';
if (!workspace) throw new Error('Usage: check-npm-audit.mjs --workspace <path> [--level high] [--exceptions file]');

const severityRank = new Map([
  ['info', 0],
  ['low', 1],
  ['moderate', 2],
  ['high', 3],
  ['critical', 4],
]);
if (!severityRank.has(minimumSeverity)) throw new Error(`Unknown audit level: ${minimumSeverity}`);

const workspaceDirectory = workspace === '/' ? repositoryRoot : path.resolve(repositoryRoot, workspace);
const npmCli = process.env.npm_execpath;
const npmCommand = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmArguments = npmCli
  ? [npmCli, 'audit', '--json', '--audit-level=' + minimumSeverity]
  : ['audit', '--json', '--audit-level=' + minimumSeverity];
const audit = spawnSync(npmCommand, npmArguments, {
  cwd: workspaceDirectory,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
  shell: false,
});
if (audit.error) throw audit.error;

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  throw new Error(`npm audit did not return JSON (exit ${audit.status ?? 'unknown'}): ${audit.stderr.trim()}`);
}
if (report.error || !report.vulnerabilities || ![0, 1].includes(audit.status)) {
  throw new Error(`npm audit failed closed: ${report.error?.summary ?? audit.stderr.trim() ?? 'invalid report'}`);
}

const exceptionDocument = options.exceptions
  ? JSON.parse(await readFile(path.resolve(repositoryRoot, options.exceptions), 'utf8'))
  : { schemaVersion: 1, exceptions: [] };
if (exceptionDocument.schemaVersion !== 1 || !Array.isArray(exceptionDocument.exceptions)) {
  throw new Error('The npm audit exception document must use schemaVersion 1.');
}
const workspaceExceptions = exceptionDocument.exceptions.filter(
  (item) => item.ecosystem === 'npm' && item.workspace === workspace,
);
const now = Date.now();
for (const item of workspaceExceptions) {
  if (!Number.isFinite(Date.parse(item.createdAt)) || !Number.isFinite(Date.parse(item.expiresAt))) {
    throw new Error(`Audit exception ${item.advisoryId} has an invalid review date.`);
  }
  if (Date.parse(item.expiresAt) <= now) throw new Error(`Audit exception ${item.advisoryId} expired at ${item.expiresAt}.`);
}

const lock = JSON.parse(await readFile(path.join(workspaceDirectory, 'package-lock.json'), 'utf8'));
const packageEntries = lock.packages ?? {};
const rootDependencies = {
  ...(packageEntries['']?.dependencies ?? {}),
  ...(packageEntries['']?.devDependencies ?? {}),
  ...(packageEntries['']?.optionalDependencies ?? {}),
};

function installedEntry(name, parentEntry = '') {
  const nested = parentEntry ? `${parentEntry}/node_modules/${name}` : `node_modules/${name}`;
  return packageEntries[nested] ? [nested, packageEntries[nested]] : [`node_modules/${name}`, packageEntries[`node_modules/${name}`]];
}

function dependencyPaths(targetName) {
  const queue = Object.keys(rootDependencies).map((name) => {
    const [entry, metadata] = installedEntry(name);
    return { entry, name, metadata, labels: metadata ? [`${name}@${metadata.version}`] : [] };
  });
  const visited = new Set();
  const matches = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current.metadata || visited.has(current.entry + '\0' + current.labels.join(' > '))) continue;
    visited.add(current.entry + '\0' + current.labels.join(' > '));
    if (current.name === targetName) matches.push(current.labels.join(' > '));
    const dependencies = {
      ...(current.metadata.dependencies ?? {}),
      ...(current.metadata.optionalDependencies ?? {}),
    };
    for (const name of Object.keys(dependencies)) {
      const [entry, metadata] = installedEntry(name, current.entry);
      if (metadata && current.labels.length < 20) {
        queue.push({
          entry,
          name,
          metadata,
          labels: [...current.labels, `${name}@${metadata.version}`],
        });
      }
    }
  }
  return [...new Set(matches)].sort((left, right) => left.split(' > ').length - right.split(' > ').length);
}

function advisoryId(url) {
  try {
    return new URL(url).pathname.split('/').filter(Boolean).at(-1);
  } catch {
    return undefined;
  }
}

const advisories = [];
for (const [packageName, vulnerability] of Object.entries(report.vulnerabilities)) {
  for (const via of vulnerability.via ?? []) {
    if (!via || typeof via !== 'object') continue;
    advisories.push({
      package: via.name ?? packageName,
      source: Number(via.source),
      advisoryId: advisoryId(via.url),
      severity: via.severity,
      range: via.range,
      title: via.title,
      url: via.url,
      fixAvailable: vulnerability.fixAvailable,
    });
  }
}
const uniqueAdvisories = [
  ...new Map(advisories.map((item) => [`${item.source}:${item.package}`, item])).values(),
];
const usedExceptions = new Set();
const failures = [];

for (const advisory of uniqueAdvisories) {
  const rank = severityRank.get(advisory.severity) ?? Number.POSITIVE_INFINITY;
  if (rank < severityRank.get(minimumSeverity)) {
    console.warn(`npm audit notice: ${advisory.severity} ${advisory.advisoryId ?? advisory.source} in ${advisory.package}`);
    continue;
  }
  const candidate = workspaceExceptions.find(
    (item) =>
      item.package === advisory.package &&
      item.advisoryId === advisory.advisoryId &&
      Number(item.npmSource) === advisory.source,
  );
  if (!candidate) {
    failures.push(`unapproved ${advisory.severity} advisory ${advisory.advisoryId ?? advisory.source} in ${advisory.package}`);
    continue;
  }
  const paths = dependencyPaths(advisory.package);
  const observedVersion = candidate.dependencyPath.split(' > ').at(-1)?.split('@').at(-1);
  const staleReasons = [];
  if (candidate.severity !== advisory.severity) staleReasons.push(`severity is now ${advisory.severity}`);
  if (candidate.affectedRange !== advisory.range) staleReasons.push(`affected range is now ${advisory.range}`);
  if (candidate.fixAvailableAtReview !== false || advisory.fixAvailable !== false) staleReasons.push('a fix is now available');
  if (candidate.observedVersion !== observedVersion) staleReasons.push('observedVersion does not match dependencyPath');
  if (!paths.includes(candidate.dependencyPath)) staleReasons.push(`dependency path changed (found: ${paths.join(', ') || 'none'})`);
  if (staleReasons.length) {
    failures.push(`stale exception for ${candidate.advisoryId}: ${staleReasons.join('; ')}`);
  } else {
    usedExceptions.add(candidate);
    console.warn(`npm audit exception: ${candidate.advisoryId} for ${candidate.dependencyPath} expires ${candidate.expiresAt}`);
  }
}

for (const item of workspaceExceptions) {
  if (!usedExceptions.has(item)) failures.push(`unused exception ${item.advisoryId}; remove it or update it after review`);
}
if (failures.length) throw new Error('npm audit policy failed:\n- ' + failures.join('\n- '));
console.log(`npm audit policy passed for ${workspace} at severity ${minimumSeverity}.`);
