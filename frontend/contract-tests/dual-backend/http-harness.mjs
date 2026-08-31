import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CONTRACT_REPORT_SCHEMA = 'issueflow-http-contract-report/v1';

function findRepositoryRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, 'contracts', 'issueflow', 'v1', 'http-cases.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Could not locate contracts/issueflow/v1/http-cases.json.');
    }
    current = parent;
  }
}

export function loadHttpContractCorpus(start = process.cwd()) {
  const repositoryRoot = findRepositoryRoot(start);
  const filePath = path.join(repositoryRoot, 'contracts', 'issueflow', 'v1', 'http-cases.json');
  const source = fs.readFileSync(filePath, 'utf8');
  return {
    corpus: JSON.parse(source),
    digest: createHash('sha256').update(source).digest('hex'),
    filePath,
  };
}

function materialize(value, runId) {
  return JSON.parse(JSON.stringify(value).replaceAll('{{uniqueTitle}}', `Contract ${runId}`));
}

function readJsonPath(value, jsonPath) {
  let current = value;
  for (const segment of jsonPath.split('.')) {
    if (typeof current !== 'object' || current === null || !(segment in current)) return undefined;
    current = current[segment];
  }
  return current;
}

function bodyKind(value, parsed, responseText) {
  if (!responseText) return 'empty';
  if (!parsed) return 'invalid-json';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function mediaType(headers) {
  return headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ?? null;
}

function getSetCookieValues(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const combined = headers.get('set-cookie');
  return combined ? combined.split(/,(?=\s*[^;,\s]+=)/) : [];
}

class CookieJar {
  #cookies = new Map();

  capture(headers) {
    for (const setCookie of getSetCookieValues(headers)) {
      const pair = setCookie.split(';', 1)[0];
      const separator = pair.indexOf('=');
      if (separator <= 0) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!value) this.#cookies.delete(name);
      else this.#cookies.set(name, value);
    }
  }

  header() {
    return [...this.#cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  get hasCookies() {
    return this.#cookies.size > 0;
  }
}

async function sendRequest(fetchImpl, baseUrl, jar, requestDefinition) {
  const headers = new Headers();
  const cookie = jar.header();
  if (cookie) headers.set('cookie', cookie);

  let body;
  if (requestDefinition.rawBody !== undefined) {
    headers.set('content-type', 'application/json');
    body = requestDefinition.rawBody;
  } else if (requestDefinition.body !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(requestDefinition.body);
  }

  const response = await fetchImpl(new URL(requestDefinition.path, baseUrl), {
    method: requestDefinition.method,
    headers,
    body,
    redirect: 'manual',
  });
  jar.capture(response.headers);
  return response;
}

function responseObservation(response, responseText, responseJson, parsed, expectation) {
  const requiredJsonPaths = expectation.requiredJsonPaths ?? [];
  const expectedJsonValues = expectation.jsonValues ?? {};
  return {
    status: response.status,
    contentType: mediaType(response.headers),
    bodyKind: bodyKind(responseJson, parsed, responseText),
    requiredJsonPaths: Object.fromEntries(
      requiredJsonPaths.map((jsonPath) => [jsonPath, readJsonPath(responseJson, jsonPath) !== undefined]),
    ),
    jsonValues: Object.fromEntries(
      Object.keys(expectedJsonValues).map((jsonPath) => [jsonPath, readJsonPath(responseJson, jsonPath)]),
    ),
  };
}

function assertionErrors(expectation, actual, parsed) {
  const errors = [];
  if (actual.status !== expectation.status) {
    errors.push(`status: expected ${expectation.status}, received ${actual.status}`);
  }
  if (expectation.contentType && actual.contentType !== expectation.contentType.toLowerCase()) {
    errors.push(`content-type: expected ${expectation.contentType}, received ${actual.contentType ?? '<missing>'}`);
  }
  const expectsJson = Boolean(
    expectation.contentType?.includes('json') ||
    (expectation.jsonKind && expectation.jsonKind !== 'empty') ||
    expectation.requiredJsonPaths?.length ||
    Object.keys(expectation.jsonValues ?? {}).length,
  );
  if (expectsJson && !parsed) errors.push('body: expected valid JSON');
  if (expectation.jsonKind && actual.bodyKind !== expectation.jsonKind) {
    errors.push(`body kind: expected ${expectation.jsonKind}, received ${actual.bodyKind}`);
  }
  for (const [jsonPath, present] of Object.entries(actual.requiredJsonPaths)) {
    if (!present) errors.push(`body: missing JSON path ${jsonPath}`);
  }
  for (const [jsonPath, expected] of Object.entries(expectation.jsonValues ?? {})) {
    const received = actual.jsonValues[jsonPath];
    if (JSON.stringify(received) !== JSON.stringify(expected)) {
      errors.push(`body: ${jsonPath} expected ${JSON.stringify(expected)}, received ${JSON.stringify(received)}`);
    }
  }
  return errors;
}

async function observeResponse(response, expectation) {
  const responseText = await response.text();
  let responseJson;
  let parsed = false;
  if (responseText) {
    try {
      responseJson = JSON.parse(responseText);
      parsed = true;
    } catch {
      responseJson = undefined;
    }
  }
  const actual = responseObservation(response, responseText, responseJson, parsed, expectation);
  return { actual, errors: assertionErrors(expectation, actual, parsed), responseJson, parsed };
}

function cleanupPath(template, responseJson) {
  return template.replace(/\{\{response\.([^}]+)\}\}/g, (_, jsonPath) => {
    const value = readJsonPath(responseJson, jsonPath);
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(`Cleanup path needs response.${jsonPath}.`);
    }
    return encodeURIComponent(String(value));
  });
}

