import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

function parseArguments(argv) {
  const options = {
    directory: 'backend/TestResults',
    lines: 0,
    branches: 0,
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];

    if (!value || !['--directory', '--lines', '--branches'].includes(flag)) {
      throw new Error(
        'Usage: node scripts/check-cobertura-coverage.mjs --directory <path> --lines <percent> --branches <percent>',
      );
    }

    const key = flag.slice(2);
    options[key] = key === 'directory' ? value : Number(value);
  }

  if (
    !Number.isFinite(options.lines) ||
    !Number.isFinite(options.branches) ||
    options.lines < 0 ||
    options.lines > 100 ||
    options.branches < 0 ||
    options.branches > 100
  ) {
    throw new Error('Coverage thresholds must be numbers between 0 and 100.');
  }

  return options;
}

async function findReports(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const reports = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      reports.push(...(await findReports(entryPath)));
    } else if (entry.name === 'coverage.cobertura.xml') {
      const metadata = await stat(entryPath);
      reports.push({ path: entryPath, modifiedAt: metadata.mtimeMs });
    }
  }

  return reports;
}

function readRate(openingTag, attribute) {
  const match = openingTag.match(new RegExp(`\\b${attribute}="([0-9.]+)"`));

  if (!match) {
    throw new Error(`Cobertura report is missing ${attribute}.`);
  }

  return Number(match[1]) * 100;
}

const options = parseArguments(process.argv.slice(2));
const reports = await findReports(path.resolve(options.directory));

if (reports.length === 0) {
  throw new Error(`No coverage.cobertura.xml report found under ${options.directory}.`);
}

const latestReport = reports.sort((left, right) => right.modifiedAt - left.modifiedAt)[0];
const report = await readFile(latestReport.path, 'utf8');
const openingTag = report.match(/<coverage\b[^>]*>/)?.[0];

if (!openingTag) {
  throw new Error(`${latestReport.path} is not a valid Cobertura report.`);
}

const lineCoverage = readRate(openingTag, 'line-rate');
const branchCoverage = readRate(openingTag, 'branch-rate');

console.log(`Backend coverage: lines ${lineCoverage.toFixed(2)}%, branches ${branchCoverage.toFixed(2)}%`);

const failures = [];

if (lineCoverage < options.lines) {
  failures.push(`line coverage ${lineCoverage.toFixed(2)}% is below ${options.lines.toFixed(2)}%`);
}

if (branchCoverage < options.branches) {
  failures.push(`branch coverage ${branchCoverage.toFixed(2)}% is below ${options.branches.toFixed(2)}%`);
}

if (failures.length > 0) {
  throw new Error(`Backend coverage gate failed: ${failures.join('; ')}.`);
}

console.log(`Backend coverage gate passed using ${path.relative(process.cwd(), latestReport.path)}.`);
