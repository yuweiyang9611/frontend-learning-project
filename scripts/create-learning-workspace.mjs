import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const snapshots = new Map([
  [8, "day-08"],
  [15, "day-15"],
  [22, "day-22"],
]);

function renderTemplate(value, context) {
  if (typeof value !== "string") return value;
  return value.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_match, key) => {
    if (!(key in context))
      throw new Error("Unknown learning scaffold template key: " + key);
    return context[key];
  });
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function assertSafeTarget(root, target) {
  if (path.isAbsolute(target) || target.split(/[\\/]/).includes("..")) {
    throw new Error(
      "Learning scaffold target must be repository-relative: " + target,
    );
  }
  const resolved = path.resolve(root, target);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(
      "Learning scaffold target escapes the repository: " + target,
    );
  }
  return resolved;
}

function testStarter(dayPadded, target) {
  const isBrowserTest = target.endsWith(".spec.ts");
  if (isBrowserTest) {
    return [
      "import { test } from '@playwright/test';",
      "",
      `test('Day ${dayPadded} learner acceptance', async ({ page }) => {`,
      "  await page.goto('/');",
      `  throw new Error('LEARNING_TODO: replace this with the Day ${dayPadded} browser journey and assertions.');`,
      "});",
      "",
    ].join("\n");
  }
  return [
    "import { describe, it } from 'vitest';",
    "",
    `describe('Day ${dayPadded} learner acceptance', () => {`,
    `  it('proves the Day ${dayPadded} behavior', () => {`,
    `    throw new Error('LEARNING_TODO: replace this with a Day ${dayPadded} behavior test that fails for the right reason.');`,
    "  });",
    "});",
    "",
  ].join("\n");
}

function dotnetStarter(dayPadded) {
  return [
    "using Xunit;",
    "",
    "namespace IssueFlow.Api.Tests.Learning;",
    "",
    `public sealed class Day${dayPadded}AcceptanceTests`,
    "{",
    "    [Fact]",
    `    public void Day${dayPadded}Acceptance_proves_the_learning_goal()`,
    "    {",
    `        Assert.True(false, "LEARNING_TODO: replace this with a Day ${dayPadded} integration assertion.");`,
    "    }",
    "}",
    "",
  ].join("\n");
}

function workflowStarter(dayPadded) {
  return [
    `name: Day ${dayPadded} learning CI`,
    "",
    "on:",
    "  workflow_dispatch:",
    "",
    "permissions:",
    "  contents: read",
    "",
    "jobs:",
    "  verify:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v6",
    "      - name: Replace this scaffold with a reproducible quality gate",
    "        run: |",
    '          echo "LEARNING_TODO: implement the commands below"',
    "          # npm ci",
    "          # npm run typecheck",
    "          # npm run test",
    "          # npm run build",
    "",
  ].join("\n");
}

function markdownStarter(dayPadded, requiredText) {
  const sections =
    requiredText.length > 0
      ? requiredText
      : ["学习目标", "实现证据", "限制与下一步"];
  return [
    `# Day ${dayPadded} 学习产物`,
    "",
    "这份文件属于学习者工作区。保留可复现命令、实际输出和你的判断，不要复制参考答案。",
    "",
    ...sections.flatMap((heading) => [
      `## ${heading}`,
      "",
      `LEARNING_TODO: 写下 Day ${dayPadded} 与“${heading}”相关的具体证据。`,
      "",
    ]),
  ].join("\n");
}

export function starterContent(dayPadded, target, requiredText) {
  if (
    target.endsWith(".test.ts") ||
    target.endsWith(".test.tsx") ||
    target.endsWith(".spec.ts")
  ) {
    return testStarter(dayPadded, target);
  }
  if (target.endsWith(".cs")) return dotnetStarter(dayPadded);
  if (target.endsWith(".yml") || target.endsWith(".yaml"))
    return workflowStarter(dayPadded);
  if (target.endsWith(".md")) return markdownStarter(dayPadded, requiredText);
  throw new Error(
    "No safe learning scaffold template is registered for " + target,
  );
}

export async function writeStarter(root, target, content) {
  const absoluteTarget = assertSafeTarget(root, target);
  if (await exists(absoluteTarget)) return "preserved";
  await mkdir(path.dirname(absoluteTarget), { recursive: true });
  await writeFile(absoluteTarget, content, { encoding: "utf8", flag: "wx" });
  return "created";
}

