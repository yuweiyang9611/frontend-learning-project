import { expect, test } from '@playwright/test';
import {
  loadContractCorpus,
  materializeContractCase,
  readJsonPath,
} from '../contract-tests/dual-backend/corpus';

const corpus = loadContractCorpus();
const runId = `${Date.now()}-${process.pid}`;

for (const sourceCase of corpus.cases) {
  test(`${sourceCase.id} · ${sourceCase.title}`, async ({ request }) => {
    const contractCase = materializeContractCase(sourceCase, runId);
    if (contractCase.auth) {
      const login = await request.post(corpus.login.path, { data: corpus.login.body });
      expect(login.status(), 'contract fixture login').toBe(200);
    }

    const response = await request.fetch(contractCase.request.path, {
      method: contractCase.request.method,
      headers:
        contractCase.request.rawBody === undefined
          ? undefined
          : { 'content-type': 'application/json' },
      data: contractCase.request.rawBody ?? contractCase.request.body,
    });

    expect(response.status(), contractCase.id).toBe(contractCase.expect.status);
    expect(response.headers()['content-type']).toContain(contractCase.expect.contentType);

    const responseText = await response.text();
    const responseJson: unknown = JSON.parse(responseText);
    if (contractCase.expect.jsonKind === 'array') expect(Array.isArray(responseJson)).toBe(true);
    if (contractCase.expect.jsonKind === 'object') {
      expect(typeof responseJson === 'object' && responseJson !== null && !Array.isArray(responseJson)).toBe(true);
    }
    for (const jsonPath of contractCase.expect.requiredJsonPaths ?? []) {
      expect(readJsonPath(responseJson, jsonPath), `${contractCase.id}:${jsonPath}`).not.toBeUndefined();
    }
  });
}
