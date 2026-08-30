import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createContractReport,
  formatContractSummary,
  loadHttpContractCorpus,
  runHttpContractSuite,
} from './http-harness.mjs';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const repositoryRoot = path.dirname(frontendRoot);
const activeChildren = new Set();

function parseArguments(argv) {
  const options = {
    nextUrl: process.env.CONTRACT_NEXT_BASE_URL,
    dotnetUrl: process.env.CONTRACT_DOTNET_BASE_URL,
    output: path.resolve(process.cwd(), 'test-results', 'contracts', 'http-parity.json'),
    allowRemote: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const [name, inlineValue] = argument.split('=', 2);
    if (name === '--allow-remote') {
      options.allowRemote = true;
      continue;
    }
    if (!['--next-url', '--dotnet-url', '--output'].includes(name)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = inlineValue ?? argv[++index];
    if (!value) throw new Error(`${name} needs a value.`);
    if (name === '--next-url') options.nextUrl = value;
    if (name === '--dotnet-url') options.dotnetUrl = value;
    if (name === '--output') options.output = path.resolve(process.cwd(), value);
  }
  return options;
}

function checkedBaseUrl(value, allowRemote) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  const loopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
  if (!loopback && !allowRemote) {
    throw new Error(`Refusing to run write cases against ${url.origin}; pass --allow-remote explicitly.`);
  }
  return url.origin;
}

function startProcess(name, command, args, options) {
  const logs = [];
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeChildren.add(child);
  const collect = (chunk) => {
    logs.push(...String(chunk).split(/\r?\n/).filter(Boolean));
    if (logs.length > 80) logs.splice(0, logs.length - 80);
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.once('exit', () => activeChildren.delete(child));
  return { name, child, logs };
}

async function stopProcess(processInfo) {
  if (!processInfo || processInfo.child.exitCode !== null) return;
  processInfo.child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => processInfo.child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (processInfo.child.exitCode === null) processInfo.child.kill('SIGKILL');
}

async function waitForHealth(baseUrl, processInfo, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    if (processInfo?.child.exitCode !== null) {
      throw new Error(`${processInfo.name} exited with ${processInfo.child.exitCode}.\n${processInfo.logs.join('\n')}`);
    }
    try {
      const response = await fetch(new URL('/api/health', baseUrl), { redirect: 'manual' });
      if (response.status === 200) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${baseUrl}/api/health (${lastError}).`);
}

async function runTarget({ backend, baseUrl, start }) {
  let processInfo;
  try {
    processInfo = await start?.();
    await waitForHealth(baseUrl, processInfo);
    return await runHttpContractSuite({
      backend,
      baseUrl,
      corpus: contractCorpus,
      runId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (processInfo?.logs.length) console.error(processInfo.logs.join('\n'));
    return { backend, baseUrl, passed: false, caseCount: 0, cases: [], error: message };
  } finally {
    await stopProcess(processInfo);
  }
}

function emptyRun(backend, baseUrl, error) {
  return { backend, baseUrl, passed: false, caseCount: 0, cases: [], error };
}

const options = parseArguments(process.argv.slice(2));
const { corpus: contractCorpus, digest } = loadHttpContractCorpus(repositoryRoot);
if (contractCorpus.cases.length !== 18) throw new Error('The shared HTTP corpus must contain exactly 18 cases.');
const runId = `${Date.now()}-${process.pid}`;
const nextBaseUrl = checkedBaseUrl(options.nextUrl ?? 'http://127.0.0.1:3100', options.allowRemote);
const dotnetBaseUrl = checkedBaseUrl(options.dotnetUrl ?? 'http://127.0.0.1:5180', options.allowRemote);
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'issueflow-contract-'));

let nextRun = emptyRun('next-same-origin', nextBaseUrl, 'not run');
let dotnetRun = emptyRun('dotnet-sqlite', dotnetBaseUrl, 'not run');

try {
  nextRun = await runTarget({
    backend: 'next-same-origin',
    baseUrl: nextBaseUrl,
    start: options.nextUrl
      ? undefined
      : async () => {
          const viteBin = path.join(frontendRoot, 'node_modules', 'vite', 'bin', 'vite.js');
          await fs.access(path.join(frontendRoot, 'dist'));
          return startProcess(
            'Next same-origin preview',
            process.execPath,
            [viteBin, 'preview', '--host', '127.0.0.1', '--port', '3100', '--strictPort'],
            {
              cwd: frontendRoot,
              env: {
                ...process.env,
                SITE_URL: nextBaseUrl,
                WRANGLER_WRITE_LOGS: 'false',
                WRANGLER_LOG_PATH: path.join(temporaryDirectory, 'wrangler-logs'),
                MINIFLARE_REGISTRY_PATH: path.join(temporaryDirectory, 'miniflare-registry'),
              },
            },
          );
        },
  });

  dotnetRun = await runTarget({
    backend: 'dotnet-sqlite',
    baseUrl: dotnetBaseUrl,
    start: options.dotnetUrl
      ? undefined
      : async () =>
          startProcess(
            '.NET/SQLite API',
            'dotnet',
            [
              'run',
              '--project',
              path.join(repositoryRoot, 'backend', 'IssueFlow.Api', 'IssueFlow.Api.csproj'),
              '--configuration',
              'Release',
              '--no-launch-profile',
            ],
            {
              cwd: repositoryRoot,
              env: {
                ...process.env,
                ASPNETCORE_ENVIRONMENT: 'Testing',
                ASPNETCORE_URLS: dotnetBaseUrl,
                ConnectionStrings__Default: `Data Source=${path.join(temporaryDirectory, 'issueflow.db')}`,
                AttachmentStorage__Path: path.join(temporaryDirectory, 'uploads'),
                Frontend__Origins__0: nextBaseUrl,
                DOTNET_CLI_TELEMETRY_OPTOUT: '1',
                DOTNET_NOLOGO: '1',
              },
            },
          ),
  });

  const report = createContractReport({ corpus: contractCorpus, digest, nextRun, dotnetRun });
  await fs.mkdir(path.dirname(options.output), { recursive: true });
  await fs.writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(formatContractSummary(report));
  console.log(`Report: ${options.output}`);
  if (!report.passed) process.exitCode = 1;
} finally {
  for (const processInfo of [...activeChildren]) processInfo.kill('SIGTERM');
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
}
