export function scoreConcepts(questions, answers) {
  const groups = new Map();
  for (const q of questions) {
    const row = groups.get(q.conceptId) ?? {
      conceptId: q.conceptId,
      total: 0,
      correct: 0,
    };
    row.total++;
    if (answers[q.id] === q.correctIndex) row.correct++;
    groups.set(q.conceptId, row);
  }
  return [...groups.values()];
}
export function reviewConcepts(
  questions,
  state,
  now = new Date().toISOString(),
) {
  const groups = new Map();
  for (const q of questions) {
    const record = state.records[q.id];
    if (!record) continue;
    const row = groups.get(q.conceptId) ?? {
      conceptId: q.conceptId,
      incorrect: 0,
      due: 0,
    };
    if (!record.lastCorrect) row.incorrect++;
    if (record.dueAt <= now) row.due++;
    groups.set(q.conceptId, row);
  }
  return [...groups.values()].filter((row) => row.incorrect || row.due);
}
