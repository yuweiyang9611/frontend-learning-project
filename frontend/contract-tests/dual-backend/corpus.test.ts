import { describe, expect, it } from 'vitest';
import { loadContractCorpus, materializeContractCase, readJsonPath } from './corpus';

describe('shared dual-backend contract corpus', () => {
  it('contains the ordered 18-case R/W/S scaffold', () => {
    const corpus = loadContractCorpus();
    expect(corpus.cases.map(({ id }) => id)).toEqual(
      ['R', 'W', 'S'].flatMap((prefix) => Array.from({ length: 6 }, (_, index) => `${prefix}0${index + 1}`)),
    );
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
});
