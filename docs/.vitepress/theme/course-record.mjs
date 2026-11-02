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
