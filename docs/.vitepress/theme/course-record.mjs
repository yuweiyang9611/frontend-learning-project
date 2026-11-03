// What the opening screen shows from the owner's own record. Pure, so it can be tested without a browser.
import { DAY_COUNT, PROGRESS_STORAGE_KEY, decodeProgress, normalizeProgress } from './progress-state.mjs';
import { REVIEW_STORAGE_KEY, decodeReviewState, reviewSummary } from './review-state.mjs';

/** Reads both records the way the tracker and the review centre do. Missing or unreadable means none. */
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
  return { progress, review };
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