async function logout(fetchImpl, baseUrl, jar, logoutDefinition) {
  if (!logoutDefinition || !jar.hasCookies) return { attempted: false, passed: true, status: null };
  const response = await sendRequest(fetchImpl, baseUrl, jar, {
    method: logoutDefinition.method ?? 'POST',
    path: logoutDefinition.path,
  });
  return {
    attempted: true,
    passed: response.status === logoutDefinition.expect.status,
    status: response.status,
  };
}

export async function runHttpContractSuite({ backend, baseUrl, corpus, fetchImpl = fetch, runId }) {
  const cases = [];

  for (const sourceCase of corpus.cases) {
    const contractCase = materialize(sourceCase, `${sourceCase.id}-${runId}`);
    const jar = new CookieJar();
    const result = {
      id: contractCase.id,
      title: contractCase.title,
      passed: false,
      expected: contractCase.expect,
      actual: null,
      cleanup: { attempted: false, passed: true, status: null },
      followUps: [],
      sessionCleanup: { attempted: false, passed: true, status: null },
      errors: [],
    };

    try {
      if (contractCase.auth) {
        const loginResponse = await sendRequest(fetchImpl, baseUrl, jar, {
          method: 'POST',
          path: corpus.login.path,
          body: corpus.login.body,
        });
        if (loginResponse.status !== corpus.login.expect.status) {
          throw new Error(`fixture login: expected ${corpus.login.expect.status}, received ${loginResponse.status}`);
        }
      }

      const response = await sendRequest(fetchImpl, baseUrl, jar, contractCase.request);
      const observation = await observeResponse(response, contractCase.expect);
      const { responseJson, parsed } = observation;
      result.actual = observation.actual;
      result.errors.push(...observation.errors);

      if (parsed && result.errors.length === 0) {
        for (const followUp of contractCase.followUps ?? []) {
          const followUpResponse = await sendRequest(fetchImpl, baseUrl, jar, {
            ...followUp.request,
            path: cleanupPath(followUp.request.path, responseJson),
          });
          const followUpObservation = await observeResponse(followUpResponse, followUp.expect);
          result.followUps.push({
            id: followUp.id,
            passed: followUpObservation.errors.length === 0,
            expected: followUp.expect,
            actual: followUpObservation.actual,
          });
          result.errors.push(...followUpObservation.errors.map((error) => `follow-up ${followUp.id}: ${error}`));
        }
      }

      if (contractCase.cleanup && parsed) {
        const cleanupResponse = await sendRequest(fetchImpl, baseUrl, jar, {
          method: contractCase.cleanup.method,
          path: cleanupPath(contractCase.cleanup.path, responseJson),
        });
        result.cleanup = {
          attempted: true,
          passed: cleanupResponse.status === contractCase.cleanup.expect.status,
          status: cleanupResponse.status,
        };
        if (!result.cleanup.passed) {
          result.errors.push(
            `cleanup: expected ${contractCase.cleanup.expect.status}, received ${cleanupResponse.status}`,
          );
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    } finally {
      try {
        result.sessionCleanup = await logout(fetchImpl, baseUrl, jar, corpus.logout);
        if (!result.sessionCleanup.passed) {
          result.errors.push(
            `session cleanup: expected ${corpus.logout.expect.status}, received ${result.sessionCleanup.status}`,
          );
        }
      } catch (error) {
        result.sessionCleanup = { attempted: true, passed: false, status: null };
        result.errors.push(`session cleanup: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    result.passed = result.errors.length === 0;
    cases.push(result);
  }

  return {
    backend,
    baseUrl: new URL(baseUrl).origin,
    passed: cases.length === corpus.cases.length && cases.every(({ passed }) => passed),
    caseCount: cases.length,
    cases,
  };
}

function comparableCase(result) {
  return {
    id: result.id,
    passed: result.passed,
    actual: result.actual,
    followUps: result.followUps,
    cleanup: result.cleanup,
    sessionCleanup: result.sessionCleanup,
  };
}

export function compareContractRuns(left, right) {
  const mismatches = [];
  const rightById = new Map(right.cases.map((result) => [result.id, result]));

  for (const leftResult of left.cases) {
    const rightResult = rightById.get(leftResult.id);
    if (!rightResult) {
      mismatches.push({ id: leftResult.id, reason: `${right.backend} did not execute the case.` });
      continue;
    }
    const leftValue = comparableCase(leftResult);
    const rightValue = comparableCase(rightResult);
    if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
      mismatches.push({ id: leftResult.id, left: leftValue, right: rightValue });
    }
    rightById.delete(leftResult.id);
  }

  for (const id of rightById.keys()) {
    mismatches.push({ id, reason: `${left.backend} did not execute the case.` });
  }

  return { passed: mismatches.length === 0, mismatches };
}

export function createContractReport({ corpus, digest, nextRun, dotnetRun }) {
  const parity = compareContractRuns(nextRun, dotnetRun);
  return {
    schema: CONTRACT_REPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    corpus: { schemaVersion: corpus.schemaVersion, sha256: digest, caseCount: corpus.cases.length },
    passed: nextRun.passed && dotnetRun.passed && parity.passed,
    runs: { next: nextRun, dotnet: dotnetRun },
    parity,
  };
}

export function formatContractSummary(report) {
  const lines = [
    'IssueFlow shared HTTP contract parity',
    `Corpus: ${report.corpus.caseCount} cases (${report.corpus.sha256.slice(0, 12)})`,
  ];
  for (const run of [report.runs.next, report.runs.dotnet]) {
    const passed = run.cases.filter((result) => result.passed).length;
    lines.push(`${run.backend}: ${passed}/${run.caseCount} passed`);
    for (const result of run.cases.filter(({ passed: casePassed }) => !casePassed)) {
      lines.push(`  ${result.id}: ${result.errors.join('; ')}`);
    }
  }
  lines.push(`Parity: ${report.parity.passed ? 'passed' : 'failed'}`);
  for (const mismatch of report.parity.mismatches) lines.push(`  ${mismatch.id}: mismatch`);
  lines.push(`Overall: ${report.passed ? 'passed' : 'failed'}`);
  return lines.join('\n');
}
