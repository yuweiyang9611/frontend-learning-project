import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreConcepts, reviewConcepts } from "./quiz-diagnostics.mjs";
import {
  createReviewState,
  recordReviewAnswer,
  decodeReviewState,
} from "./review-state.mjs";
const questions = [
  { id: "w01-q01", conceptId: "web.environment", correctIndex: 1 },
  { id: "w01-q04", conceptId: "web.environment", correctIndex: 0 },
  { id: "w02-q01", conceptId: "html.semantic", correctIndex: 2 },
];
test("scores concepts without treating unanswered as correct", () =>
  assert.deepEqual(scoreConcepts(questions, { "w01-q01": 1 }), [
    { conceptId: "web.environment", total: 2, correct: 1 },
    { conceptId: "html.semantic", total: 1, correct: 0 },
  ]));
test("old records survive new questions and only attempted questions enter review", () => {
  const old = recordReviewAnswer(
    createReviewState(),
    "w01-q01",
    false,
    "2026-01-01T00:00:00.000Z",
  );
  const restored = decodeReviewState(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored, old);
  assert.deepEqual(
    reviewConcepts(questions, restored, "2026-01-02T00:00:00.000Z"),
    [{ conceptId: "web.environment", incorrect: 1, due: 1 }],
  );
  const corrected = recordReviewAnswer(
    restored,
    "w01-q01",
    true,
    "2026-01-02T00:00:00.000Z",
  );
  assert.deepEqual(
    reviewConcepts(questions, corrected, "2026-01-02T00:00:00.000Z"),
    [],
  );
});
