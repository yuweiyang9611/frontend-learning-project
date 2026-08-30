import { readFile } from 'node:fs/promises';

const base = new URL('../docs/90-days/data/', import.meta.url);
const concepts = JSON.parse(await readFile(new URL('concepts.json', base), 'utf8'));
const assessments = JSON.parse(await readFile(new URL('assessments.json', base), 'utf8'));
const transferTasks = await readFile(new URL('../transfer-tasks.md', base), 'utf8');

for (const assessment of assessments) {
  if (!assessment.id || !Number.isInteger(assessment.afterDay) || !assessment.transferTaskId) {
    throw new Error('Every assessment needs id, afterDay, and transferTaskId.');
  }
  if (!transferTasks.includes(`{#${assessment.transferTaskId}}`)) {
    throw new Error(assessment.id + ' references missing transfer task ' + assessment.transferTaskId + '.');
  }
  for (const conceptId of assessment.requiresConcepts) {
    const concept = concepts[conceptId];
    if (!concept) throw new Error(assessment.id + ' references unknown concept ' + conceptId + '.');
    if (concept.introducedDay > assessment.afterDay) {
      throw new Error(assessment.id + ' assesses ' + conceptId + ' before Day ' + concept.introducedDay + '.');
    }
  }
}

console.log('Assessment order: every checkpoint follows the concepts it evaluates.');
