import { expect, test } from '@playwright/test';
import { loadContractCorpus, materializeContractCase, readJsonPath } from '../contract-tests/dual-backend/corpus';

const corpus = loadContractCorpus();
const runId = `${Date.now()}-${process.pid}`;

for (const sourceCase of corpus.cases) {
  test(`${sourceCase.id} · ${sourceCase.title}`, async ({ request }) => {
    const contractCase = materializeContractCase(sourceCase, runId);
    try {
      if (contractCase.auth) {
        const login = await request.post(corpus.login.path, { data: corpus.login.body });
        expect(login.status(), 'contract fixture login').toBe(corpus.login.expect.status);
      }

      const response = await request.fetch(contractCase.request.path, {
        method: contractCase.request.method,
        headers: contractCase.request.rawBody === undefined ? undefined : { 'content-type': 'application/json' },
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

      if (contractCase.cleanup) {
        const cleanupPath = contractCase.cleanup.path.replace(/\{\{response\.([^}]+)\}\}/g, (_, jsonPath) => {
          const value = readJsonPath(responseJson, jsonPath);
          expect(['string', 'number']).toContain(typeof value);
          return encodeURIComponent(String(value));
        });
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
