import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataRoot = path.join(root, "docs", "90-days", "data");
const concepts = JSON.parse(
  await readFile(path.join(dataRoot, "concepts.json"), "utf8"),
);
const profileDocument = JSON.parse(
  await readFile(path.join(dataRoot, "acceptance-profiles.json"), "utf8"),
);
const rootPackage = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const frontendPackage = JSON.parse(
  await readFile(path.join(root, "frontend", "package.json"), "utf8"),
);
const manifests = [];

for (let week = 1; week <= 13; week += 1) {
  const file = path.join(
    dataRoot,
    "days",
    "week-" + String(week).padStart(2, "0") + ".json",
  );
  manifests.push(...JSON.parse(await readFile(file, "utf8")));
}

function renderTemplate(value, context) {
  if (typeof value !== "string") return value;
  return value.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_match, key) => {
    if (!(key in context))
      throw new Error("Unknown acceptance template key: " + key);
    return context[key];
  });
}

function findSubsection(section, acceptedHeadings) {
  const headings = [...section.matchAll(/^### (.+?)\r?$/gm)];
  for (const accepted of acceptedHeadings) {
    const index = headings.findIndex((match) => match[1].trim() === accepted);
    if (index < 0) continue;
    const start = (headings[index].index ?? 0) + headings[index][0].length;
    const end = headings[index + 1]?.index ?? section.length;
    const body = section.slice(start, end).trim();
    if (body) return accepted + "\n" + body;
  }
  return null;
}

function assertSafeRelativeTarget(target, checkId) {
  const [fileTarget] = target.split("#");
  if (path.isAbsolute(fileTarget) || fileTarget.split(/[\\/]/).includes("..")) {
    throw new Error(checkId + " must target a repository-relative path.");
  }
}

async function validateCheck(sourceCheck, day, context) {
  if ("command" in sourceCheck)
    throw new Error("Day checks must be structured, not raw shell commands.");
  const id = renderTemplate(sourceCheck.idTemplate ?? sourceCheck.id, context);
  const target = renderTemplate(
    sourceCheck.targetTemplate ?? sourceCheck.target ?? "",
    context,
  );
  const args = (sourceCheck.argsTemplate ?? sourceCheck.args ?? []).map(
    (item) => renderTemplate(item, context),
  );
  const requiredText = (
    sourceCheck.requiredTextTemplate ??
    sourceCheck.requiredText ??
    []
  ).map((item) => renderTemplate(item, context));
  if (!id)
    throw new Error(
      "Day " + day.day + " contains a check without an id or idTemplate.",
    );
  if (sourceCheck.expectedExit !== 0)
    throw new Error(id + " must declare expectedExit 0.");
  if (!Array.isArray(args) || args.some((item) => typeof item !== "string")) {
    throw new Error(id + " args must be a string array.");
  }
  if (target) assertSafeRelativeTarget(target, id);

  if (sourceCheck.kind === "learner-file") {
    if (
      !target ||
      !Number.isInteger(sourceCheck.minimumCharacters) ||
      sourceCheck.minimumCharacters < 80 ||
      requiredText.length === 0 ||
      requiredText.some((item) => typeof item !== "string" || item.length === 0)
    ) {
      throw new Error(
        id +
          " must declare a meaningful learner-file target, size, and required text.",
      );
    }
  } else if (sourceCheck.kind === "npm-script") {
    const scripts =
      sourceCheck.project === "frontend"
        ? frontendPackage.scripts
        : rootPackage.scripts;
    if (!scripts?.[sourceCheck.script])
      throw new Error(
        id + " references missing npm script " + sourceCheck.script + ".",
      );
  } else if (sourceCheck.kind === "dotnet-test") {
    await access(path.join(root, sourceCheck.solution));
  } else {
    throw new Error(
      id + " uses unsupported check kind " + sourceCheck.kind + ".",
    );
  }
}

if (
  profileDocument.schemaVersion !== 1 ||
  !profileDocument.defaults?.evidenceNote ||
  profileDocument.defaults.dotnetRequiredFromDay !== 71
) {
  throw new Error(
    "acceptance-profiles.json must declare schemaVersion 1, evidence notes, and the Day 71 .NET gate.",
  );
}
if (manifests.length !== 91)
  throw new Error("Daily acceptance must contain exactly 91 entries.");

const manualSignatures = new Map();
const exerciseIds = new Set();
const requiredHeavyDays = new Set([1, 77, 80, 83, 90]);

for (const [index, day] of manifests.entries()) {
  const expectedDay = index + 1;
  const dayPadded = String(day.day).padStart(2, "0");
  if (day.day !== expectedDay || day.durationMinutes !== 120)
    throw new Error("Invalid entry for Day " + expectedDay + ".");
  const hasBuffer = "setupBufferMinutes" in day || "wallClockStop" in day;
  if (
    hasBuffer &&
    (!Number.isInteger(day.setupBufferMinutes) ||
      day.setupBufferMinutes < 1 ||
      day.setupBufferMinutes > 120 ||
      typeof day.wallClockStop !== "string" ||
      day.wallClockStop.trim().length < 20)
  ) {
    throw new Error(
      "Day " +
        day.day +
        " has invalid setupBufferMinutes/wallClockStop metadata.",
    );
  }
  if (requiredHeavyDays.has(day.day) && !hasBuffer) {
    throw new Error(
      "Heavy Day " +
        day.day +
        " must declare a setup buffer and a wall-clock stop.",
    );
  }

  for (const conceptId of day.requiresConcepts) {
    if (!concepts[conceptId] || concepts[conceptId].introducedDay > day.day) {
      throw new Error(
        "Day " +
          day.day +
          " depends on a concept that has not been introduced: " +
          conceptId,
      );
    }
  }

  const [sourceFile, sourceAnchor] = day.source.split("#");
  const source = await readFile(
    path.join(root, "docs", "90-days", sourceFile),
    "utf8",
  );
  const expectedAnchor = "day-" + dayPadded;
  const headingPattern = new RegExp(
    "^## Day " + dayPadded + "：.*\\{#" + expectedAnchor + "\\}$",
    "m",
  );
  if (sourceAnchor !== expectedAnchor || !headingPattern.test(source)) {
    throw new Error(
      "Day " +
        day.day +
        " does not map to its stable Markdown anchor #" +
        expectedAnchor +
        ".",
    );
  }
  await access(path.join(root, day.starter));

  const profile = profileDocument.profiles[day.acceptanceProfile];
  if (!profile)
    throw new Error(
      "Day " + day.day + " must reference a supported acceptanceProfile.",
    );
  if ("manual" in day || "checks" in day) {
    throw new Error(
      "Day " +
        day.day +
        " must use its acceptance profile instead of copied checks/manual blocks.",
    );
  }
  if (profile.requiresExerciseId) {
    if (!/^[ABC]\d{2}$/.test(day.exerciseId ?? "")) {
      throw new Error(
        "Day " + day.day + " must declare a valid TypeScript exerciseId.",
      );
    }
    if (exerciseIds.has(day.exerciseId))
      throw new Error("Duplicate TypeScript exerciseId: " + day.exerciseId);
    exerciseIds.add(day.exerciseId);
  } else if ("exerciseId" in day) {
    throw new Error(
      "Day " +
        day.day +
        " declares exerciseId outside the TypeScript workbench profile.",
    );
  }

  const headingMatch = headingPattern.exec(source);
  const sectionStart = headingMatch?.index ?? 0;
  const afterHeading = sectionStart + (headingMatch?.[0].length ?? 0);
  const nextHeading = /^## Day \d{2}：/m.exec(source.slice(afterHeading));
  const sectionEnd = nextHeading
    ? afterHeading + nextHeading.index
    : source.length;
  const lessonSection = source.slice(sectionStart, sectionEnd);
  const procedure = findSubsection(
    lessonSection,
    profileDocument.defaults.manualSource.procedureHeadings,
  );
  const expected = findSubsection(
    lessonSection,
    profileDocument.defaults.manualSource.expectedHeadings,
  );
  if (!procedure || !expected) {
    throw new Error(
      "Day " +
        day.day +
        " cannot derive a day-specific independent task and review expectation.",
    );
  }
  const signature = (procedure + "\n" + expected).replace(/\s+/g, " ").trim();
  if (manualSignatures.has(signature)) {
    throw new Error(
      "Day " +
        day.day +
        " duplicates manual acceptance from Day " +
        manualSignatures.get(signature) +
        ".",
    );
  }
  manualSignatures.set(signature, day.day);

  const configuredChecks = [
    ...(profile.automaticChecks ?? []),
    ...(day.additionalChecks ?? []),
  ];
  if (configuredChecks.length === 0)
    throw new Error("Day " + day.day + " profile has no objective check.");

  const checkpoint = day.day < 15 ? 8 : day.day < 22 ? 15 : 22;
  const context = {
    day: String(day.day),
    dayPadded,
    checkpoint: String(checkpoint),
    checkpointPadded: String(checkpoint).padStart(2, "0"),
    exerciseId: day.exerciseId ?? "",
  };
  for (const check of configuredChecks)
    await validateCheck(check, day, context);

  if (day.day >= 57 && day.acceptanceProfile !== "dual-contract") {
    const hasDayTarget = profile.automaticChecks.some((check) => {
      const target = renderTemplate(
        check.targetTemplate ?? check.target ?? "",
        context,
      );
      return target.includes(dayPadded);
    });
    if (!hasDayTarget)
      throw new Error(
        "Day " + day.day + " must target a day-specific learner file.",
      );
  }

  const expectedEvidence =
    "learning-evidence/day-" + dayPadded + "/report.json";
  if (
    !day.evidence.some(
      (item) =>
        item.pathTemplate === expectedEvidence &&
        item.schema === "learning-evidence-v2",
    )
  ) {
    throw new Error(
      "Day " + day.day + " is missing its canonical v2 evidence path.",
    );
  }
}

if (exerciseIds.size !== 21) {
  throw new Error(
    "Days 29–49 must map to 21 distinct TypeScript workbench exercises.",
  );
}

console.log(
  "Daily acceptance: all 91 days use precise profiles, lesson-derived human review, staged prerequisites, and reviewable evidence.",
);
