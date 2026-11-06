// What the opening screen shows from the owner's own record. Pure, so it can be tested without a browser.
import { DAY_COUNT, PROGRESS_STORAGE_KEY, decodeProgress, normalizeProgress } from './progress-state.mjs';
import { REVIEW_STORAGE_KEY, decodeReviewState, reviewSummary } from './review-state.mjs';

/**
 * The third record, added for the loop band: which lesson pages the reader opened, whose code panel
 * they opened and where a browser run finished. One entry per lesson page, keyed by its path without
 * `.md` (`90-days/week-05-typescript-foundations`), each field an ISO time set once, on the first
 * occasion. The progress and review records keep their keys and shapes; the home site reads those.
 */
export const VISITS_APP = 'issueflow-learning-visits';
export const VISITS_VERSION = 1;
export const VISITS_STORAGE_KEY = 'issueflow:frontend-learning-project:visits:v1';
export const VISIT_FIELDS = ['readAt', 'codeAt', 'ranAt'];
const MAX_VISIT_PAGES = 400;
const lessonKeyPattern = /^[\w.-]+(?:\/[\w.-]+)*$/;

export function createVisits() {
  return { app: VISITS_APP, schemaVersion: VISITS_VERSION, pages: {} };
}

/** The record key of a page: its relative path without the extension. */
export function lessonKey(relativePath) {
  return String(relativePath ?? '')
    .replace(/^\/+/, '')
    .replace(/\.(?:md|html)$/, '');
}

export function decodeVisits(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return createVisits();
  if (input.app !== VISITS_APP || input.schemaVersion !== VISITS_VERSION) return createVisits();
  if (!input.pages || typeof input.pages !== 'object' || Array.isArray(input.pages)) return createVisits();
  const pages = {};
  for (const [key, candidate] of Object.entries(input.pages).slice(0, MAX_VISIT_PAGES)) {
    if (!lessonKeyPattern.test(key) || key.length > 200) continue;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const entry = {};
    for (const field of VISIT_FIELDS) {
      const value = candidate[field];
      if (typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value))) entry[field] = value;
    }
    if (Object.keys(entry).length) pages[key] = entry;
  }
  return { app: VISITS_APP, schemaVersion: VISITS_VERSION, pages };
}

export function readVisits(storage) {
  try {
    const raw = storage?.getItem(VISITS_STORAGE_KEY);
    return raw ? decodeVisits(JSON.parse(raw)) : createVisits();
  } catch {
    return createVisits();
  }
}

/**
 * Sets one visit field for a page when it is not set yet, and says whether it wrote. `field` is one
 * of VISIT_FIELDS. A reader without storage gets false and nothing else happens.
 */
export function markVisit(storage, relativePath, field, now = new Date().toISOString()) {
  if (!VISIT_FIELDS.includes(field)) return false;
  const key = lessonKey(relativePath);
  if (!lessonKeyPattern.test(key)) return false;
  const visits = readVisits(storage);
  const entry = visits.pages[key] ?? {};
  if (entry[field]) return false;
  visits.pages[key] = { ...entry, [field]: now };
  try {
    storage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
  } catch {
    return false;
  }
  announceRecord();
  return true;
}

/** Reads the records the way the tracker and the review centre do. Missing or unreadable means none. */
export function readRecords(storage) {
  let progress = null;
  let review = null;
  try {
    const raw = storage?.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const decoded = decodeProgress(JSON.parse(raw));
      if (decoded.ok) progress = normalizeProgress(decoded.value);
    }
  } catch {
    progress = null;
  }
  try {
    const raw = storage?.getItem(REVIEW_STORAGE_KEY);
    if (raw) review = decodeReviewState(JSON.parse(raw));
  } catch {
    review = null;
  }
  return { progress, review, visits: readVisits(storage) };
}

function hasWork(day) {
  return day.completed || day.minutes > 0 || day.note.trim() !== '' || day.evidence.length > 0;
}

/**
 * Course position from the progress record. With no record, `started` is false and the first day is
 * offered; nothing is marked as stopped or done.
 */
