import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ids = new Set();
let questionCount = 0;
const concepts = JSON.parse(
  await readFile(path.join(root, "docs/90-days/data/concepts.json"), "utf8"),
);

for (let week = 1; week <= 13; week += 1) {
  const file = path.join(
    root,
    "docs",
    "90-days",
    "data",
    "quizzes",
    `week-${String(week).padStart(2, "0")}.json`,
  );
  const quiz = JSON.parse(await readFile(file, "utf8"));
  if (quiz.week !== week) throw new Error(`${file}: expected week ${week}.`);
  if (typeof quiz.title !== "string" || quiz.title.length < 4)
    throw new Error(`${file}: missing title.`);
  if (typeof quiz.reviewPrompt !== "string" || quiz.reviewPrompt.length < 20)
    throw new Error(`${file}: missing review prompt.`);
  if (!Array.isArray(quiz.rubric) || quiz.rubric.length < 3)
    throw new Error(`${file}: rubric needs at least three checks.`);
  if (!Array.isArray(quiz.questions) || quiz.questions.length !== 12)
    throw new Error(`${file}: weekly quiz needs exactly twelve questions.`);

  for (const kind of ["reading", "debugging", "transfer"]) {
    if (quiz.questions.filter((q) => q.kind === kind).length !== 3)
      throw new Error(file + ": needs three " + kind + " questions.");
  }
  for (const [index, question] of quiz.questions.entries()) {
    if (
      question.id !==
      "w" +
        String(week).padStart(2, "0") +
        "-q" +
        String(index + 1).padStart(2, "0")
    )
      throw new Error("Unexpected question order/ID: " + question.id);
    if (
      !["concept", "reading", "debugging", "transfer"].includes(question.kind)
    )
      throw new Error(question.id + ": unknown kind");
    if (
      !["foundation", "application", "analysis"].includes(question.difficulty)
    )
      throw new Error(question.id + ": unknown difficulty");
    if (
      !concepts[question.conceptId] ||
      concepts[question.conceptId].introducedDay > week * 7
    )
      throw new Error(question.id + ": concept not taught yet");
    if (
      !Array.isArray(question.choiceExplanations) ||
      question.choiceExplanations.length !== question.choices.length ||
      question.choiceExplanations.some(
        (reason) => typeof reason !== "string" || reason.length < 15,
      )
    )
      throw new Error(question.id + ": missing option explanations");
    if (
      question.code &&
      (![
        "html",
        "css",
        "javascript",
        "typescript",
        "json",
        "sql",
        "csharp",
        "text",
      ].includes(question.language) ||
        typeof question.code !== "string")
    )
      throw new Error(question.id + ": invalid code metadata");

    if (ids.has(question.id))
      throw new Error(`Duplicate quiz question ID: ${question.id}`);
    ids.add(question.id);
    questionCount += 1;
    const [url, anchor] = question.remediation.split("#");
    const markdown = await readFile(
      path.join(root, "docs", url.replace(/^\//, "").replace(/\.html$/, ".md")),
      "utf8",
    );
    if (!anchor || !markdown.includes("{#" + anchor + "}"))
      throw new Error(question.id + ": remediation anchor not found");
    if (
      concepts[question.conceptId].introducedDay >
      Number(anchor.replace("day-", ""))
    )
      throw new Error(question.id + ": remediation precedes concept");
    if (!Array.isArray(question.choices) || question.choices.length < 3)
      throw new Error(`${question.id}: needs at least three choices.`);
    if (
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.choices.length
    ) {
      throw new Error(`${question.id}: invalid correctIndex.`);
    }
    if (
      typeof question.explanation !== "string" ||
      question.explanation.length < 15
    )
      throw new Error(`${question.id}: explanation is too short.`);
    if (
      !/^\/90-days\/week-\d{2}-.+\.html#day-\d{2}$/.test(question.remediation)
    ) {
      throw new Error(
        `${question.id}: remediation must point to a specific course day.`,
      );
    }
  }
}

if (questionCount !== 156)
  throw new Error(
    `Expected exactly 156 review questions, found ${questionCount}.`,
  );
console.log(
  `Review bank verified: 13 weekly quizzes, ${questionCount} questions, unique IDs and targeted remediation links.`,
);
