import fs from 'node:fs';
import path from 'node:path';

const corpusPath = path.join(
  process.cwd(),
  'contracts',
  'issueflow',
  'v1',
  'http-cases.json',
);
const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
const expectedIds = ['R', 'W', 'S'].flatMap((prefix) =>
  Array.from({ length: 6 }, (_, index) => `${prefix}0${index + 1}`),
);
const actualIds = corpus.cases?.map((entry) => entry.id) ?? [];

if (corpus.schemaVersion !== 1) throw new Error('Contract corpus schemaVersion must be 1.');
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  throw new Error(`Contract corpus IDs must be exactly ${expectedIds.join(', ')}.`);
}

for (const contractCase of corpus.cases) {
  const { request, expect } = contractCase;
  if (!contractCase.title || typeof contractCase.auth !== 'boolean') {
    throw new Error(`${contractCase.id} needs a title and explicit auth boundary.`);
  }
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request?.method) || !request.path?.startsWith('/api/')) {
    throw new Error(`${contractCase.id} has an invalid request.`);
  }
  if ('body' in request && 'rawBody' in request) {
    throw new Error(`${contractCase.id} cannot declare both body and rawBody.`);
  }
  if (!Number.isInteger(expect?.status) || expect.status < 200 || expect.status > 599) {
    throw new Error(`${contractCase.id} has an invalid expected status.`);
  }
}

console.log('Shared contract corpus: 18 ordered R/W/S cases are structurally valid.');
