import { describe, expect, it } from 'vitest';
import { compareContractRuns, createContractReport, loadHttpContractCorpus } from './http-harness.mjs';

function caseResult(id, status = 200) {
  return {
    id,
    passed: status === 200,
    actual: { status, contentType: 'application/json', bodyKind: 'object', requiredJsonPaths: {} },
    cleanup: { attempted: false, passed: true, status: null },
    sessionCleanup: { attempted: false, passed: true, status: null },
  };
}

function run(backend, cases) {
  return {
    backend,
    baseUrl: 'http://127.0.0.1',
    passed: cases.every(({ passed }) => passed),
    caseCount: cases.length,
    cases,
  };
}

describe('shared HTTP parity report', () => {
  it('loads an extensible corpus with unique IDs and a stable digest', () => {
    const { corpus, digest } = loadHttpContractCorpus();
    const ids = corpus.cases.map(({ id }) => id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(['R07', 'R08', 'W07', 'W08', 'W09']));
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('reports normalized parity and exposes a changed response', () => {
    const left = run('next-same-origin', [caseResult('R01')]);
    const right = run('dotnet-sqlite', [caseResult('R01')]);
    expect(compareContractRuns(left, right)).toEqual({ passed: true, mismatches: [] });

    right.cases[0] = caseResult('R01', 500);
    right.passed = false;
    const parity = compareContractRuns(left, right);
    expect(parity.passed).toBe(false);
    expect(parity.mismatches).toHaveLength(1);
  });

  it('requires both suites and parity to pass', () => {
    const { corpus, digest } = loadHttpContractCorpus();
    const nextRun = run('next-same-origin', [caseResult('R01')]);
    const dotnetRun = run('dotnet-sqlite', [caseResult('R01', 500)]);
    const report = createContractReport({ corpus, digest, nextRun, dotnetRun });
    expect(report.schema).toBe('issueflow-http-contract-report/v1');
    expect(report.passed).toBe(false);
  });
});
