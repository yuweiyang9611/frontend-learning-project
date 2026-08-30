import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ids = new Set();
let questionCount = 0;

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
  if (!Array.isArray(quiz.questions) || quiz.questions.length < 3)
    throw new Error(`${file}: weekly quiz needs at least three questions.`);
  for (const question of quiz.questions) {
    if (ids.has(question.id))
      throw new Error(`Duplicate quiz question ID: ${question.id}`);
    ids.add(question.id);
    questionCount += 1;
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

if (questionCount < 39)
  throw new Error(
    `Expected at least 39 review questions, found ${questionCount}.`,
  );
console.log(
  `Review bank verified: 13 weekly quizzes, ${questionCount} questions, unique IDs and targeted remediation links.`,
);