export function courseState(weeks, progress, now = Date.now()) {
  const days = progress?.days ?? [];
  const byDay = new Map(days.map((day) => [day.day, day]));
  const started = days.some(hasWork);
  const completedDays = days.filter((day) => day.completed);
  const allDays = weeks.flatMap((week) => week.days.map((day) => ({ ...day, week: week.week })));
  const next = allDays.find((day) => !byDay.get(day.day)?.completed) ?? null;
  const lastCompletedAt = completedDays.reduce((latest, day) => {
    const time = typeof day.completedAt === 'string' ? Date.parse(day.completedAt) : NaN;
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, 0);
  return {
    started,
    completed: completedDays.length,
    total: DAY_COUNT,
    minutes: days.reduce((sum, day) => sum + day.minutes, 0),
    next: next ?? allDays.at(-1),
    finished: started && next === null,
    stoppedWeek: started && next ? next.week : null,
    lastCompleted: lastCompletedAt ? sinceText(lastCompletedAt, now) : '',
    weeks: weeks.map((week) => ({
      week: week.week,
      completed: week.days.filter((day) => byDay.get(day.day)?.completed).length,
      total: week.days.length,
    })),
  };
}

/** Same wording as the project index, so the two pages agree. */
export function sinceText(time, now = Date.now()) {
  const days = Math.floor((now - time) / 86400000);
  if (days <= 0) return '今天';
  return days === 1 ? '昨天' : `${days} 天前`;
}

/** Weekly check state for one week from the review record: answered and currently correct. */
export function weekCheck(review, week) {
  if (!review) return null;
  const prefix = `w${String(week).padStart(2, '0')}-`;
  const records = Object.entries(review.records).filter(([id]) => id.startsWith(prefix));
  if (records.length === 0) return null;
  return { answered: records.length, correct: records.filter(([, record]) => record.lastCorrect).length };
}

export function reviewState(review, now = new Date().toISOString()) {
  if (!review || Object.keys(review.records).length === 0) return null;
  return reviewSummary(review, now);
}

/**
 * The 13 weeks in four phases, each with one hue from the kit. The hue fills a week's card head and
 * its page band, and the phase word sits beside it in the eyebrow. Red is kept for wrong.
 */
export const PHASES = [
  { word: 'Web 基础', hue: 'green', weeks: [1, 2, 3, 4] },
  { word: 'TypeScript', hue: 'cyan', weeks: [5, 6, 7] },
  { word: 'React', hue: 'blue', weeks: [8, 9, 10] },
  { word: '工程与毕业', hue: 'purple', weeks: [11, 12, 13] },
];

export function weekPhase(week) {
  return PHASES.find((phase) => phase.weeks.includes(week)) ?? PHASES[0];
}

/** The hue for a kind of record page: the two record pages are blue, the place to continue. */
export const RECORD_HUE = 'blue';

/** Fired on `window` after a record is written, so a page band on the same page can re-read it. */
export const RECORD_EVENT = 'issueflow:record';

export function announceRecord() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new Event(RECORD_EVENT));
}

/**
 * The band at the top of a reading page under 90-days/: a week page carries its week and phase with the
 * week's days done; the two record pages carry the course total and the review queue. Other pages have
 * none. Pure, so the server render (no record) and the mounted render use the same shape.
 */
export function pageBand(relativePath, weeks, records, now = Date.now()) {
  const path = String(relativePath ?? '');
  const weekMatch = path.match(/^90-days\/week-(\d\d)-/);
  if (weekMatch) {
    const week = Number(weekMatch[1]);
    const outline = weeks.find((entry) => entry.week === week);
    if (!outline) return null;
    const state = courseState(weeks, records?.progress ?? null, now);
    const counts = state.weeks.find((entry) => entry.week === week) ?? { completed: 0, total: outline.days.length };
    const phase = weekPhase(week);
    return {
      hue: phase.hue,
      eyebrow: `第 ${week} 周 · ${phase.word}`,
      label: `第 ${week} 周进度`,
      note: `${counts.completed} / ${counts.total} 天`,
      value: counts.completed,
      max: counts.total,
    };
  }
  if (path === '90-days/progress-and-journal.md') {
    const state = courseState(weeks, records?.progress ?? null, now);
    return {
      hue: RECORD_HUE,
      eyebrow: '记录 · 91 天进度',
      label: '91 天课程进度',
      note: state.started ? `${state.completed} / ${state.total} 天` : '还没有记录',
      value: state.completed,
      max: state.total,
    };
  }
  if (path === '90-days/review-center.md') {
    const review = reviewState(records?.review ?? null, new Date(now).toISOString());
    const correct = review ? review.attempted - review.incorrect : 0;
    return {
      hue: RECORD_HUE,
      eyebrow: '记录 · 错题与间隔复习',
      label: '周测题目掌握进度',
      note: review ? `${correct} / ${review.attempted} 题答对 · ${review.incorrect} 题待订正 · ${review.due} 题到期` : '还没有周测记录',
      value: correct,
      max: review ? review.attempted : 0,
    };
  }
  return null;
}

