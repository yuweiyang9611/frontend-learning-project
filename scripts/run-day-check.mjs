import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const day = Number(process.argv.find((value) => /^\d{1,2}$/.test(value)));
if (!Number.isInteger(day) || day < 1 || day > 91) {
  console.error(
    "Choose a day from 1 to 91, for example: npm run learn:day -- 29",
  );
  process.exit(1);
}

const root = process.cwd();
const dayPadded = String(day).padStart(2, "0");
const week = Math.ceil(day / 7);
const checkpoint = day < 15 ? 8 : day < 22 ? 15 : 22;
const manifestPath = path.join(
  root,
  "docs",
  "90-days",
  "data",
  "days",
  "week-" + String(week).padStart(2, "0") + ".json",
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8")).find(
  (entry) => entry.day === day,
);
if (!manifest)
  throw new Error(`Missing daily acceptance manifest for Day ${dayPadded}.`);

const profileDocument = JSON.parse(
  await readFile(
    path.join(root, "docs", "90-days", "data", "acceptance-profiles.json"),
    "utf8",
  ),
);
const profile = manifest.acceptanceProfile
  ? profileDocument.profiles[manifest.acceptanceProfile]
  : null;
if (manifest.acceptanceProfile && !profile) {
  throw new Error(
    `Unknown acceptance profile for Day ${dayPadded}: ${manifest.acceptanceProfile}`,
  );
}

const templateContext = {
  day: String(day),
  dayPadded,
  checkpoint: String(checkpoint),
  checkpointPadded: String(checkpoint).padStart(2, "0"),
  exerciseId: manifest.exerciseId ?? "",
};

function renderTemplate(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_match, key) => {
    if (!(key in templateContext))
      throw new Error(`Unknown acceptance template key: ${key}`);
    return templateContext[key];
  });
}

function resolveCheck(check, index) {
  const args = (check.argsTemplate ?? check.args ?? []).map(renderTemplate);
  const requiredText = (
    check.requiredTextTemplate ??
    check.requiredText ??
    []
  ).map(renderTemplate);
  return {
    ...check,
    id: renderTemplate(
      check.idTemplate ?? check.id ?? `D${dayPadded}-A${index + 1}`,
    ),
    args,
    requiredText,
    target: renderTemplate(
      check.targetTemplate ?? check.target ?? manifest.starter,
    ),
  };
}

function extractDaySection(source) {
  const heading = new RegExp(
    `^## Day ${dayPadded}：.*\\{#day-${dayPadded}\\}.*$`,
    "m",
  ).exec(source);
  if (!heading)
    throw new Error(`Cannot find Day ${dayPadded} in ${manifest.source}.`);
  const afterHeading = heading.index + heading[0].length;
  const nextHeading = /^## Day \d{2}：/m.exec(source.slice(afterHeading));
  const end = nextHeading ? afterHeading + nextHeading.index : source.length;
  return source.slice(heading.index, end);
}

function findSubsection(section, acceptedHeadings, level = 3) {
  const marker = "#".repeat(level);
  const headings = [
    ...section.matchAll(new RegExp(`^${marker} (.+?)\\r?$`, "gm")),
  ];
  for (const accepted of acceptedHeadings) {
    const index = headings.findIndex((match) => match[1].trim() === accepted);
    if (index < 0) continue;
    const start = (headings[index].index ?? 0) + headings[index][0].length;
    const end = headings[index + 1]?.index ?? section.length;
    const body = section.slice(start, end).trim();
    if (body) return { heading: accepted, body };
  }
  return null;
}

const [lessonFile] = manifest.source.split("#");
const lessonSource = await readFile(
  path.join(root, "docs", "90-days", lessonFile),
  "utf8",
);
const lessonSection = extractDaySection(lessonSource);
let manualItems = manifest.manual ?? [];

if (profile) {
  const manualSource = profileDocument.defaults.manualSource;
  const procedure = findSubsection(
    lessonSection,
    manualSource.procedureHeadings,
  );
  const expected = findSubsection(lessonSection, manualSource.expectedHeadings);
  if (!procedure || !expected) {
    throw new Error(
      `Day ${dayPadded} must expose an independent task and an acceptance subsection for profile-driven review.`,
    );
  }
  manualItems = [
    {
      id: `D${dayPadded}-M1`,
      procedure: `${procedure.heading}\n\n${procedure.body}`,
      expected: `${expected.heading}\n\n${expected.body}`,
      requiresReview: true,
    },
  ];
}

const directory = path.join(root, "learning-evidence", "day-" + dayPadded);
await mkdir(directory, { recursive: true });
const results = [];

