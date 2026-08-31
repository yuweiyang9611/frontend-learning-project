import { describe, expect, it } from 'vitest';
import { loadContractCorpus, materializeContractCase, readJsonPath } from './corpus';

describe('shared dual-backend contract corpus', () => {
  it('contains an extensible corpus with unique IDs and lifecycle coverage', () => {
    const corpus = loadContractCorpus();
    const ids = corpus.cases.map(({ id }) => id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(['R07', 'R08', 'W07', 'W08', 'W09']));
  });

  it('materializes unique write data without mutating the source case', () => {
    const source = loadContractCorpus().cases.find(({ id }) => id === 'W03');
    expect(source).toBeDefined();
    const materialized = materializeContractCase(source!, 'run-123');
    expect(readJsonPath(materialized.request.body, 'title')).toBe('Contract W03 run-123');
    expect(readJsonPath(source!.request.body, 'title')).toBe('{{uniqueTitle}}');
  });

  it('declares cleanup for created data and authenticated sessions', () => {
    const corpus = loadContractCorpus();
    const createCase = corpus.cases.find(({ id }) => id === 'W03');
    expect(corpus.login.expect.status).toBe(200);
    expect(corpus.logout).toEqual({
      method: 'POST',
      path: '/api/auth/logout',
      expect: { status: 204 },
    });
    expect(createCase?.cleanup).toEqual({
      method: 'DELETE',
      path: '/api/issues/{{response.id}}',
      expect: { status: 204 },
    });
  });

  it('describes exact JSON values and multi-step mutation lifecycles', () => {
    const corpus = loadContractCorpus();
    expect(corpus.cases.find(({ id }) => id === 'R07')?.expect.jsonValues).toMatchObject({ total: 3 });
    expect(corpus.cases.find(({ id }) => id === 'W07')?.followUps?.map(({ id }) => id)).toEqual([
      'omit',
      'null',
      'value',
    ]);
    expect(corpus.cases.find(({ id }) => id === 'W09')?.followUps?.at(-1)?.expect.status).toBe(404);
  });
});
