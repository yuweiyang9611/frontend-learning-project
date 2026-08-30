import fs from 'node:fs';
import path from 'node:path';

export interface ContractRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  rawBody?: string;
}

export interface ContractExpectation {
  status: number;
  contentType: string;
  requiredJsonPaths?: string[];
  jsonKind?: 'array' | 'object';
}

export interface ContractCase {
  id: string;
  title: string;
  auth: boolean;
  request: ContractRequest;
  expect: ContractExpectation;
}

export interface ContractCorpus {
  schemaVersion: number;
  login: { path: string; body: { email: string; password: string } };
  cases: ContractCase[];
}

function findRepositoryRoot(start: string): string {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, 'contracts', 'issueflow', 'v1', 'http-cases.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error('Could not locate contracts/issueflow/v1/http-cases.json.');
    current = parent;
  }
}

export function loadContractCorpus(start = process.cwd()): ContractCorpus {
  const repositoryRoot = findRepositoryRoot(start);
  const filePath = path.join(repositoryRoot, 'contracts', 'issueflow', 'v1', 'http-cases.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ContractCorpus;
}

export function materializeContractCase(contractCase: ContractCase, runId: string): ContractCase {
  const source = JSON.stringify(contractCase).replaceAll('{{uniqueTitle}}', `Contract ${contractCase.id} ${runId}`);
  return JSON.parse(source) as ContractCase;
}

export function readJsonPath(value: unknown, jsonPath: string): unknown {
  let current = value;
  for (const segment of jsonPath.split('.')) {
    if (typeof current !== 'object' || current === null || !(segment in current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