/**
 * The loop band: the five steps of a lesson page, read from the records. `lesson` is one entry of the
 * course outline (course.data.mjs `lessons`), `course` the outline, `records` what readRecords gives.
 *
 * - read: the page was opened (visits.readAt); a week page also counts when a day of the week has work.
 * - code: a runnable panel on the page was opened (visits.codeAt or a run); `none` without a panel.
 * - run: a browser run finished without error on the page (visits.ranAt); `none` without a panel.
 * - quiz: every question of the week's check has been answered correctly at least once; `none` off
 *   the week pages.
 * - note: a day note of at least 20 characters in that week; `none` off the week pages.
 *
 * Each step is `done` or not; the first step that is not done and not `none` is `now`, the rest are
 * `pending`. With `null` records (the server render, a reader without script) nothing is done and no
 * step is `now`: every step the lesson has is pending, so the first client render matches the HTML.
 */
export const STEPS = [
  { step: 'read', label: '读' },
  { step: 'code', label: '看代码' },
  { step: 'run', label: '跑' },
  { step: 'quiz', label: '自测' },
  { step: 'note', label: '记一笔' },
];
export const NOTE_LENGTH = 20;
export const PROGRESS_PAGE = '/90-days/progress-and-journal.html';

export function questionPassed(record) {
  return Boolean(record && (record.lastCorrect || record.stage > 0));
}

export function lessonSteps(lesson, course, records) {
  const visit = records?.visits?.pages?.[lesson.path] ?? {};
  const week = lesson.week ? course.weeks.find((entry) => entry.week === lesson.week) : null;
  const days = week ? (records?.progress?.days ?? []).filter((day) => week.days.some((entry) => entry.day === day.day)) : [];
  const hasPanel = lesson.runnable > 0;
  const quizRecords = lesson.quiz ? lesson.quiz.map((id) => records?.review?.records?.[id]) : [];
  const passed = quizRecords.filter(questionPassed).length;
  const notes = days.filter((day) => day.note.trim().length >= NOTE_LENGTH).length;
  const facts = {
    read: { has: true, done: Boolean(visit.readAt) || (records ? days.some(hasWork) : false), href: '#main' },
    code: { has: hasPanel, done: Boolean(visit.codeAt || visit.ranAt), href: '#fe-code-1' },
    run: { has: hasPanel, done: Boolean(visit.ranAt), href: '#fe-code-1' },
    quiz: {
      has: Boolean(lesson.quiz),
      done: Boolean(lesson.quiz) && passed === lesson.quiz.length,
      href: `#weekly-check-${lesson.week}`,
      count: lesson.quiz ? `${passed} / ${lesson.quiz.length}` : '',
    },
    note: { has: Boolean(week), done: notes > 0, href: PROGRESS_PAGE, count: week ? `${notes} / ${week.days.length}` : '' },
  };
  let nowFound = records === null;
  return STEPS.map(({ step, label }) => {
    const fact = facts[step];
    let state = 'none';
    if (fact.has) {
      if (fact.done) state = 'done';
      else if (!nowFound) {
        state = 'now';
        nowFound = true;
      } else state = 'pending';
    }
    return { step, label, state, href: fact.has ? fact.href : '', count: fact.has ? (fact.count ?? '') : '' };
  });
}

/** The step marked 停在这里, or null when every step of the lesson is done. */
export function stepNow(steps) {
  return steps.find((entry) => entry.state === 'now') ?? null;
}

/**
 * The index's 接着做: the earliest lesson in course order whose band has a `now` step, with that
 * step, or null when every lesson is done.
 */
export function continueLesson(course, records) {
  for (const lesson of course.lessons) {
    const step = stepNow(lessonSteps(lesson, course, records));
    if (step) return { lesson, step };
  }
  return null;
}

/** The lesson of a page, or null for a page without a band. */
export function lessonFor(course, relativePath) {
  const key = lessonKey(relativePath);
  return course.lessons.find((lesson) => lesson.path === key) ?? null;
}
