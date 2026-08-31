import fs from 'node:fs';
import path from 'node:path';

const corpusPath = path.join(process.cwd(), 'contracts', 'issueflow', 'v1', 'http-cases.json');
const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
const actualIds = corpus.cases?.map((entry) => entry.id) ?? [];
const criticalBehaviorIds = ['R07', 'R08', 'W07', 'W08', 'W09'];

if (corpus.schemaVersion !== 1) throw new Error('Contract corpus schemaVersion must be 1.');
if (actualIds.length === 0) throw new Error('Contract corpus must contain at least one case.');
if (new Set(actualIds).size !== actualIds.length) {
  throw new Error('Contract corpus case IDs must be unique.');
}
if (actualIds.some((id) => !/^[RWS]\d{2}$/.test(id))) {
  throw new Error('Top-level contract case IDs must use RNN, WNN, or SNN.');
}
for (const id of criticalBehaviorIds) {
  if (!actualIds.includes(id)) throw new Error(`Contract corpus is missing critical behavior case ${id}.`);
}
for (const prefix of ['R', 'W', 'S']) {
  if (!actualIds.some((id) => id.startsWith(prefix))) {
    throw new Error(`Contract corpus must retain at least one ${prefix} boundary case.`);
  }
}

function validateRequestAndExpectation(id, request, expect) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request?.method) || !request.path?.startsWith('/api/')) {
    throw new Error(`${id} has an invalid request.`);
  }
  if ('body' in request && 'rawBody' in request) {
    throw new Error(`${id} cannot declare both body and rawBody.`);
  }
  if (!Number.isInteger(expect?.status) || expect.status < 200 || expect.status > 599) {
    throw new Error(`${id} has an invalid expected status.`);
  }
}

for (const contractCase of corpus.cases) {
  const { request, expect } = contractCase;
  if (!contractCase.title || typeof contractCase.auth !== 'boolean') {
    throw new Error(`${contractCase.id} needs a title and explicit auth boundary.`);
  }
  validateRequestAndExpectation(contractCase.id, request, expect);
  const followUpIds = new Set();
  for (const followUp of contractCase.followUps ?? []) {
    if (!followUp.id || followUpIds.has(followUp.id)) {
      throw new Error(`${contractCase.id} follow-up IDs must be present and unique.`);
    }
    followUpIds.add(followUp.id);
    validateRequestAndExpectation(`${contractCase.id}/${followUp.id}`, followUp.request, followUp.expect);
  }
}

console.log(
  `Shared contract corpus: ${actualIds.length} unique R/W/S cases and critical multi-step behaviors are structurally valid.`,
);
