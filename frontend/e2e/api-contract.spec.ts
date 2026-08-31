import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import {
  loadContractCorpus,
  materializeContractCase,
  readJsonPath,
  type ContractExpectation,
  type ContractRequest,
} from '../contract-tests/dual-backend/corpus';

const corpus = loadContractCorpus();
const runId = `${Date.now()}-${process.pid}`;

function responsePath(template: string, responseJson: unknown) {
  return template.replace(/\{\{response\.([^}]+)\}\}/g, (_, jsonPath) => {
    const value = readJsonPath(responseJson, jsonPath);
    expect(['string', 'number']).toContain(typeof value);
    return encodeURIComponent(String(value));
  });
}

async function sendContractRequest(request: APIRequestContext, definition: ContractRequest, responseJson?: unknown) {
  const path = responseJson === undefined ? definition.path : responsePath(definition.path, responseJson);
  return request.fetch(path, {
    method: definition.method,
    headers: definition.rawBody === undefined ? undefined : { 'content-type': 'application/json' },
    data: definition.rawBody ?? definition.body,
  });
}

async function assertContractResponse(response: APIResponse, expectation: ContractExpectation, label: string) {
  expect(response.status(), label).toBe(expectation.status);
  if (expectation.contentType) expect(response.headers()['content-type'], label).toContain(expectation.contentType);

  const responseText = await response.text();
  if (expectation.jsonKind === 'empty') {
    expect(responseText, `${label}:body`).toBe('');
    return undefined;
  }

  const expectsJson = Boolean(
    expectation.contentType?.includes('json') ||
    expectation.jsonKind ||
    expectation.requiredJsonPaths?.length ||
    Object.keys(expectation.jsonValues ?? {}).length,
  );
  if (!expectsJson) return undefined;

  const responseJson: unknown = JSON.parse(responseText);
  if (expectation.jsonKind === 'array') expect(Array.isArray(responseJson), label).toBe(true);
  if (expectation.jsonKind === 'object') {
    expect(typeof responseJson === 'object' && responseJson !== null && !Array.isArray(responseJson), label).toBe(true);
  }
  for (const jsonPath of expectation.requiredJsonPaths ?? []) {
    expect(readJsonPath(responseJson, jsonPath), `${label}:${jsonPath}`).not.toBeUndefined();
  }
  for (const [jsonPath, value] of Object.entries(expectation.jsonValues ?? {})) {
    expect(readJsonPath(responseJson, jsonPath), `${label}:${jsonPath}`).toEqual(value);
  }
  return responseJson;
}

for (const sourceCase of corpus.cases) {
  test(`${sourceCase.id} · ${sourceCase.title}`, async ({ request }) => {
    const contractCase = materializeContractCase(sourceCase, runId);
    try {
      if (contractCase.auth) {
        const login = await request.post(corpus.login.path, { data: corpus.login.body });
        expect(login.status(), 'contract fixture login').toBe(corpus.login.expect.status);
      }

      const response = await sendContractRequest(request, contractCase.request);
      const responseJson = await assertContractResponse(response, contractCase.expect, contractCase.id);

      for (const followUp of contractCase.followUps ?? []) {
        const followUpResponse = await sendContractRequest(request, followUp.request, responseJson);
        await assertContractResponse(followUpResponse, followUp.expect, `${contractCase.id}:${followUp.id}`);
      }

      if (contractCase.cleanup) {
        const cleanupPath = responsePath(contractCase.cleanup.path, responseJson);
        const cleanup = await request.fetch(cleanupPath, { method: contractCase.cleanup.method });
        expect(cleanup.status(), `${contractCase.id}:cleanup`).toBe(contractCase.cleanup.expect.status);
        expect(await cleanup.text(), `${contractCase.id}:cleanup body`).toBe('');
      }
    } finally {
      const logout = await request.fetch(corpus.logout.path, { method: corpus.logout.method });
      expect(logout.status(), `${contractCase.id}:session cleanup`).toBe(corpus.logout.expect.status);
    }
  });
}