async function createCheckpoint(root, day, dryRun) {
  const source = path.join(
    root,
    "labs",
    "web-foundations",
    "snapshots",
    snapshots.get(day),
  );
  const target = path.join(
    root,
    "learning-work",
    "day-" + String(day).padStart(2, "0"),
  );
  if (dryRun) {
    console.log(
      "Would copy checkpoint starter to " + path.relative(root, target),
    );
    return;
  }
  if (await exists(target)) {
    throw new Error(
      "Refusing to overwrite " +
        path.relative(root, target) +
        ". Rename or remove it after preserving your work.",
    );
  }
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true, errorOnExist: true });
  console.log(
    "Created " +
      path.relative(root, target) +
      ". Start the fixture server with npm run learn:start.",
  );
}

async function createDayScaffolds(root, day, dryRun) {
  const dayPadded = String(day).padStart(2, "0");
  const weekPadded = String(Math.ceil(day / 7)).padStart(2, "0");
  const dataRoot = path.join(root, "docs", "90-days", "data");
  const days = JSON.parse(
    await readFile(
      path.join(dataRoot, "days", `week-${weekPadded}.json`),
      "utf8",
    ),
  );
  const manifest = days.find((entry) => entry.day === day);
  if (!manifest)
    throw new Error(`No daily manifest exists for Day ${dayPadded}.`);
  const profileDocument = JSON.parse(
    await readFile(path.join(dataRoot, "acceptance-profiles.json"), "utf8"),
  );
  const profile = profileDocument.profiles[manifest.acceptanceProfile];
  if (!profile)
    throw new Error(
      "Unknown acceptance profile: " + manifest.acceptanceProfile,
    );

  const checkpoint = day < 15 ? 8 : day < 22 ? 15 : 22;
  const context = {
    day: String(day),
    dayPadded,
    checkpoint: String(checkpoint),
    checkpointPadded: String(checkpoint).padStart(2, "0"),
    exerciseId: manifest.exerciseId ?? "",
  };
  const targetMap = new Map();
  for (const check of [
    ...(profile.automaticChecks ?? []),
    ...(manifest.additionalChecks ?? []),
  ]) {
    const target = renderTemplate(
      check.targetTemplate ?? check.target ?? "",
      context,
    ).split("#")[0];
    if (!target.includes(dayPadded)) continue;
    const requiredText = (
      check.requiredTextTemplate ??
      check.requiredText ??
      []
    ).map((item) => renderTemplate(item, context));
    const previous = targetMap.get(target) ?? [];
    targetMap.set(target, [...new Set([...previous, ...requiredText])]);
  }

  if (targetMap.size === 0) {
    console.log(
      `Day ${dayPadded} uses the shared starter ${manifest.starter}; no day-specific file needs to be created.`,
    );
    return;
  }

  if (dryRun) {
    for (const [target, requiredText] of targetMap) {
      assertSafeTarget(root, target);
      starterContent(dayPadded, target, requiredText);
      console.log("Would create red starter: " + target);
    }
    return;
  }

  const created = [];
  const preserved = [];
  for (const [target, requiredText] of targetMap) {
    const result = await writeStarter(
      root,
      target,
      starterContent(dayPadded, target, requiredText),
    );
    if (result === "created") created.push(target);
    else preserved.push(target);
  }

  for (const target of created) console.log("Created red starter: " + target);
  for (const target of preserved)
    console.log("Preserved existing learner file: " + target);
  if (created.length === 0) {
    console.log(
      `Day ${dayPadded} already has every required learner file; nothing was overwritten.`,
    );
  } else {
    console.log(
      `Run npm run learn:day -- ${day} and replace each LEARNING_TODO with your own evidence.`,
    );
  }
}

async function main() {
  const dayFlag = process.argv.indexOf("--day");
  const directDay = process.argv.find((value) => /^\d{1,2}$/.test(value));
  const day = Number(directDay ?? process.argv[dayFlag + 1]);
  const dryRun = process.argv.includes("--dry-run");
  const checkAll = process.argv.includes("--check-all");

  if (!checkAll && (!Number.isInteger(day) || day < 1 || day > 91)) {
    console.error(
      "Choose a day from 1 to 91, for example: npm run learn:create -- --day 57.",
    );
    process.exitCode = 1;
    return;
  }

  const root = process.cwd();
  try {
    if (checkAll) {
      for (let candidate = 1; candidate <= 91; candidate += 1) {
        if (snapshots.has(candidate))
          await createCheckpoint(root, candidate, true);
        else await createDayScaffolds(root, candidate, true);
      }
      console.log(
        "Learning scaffolds: all 91 days resolve to a shared starter or a safe red starter.",
      );
    } else if (snapshots.has(day)) await createCheckpoint(root, day, dryRun);
    else await createDayScaffolds(root, day, dryRun);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
