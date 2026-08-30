export const REVIEW_APP = "issueflow-learning-review";
export const REVIEW_VERSION = 1;
export const REVIEW_STORAGE_KEY =
  "issueflow:frontend-learning-project:review:v1";
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];

export function createReviewState() {
  return { app: REVIEW_APP, schemaVersion: REVIEW_VERSION, records: {} };
}

function addDays(isoDate, days) {
  const value = new Date(isoDate);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

export function decodeReviewState(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return createReviewState();
  if (input.app !== REVIEW_APP || input.schemaVersion !== REVIEW_VERSION)
    return createReviewState();
  if (
    !input.records ||
    typeof input.records !== "object" ||
    Array.isArray(input.records)
  )
    return createReviewState();
  const records = {};
  for (const [questionId, candidate] of Object.entries(input.records)) {
    if (!/^[a-z0-9-]{3,80}$/.test(questionId)) continue;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      continue;
    if (
      !Number.isInteger(candidate.stage) ||
      candidate.stage < 0 ||
      candidate.stage >= REVIEW_INTERVAL_DAYS.length
    )
      continue;
    if (
      typeof candidate.lastCorrect !== "boolean" ||
      typeof candidate.lastAnsweredAt !== "string" ||
      typeof candidate.dueAt !== "string"
    )
      continue;
    const attempts =
      Number.isInteger(candidate.attempts) && candidate.attempts > 0
        ? candidate.attempts
        : 1;
    records[questionId] = {
      stage: candidate.stage,
      lastCorrect: candidate.lastCorrect,
      lastAnsweredAt: candidate.lastAnsweredAt,
      dueAt: candidate.dueAt,
      attempts,
    };
  }
  return { app: REVIEW_APP, schemaVersion: REVIEW_VERSION, records };
}

export function recordReviewAnswer(
  state,
  questionId,
  correct,
  answeredAt = new Date().toISOString(),
) {
  const previous = state.records[questionId];
  const nextStage = correct
    ? previous?.lastCorrect
      ? Math.min(previous.stage + 1, REVIEW_INTERVAL_DAYS.length - 1)
      : 0
    : 0;
  const dueAt = correct
    ? addDays(answeredAt, REVIEW_INTERVAL_DAYS[nextStage])
    : answeredAt;
  return {
    ...state,
    records: {
      ...state.records,
      [questionId]: {
        stage: nextStage,
        lastCorrect: correct,
        lastAnsweredAt: answeredAt,
        dueAt,
        attempts: (previous?.attempts ?? 0) + 1,
      },
    },
  };
}

export function reviewSummary(state, now = new Date().toISOString()) {
  const records = Object.entries(state.records);
  return {
    attempted: records.length,
    incorrect: records.filter(([, value]) => !value.lastCorrect).length,
    due: records.filter(([, value]) => value.dueAt <= now).length,
  };
}

export function questionNeedsReview(
  state,
  questionId,
  now = new Date().toISOString(),
) {
  const record = state.records[questionId];
  return Boolean(record && (!record.lastCorrect || record.dueAt <= now));
}
