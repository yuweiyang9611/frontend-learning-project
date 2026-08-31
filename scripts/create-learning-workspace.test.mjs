import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSafeTarget,
  starterContent,
  writeStarter,
} from "./create-learning-workspace.mjs";
import { validateLearnerFileContent } from "./learner-file-validation.mjs";

test("learning scaffold targets cannot escape the repository root", () => {
  const root = path.join(os.tmpdir(), "issueflow-scaffold-root");
  assert.match(
    assertSafeTarget(root, "frontend/src/learning/day-57.test.ts"),
    /day-57\.test\.ts$/,
  );
  assert.throws(
    () => assertSafeTarget(root, "../outside.ts"),
    /repository-relative|escapes/,
  );
  assert.throws(
    () => assertSafeTarget(root, path.join(root, "absolute.ts")),
    /repository-relative/,
  );
});

test("generated starters are explicit red states with the required teaching structure", () => {
  const unitTest = starterContent(
    "57",
    "frontend/src/learning/day-57.acceptance.test.tsx",
    [],
  );
  assert.match(unitTest, /LEARNING_TODO/);
  assert.match(unitTest, /throw new Error/);

  const workflow = starterContent(
    "83",
    ".github/workflows/day-83-learning-ci.yml",
    [],
  );
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /# npm ci/);
  assert.match(workflow, /LEARNING_TODO/);

  const evidence = starterContent(
    "84",
    "learning-evidence/day-84/quality-gate.md",
    ["复现", "期望", "实际", "回归测试"],
  );
  for (const heading of ["复现", "期望", "实际", "回归测试"]) {
    assert.match(evidence, new RegExp(`## ${heading}`));
  }
});

test("writeStarter creates once and preserves existing learner work", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "issueflow-scaffold-"));
  const target = "frontend/src/learning/day-57.acceptance.test.tsx";
  try {
    assert.equal(
      await writeStarter(root, target, "first learner version\n"),
      "created",
    );
    assert.equal(
      await writeStarter(root, target, "replacement that must not win\n"),
      "preserved",
    );
    assert.equal(
      await readFile(path.join(root, target), "utf8"),
      "first learner version\n",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workflow comments cannot satisfy active quality-gate commands", () => {
  const target = ".github/workflows/day-83-learning-ci.yml";
  const check = {
    minimumCharacters: 240,
    requiredText: ["permissions:", "contents: read"],
    requiredCommands: [
      "npm ci",
      "npm run typecheck",
      "npm run test",
      "npm run build",
    ],
  };
  const scaffold = starterContent("83", target, []).replaceAll(
    "LEARNING_TODO",
    "replace-me",
  );
  const failures = validateLearnerFileContent(target, scaffold, check);
  assert.deepEqual(failures, [
    "missing required command: npm ci",
    "missing required command: npm run typecheck",
    "missing required command: npm run test",
    "missing required command: npm run build",
  ]);

  const deceptiveWorkflow = scaffold.replace(
    "      - name: Replace this scaffold with a reproducible quality gate",
    "      - name: npm ci npm run typecheck npm run test npm run build",
  );
  assert.deepEqual(
    validateLearnerFileContent(target, deceptiveWorkflow, check),
    failures,
  );

  const activeWorkflow = scaffold.replace(/^          # /gm, "          ");
  assert.deepEqual(
    validateLearnerFileContent(target, activeWorkflow, check),
    [],
  );
});
