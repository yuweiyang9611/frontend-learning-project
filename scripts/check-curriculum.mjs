import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const curriculumRoot = path.join(root, "docs", "90-days");
const expectedSupportFiles = [
  "README.md",
  "how-to-study.md",
  "progress-and-journal.md",
  "assessments.md",
];
const expectedTypeScriptFiles = [
  "07-pattern-cookbook.md",
  "08-exercise-bank.md",
  "09-type-error-debugging.md",
];
const failures = [];
const allDays = [];

function fail(message) {
  failures.push(message);
}

for (const file of expectedSupportFiles) {
  if (!fs.existsSync(path.join(curriculumRoot, file))) {
    fail(`缺少课程支持文档：docs/90-days/${file}`);
  }
}

for (const file of expectedTypeScriptFiles) {
  if (!fs.existsSync(path.join(root, "docs", "typescript", file))) {
    fail(`缺少 TypeScript 扩展文档：docs/typescript/${file}`);
  }
}

const progressPath = path.join(curriculumRoot, "progress-and-journal.md");
if (fs.existsSync(progressPath)) {
  const progress = fs.readFileSync(progressPath, "utf8");
  const checklistDays = [...progress.matchAll(/^- \[ \] Day (\d{2})\b/gm)].map(
    (match) => Number(match[1]),
  );
  const expectedChecklistDays = Array.from(
    { length: 91 },
    (_, index) => index + 1,
  );
  if (
    checklistDays.length !== expectedChecklistDays.length ||
    checklistDays.some((day, index) => day !== expectedChecklistDays[index])
  ) {
    fail("进度日志必须包含连续且不重复的 Day 01–91 检查项");
  }
}

const cookbookPath = path.join(
  root,
  "docs",
  "typescript",
  "07-pattern-cookbook.md",
);
if (fs.existsSync(cookbookPath)) {
  const cookbook = fs.readFileSync(cookbookPath, "utf8");
  const patternCount = [...cookbook.matchAll(/^## \d+\.\s/gm)].length;
  if (patternCount < 10) {
    fail(`TypeScript Cookbook 至少需要 10 个模式，实际为 ${patternCount}`);
  }
}

const exercisePath = path.join(
  root,
  "docs",
  "typescript",
  "08-exercise-bank.md",
);
if (fs.existsSync(exercisePath)) {
  const exercises = fs.readFileSync(exercisePath, "utf8");
  const exerciseCount = [...exercises.matchAll(/^### [A-Z]\d{2}：.+$/gm)]
    .length;
  if (exerciseCount < 24) {
    fail(`TypeScript 分级练习至少需要 24 题，实际为 ${exerciseCount}`);
  }
}

for (let week = 1; week <= 13; week += 1) {
  const prefix = `week-${String(week).padStart(2, "0")}-`;
  const matches = fs.existsSync(curriculumRoot)
    ? fs.readdirSync(curriculumRoot).filter((name) => name.startsWith(prefix))
    : [];

  if (matches.length !== 1) {
    fail(`第 ${week} 周应恰好有一个文件，实际找到 ${matches.length} 个`);
    continue;
  }

  const file = matches[0];
  const source = fs.readFileSync(path.join(curriculumRoot, file), "utf8");
  const headings = [...source.matchAll(/^## Day (\d{2})：.+$/gm)];
  const timeSections = [
    ...source.matchAll(/^### (?:完整 )?120 分钟(?:任务|安排)?$/gm),
  ];

  if (headings.length !== 7) {
    fail(`${file} 应包含 7 个 Day 标题，实际为 ${headings.length}`);
  }
  if (timeSections.length !== 7) {
    fail(
      `${file} 应包含 7 个“120 分钟任务/安排”，实际为 ${timeSections.length}`,
    );
  }

  headings.forEach((heading, index) => {
    const day = Number(heading[1]);
    allDays.push(day);
    const sectionStart = heading.index ?? 0;
    const sectionEnd = headings[index + 1]?.index ?? source.length;
    const section = source.slice(sectionStart, sectionEnd);
    const scheduleBody =
      section
        .split(/^### (?:完整 )?120 分钟(?:任务|安排)?$/m)[1]
        ?.split(/^### /m)[0] ?? "";
    const slots = [
      ...scheduleBody.matchAll(
        /^(?:[-*]|\|)\s*(?:\*\*)?(\d{1,3})[–-](\d{1,3})/gm,
      ),
    ].map((slot) => [Number(slot[1]), Number(slot[2])]);

    if (!/(独立|闭卷|周项目|毕业项目)/.test(section)) {
      fail(`${file} 的 Day ${heading[1]} 缺少独立任务或闭卷项目`);
    }
    if (!/(验收|证据|通过标准|过关标准)/.test(section)) {
      fail(`${file} 的 Day ${heading[1]} 缺少可检查的验收证据`);
    }
    if (section.length < 600) {
      fail(`${file} 的 Day ${heading[1]} 内容过短，不能支撑完整实验与验收`);
    }
    if (
      slots.length < 3 ||
      slots[0][0] !== 0 ||
      slots.at(-1)?.[1] !== 120 ||
      slots.some(
        (slot, slotIndex) =>
          slot[1] <= slot[0] ||
          (slotIndex > 0 && slot[0] !== slots[slotIndex - 1][1]),
      )
    ) {
      fail(`${file} 的 Day ${heading[1]} 时间表必须无缝覆盖 0–120 分钟`);
    }
  });
}

const expectedDays = Array.from({ length: 91 }, (_, index) => index + 1);
if (
  allDays.length !== expectedDays.length ||
  allDays.some((day, index) => day !== expectedDays[index])
) {
  fail(`Day 编号必须连续为 01–91，实际为：${allDays.join(", ")}`);
}

if (failures.length > 0) {
  console.error(`课程完整性检查失败（${failures.length} 项）：`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  "课程完整性检查通过：13 周、91 天、每天 120 分钟，总计至少 182 小时；支持文档与 TypeScript 扩展齐全。",
);
