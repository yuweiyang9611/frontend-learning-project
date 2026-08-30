import assert from "node:assert/strict";
import test from "node:test";
import {
  createReviewState,
  decodeReviewState,
  questionNeedsReview,
  recordReviewAnswer,
  reviewSummary,
} from "./review-state.mjs";

test("wrong answers enter the error bank immediately", () => {
  const at = "2026-08-30T00:00:00.000Z";
  const state = recordReviewAnswer(createReviewState(), "w01-q01", false, at);
  assert.equal(questionNeedsReview(state, "w01-q01", at), true);
  assert.deepEqual(reviewSummary(state, at), {
    attempted: 1,
    incorrect: 1,
    due: 1,
  });
});

test("correct answers advance through spaced review intervals", () => {
  const at = "2026-08-30T00:00:00.000Z";
  const first = recordReviewAnswer(createReviewState(), "w01-q01", true, at);
  assert.equal(first.records["w01-q01"].dueAt, "2026-08-31T00:00:00.000Z");
  const second = recordReviewAnswer(
    first,
    "w01-q01",
    true,
    "2026-08-31T00:00:00.000Z",
  );
  assert.equal(second.records["w01-q01"].dueAt, "2026-09-03T00:00:00.000Z");
});

test("a corrected wrong answer restarts at the one-day interval", () => {
  const at = "2026-08-30T00:00:00.000Z";
  const wrong = recordReviewAnswer(createReviewState(), "w01-q01", false, at);
  const corrected = recordReviewAnswer(wrong, "w01-q01", true, at);
  assert.equal(corrected.records["w01-q01"].stage, 0);
  assert.equal(corrected.records["w01-q01"].dueAt, "2026-08-31T00:00:00.000Z");
});

test("decoder drops malformed and incompatible records", () => {
  assert.deepEqual(
    decodeReviewState({ app: "other", schemaVersion: 1, records: {} }),
    createReviewState(),
  );
  const decoded = decodeReviewState({
    app: "issueflow-learning-review",
    schemaVersion: 1,
    records: {
      "w01-q01": {
        stage: 0,
        lastCorrect: false,
        lastAnsweredAt: "2026-08-30",
        dueAt: "2026-08-30",
        attempts: 2,
      },
      "../unsafe": {
        stage: 0,
        lastCorrect: false,
        lastAnsweredAt: "x",
        dueAt: "x",
      },
    },
  });
  assert.deepEqual(Object.keys(decoded.records), ["w01-q01"]);
});