if (profile) {
  const notePolicy = profileDocument.defaults.evidenceNote;
  const notePath = path.join(root, renderTemplate(notePolicy.pathTemplate));
  let note;
  let created = false;
  try {
    note = await readFile(notePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    created = true;
    note = [
      `# Day ${dayPadded} 验收记录`,
      "",
      `> 课程来源：${manifest.source}`,
      "",
      ...notePolicy.learnerSections.flatMap((heading) => [
        `## ${heading}`,
        "",
        "TODO：用自己的证据填写本节；不要粘贴 secrets、Cookie、连接串或整份日志。",
        "",
      ]),
      "## 复核依据",
      "",
      `### ${manualItems[0].procedure.split("\n")[0]}`,
      "",
      manualItems[0].procedure.split("\n").slice(2).join("\n"),
      "",
      `### ${manualItems[0].expected.split("\n")[0]}`,
      "",
      manualItems[0].expected.split("\n").slice(2).join("\n"),
      "",
    ].join("\n");
    await writeFile(notePath, note, "utf8");
    console.error(
      `Created ${path.relative(root, notePath)}. Fill its four learner sections, then rerun Day ${dayPadded}.`,
    );
  }

  const noteFailures = [];
  for (const heading of notePolicy.learnerSections) {
    const section = findSubsection(note, [heading], 2);
    const body = section?.body ?? "";
    if (!section) noteFailures.push(`missing section: ${heading}`);
    else if (/\b(?:TODO|TBD)\b|待填写/i.test(body))
      noteFailures.push(`unfinished section: ${heading}`);
    else if (
      [...body.replace(/<!--.*?-->/gs, "").trim()].length <
      notePolicy.minimumCharactersPerSection
    ) {
      noteFailures.push(`section is too short: ${heading}`);
    }
  }
  if (!created && noteFailures.length > 0) {
    console.error(`${path.relative(root, notePath)} is not reviewable:`);
    for (const failure of noteFailures) console.error(`- ${failure}`);
  }
  results.push({
    id: `D${dayPadded}-A0`,
    kind: "evidence-note",
    target: path.relative(root, notePath).replaceAll("\\", "/"),
    expectedExit: 0,
    exitCode: created || noteFailures.length > 0 ? 1 : 0,
  });
}

if (day >= profileDocument.defaults.dotnetRequiredFromDay) {
  const prerequisiteResult = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts", "check-prerequisites.mjs"),
      "--day",
      String(day),
    ],
    {
      cwd: root,
      stdio: "inherit",
      shell: false,
      env: { ...process.env, LEARNING_DAY: String(day) },
    },
  );
  results.push({
    id: `D${dayPadded}-P1`,
    kind: "prerequisite",
    target: "scripts/check-prerequisites.mjs",
    expectedExit: 0,
    exitCode: prerequisiteResult.status ?? 1,
  });
}

const configuredChecks = profile
  ? [...(profile.automaticChecks ?? []), ...(manifest.additionalChecks ?? [])]
  : (manifest.checks ?? []);

for (const [index, sourceCheck] of configuredChecks.entries()) {
  const check = resolveCheck(sourceCheck, index);
  if (check.kind === "learner-file") {
    const targetPath = path.join(root, check.target);
    const failures = [];
    try {
      const content = await readFile(targetPath, "utf8");
      if ([...content.trim()].length < check.minimumCharacters)
        failures.push("file is too short");
      if (/\b(?:TODO|TBD)\b|待填写/i.test(content))
        failures.push("file still contains a placeholder");
      for (const requiredText of check.requiredText) {
        if (!content.includes(requiredText))
          failures.push(`missing required text: ${requiredText}`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") failures.push("file does not exist");
      else throw error;
    }
    if (failures.length > 0) {
      console.error(`${check.target} does not satisfy ${check.id}:`);
      for (const failure of failures) console.error(`- ${failure}`);
    }
    results.push({
      id: check.id,
      kind: check.kind,
      target: check.target,
      expectedExit: check.expectedExit,
      exitCode: failures.length > 0 ? 1 : 0,
    });
    continue;
  }

  let command;
  let args;
  let cwd = root;
  let shell = false;
  if (check.kind === "npm-script") {
    if (process.env.npm_execpath) {
      command = process.execPath;
      args = [process.env.npm_execpath, "run", check.script];
    } else {
      command = "npm";
      args = ["run", check.script];
      shell = process.platform === "win32";
    }
    if (check.args.length > 0) args.push("--", ...check.args);
    if (check.project === "frontend") cwd = path.join(root, "frontend");
  } else if (check.kind === "dotnet-test") {
    command = "dotnet";
    args = ["test", check.solution, "--nologo", ...check.args];
  } else {
    throw new Error(`Unsupported check kind for ${check.id}: ${check.kind}`);
  }

  const childEnvironment = { ...process.env, LEARNING_DAY: String(day) };
  if (manifest.exerciseId) {
    childEnvironment.EXERCISE_ID = manifest.exerciseId;
    childEnvironment.EXERCISE_TARGET = "workbench";
  }
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell,
    env: childEnvironment,
  });
  if (result.error)
    console.error(`${check.id} could not start: ${result.error.message}`);
  results.push({
    id: check.id,
    kind: check.kind,
    script: check.script,
    args: check.args,
    target: check.target,
    expectedExit: check.expectedExit,
    exitCode: result.status ?? 1,
  });
}

const report = {
  schemaVersion: 2,
  day,
  source: manifest.source,
  acceptanceProfile: manifest.acceptanceProfile ?? "legacy",
  timeBudget: {
    activeMinutes: manifest.durationMinutes,
    setupBufferMinutes: manifest.setupBufferMinutes ?? 0,
    wallClockStop: manifest.wallClockStop ?? null,
  },
  generatedAt: new Date().toISOString(),
  sanitization: {
    status: "pendingReview",
    reason:
      "Commands stream to the terminal; a human must review any captured evidence before sharing.",
  },
  checks: results,
  manual: manualItems.map((item) => ({
    id: item.id,
    status: "pendingReview",
    procedure: item.procedure,
    expected: item.expected,
  })),
};
const reportPath = path.join(directory, "report.json");
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log("Evidence report: " + path.relative(root, reportPath));
if (results.some((item) => item.exitCode !== item.expectedExit))
  process.exitCode = 1;
