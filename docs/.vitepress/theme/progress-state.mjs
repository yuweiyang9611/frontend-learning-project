export const PROGRESS_APP = 'issueflow-learning-progress';
export const PROGRESS_VERSION = 1;
export const PROGRESS_STORAGE_KEY = 'issueflow:frontend-learning-project:progress:v1';
export const DAY_COUNT = 91;
const MAX_IMPORTED_DAY_RECORDS = DAY_COUNT * 2;

function emptyDay(day) {
  return {
    day,
    completed: false,
    completedAt: null,
    minutes: 0,
    note: '',
    evidence: [],
  };
}

export function createProgress() {
  return {
    app: PROGRESS_APP,
    schemaVersion: PROGRESS_VERSION,
    exportedAt: new Date(0).toISOString(),
    days: Array.from({ length: DAY_COUNT }, (_, index) => emptyDay(index + 1)),
  };
}

export function isSafeEvidenceUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../') || value.startsWith('#')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function completionProblems(day) {
  const problems = [];
  if (!Number.isInteger(day?.minutes) || day.minutes < 120) problems.push('主动学习不足 120 分钟');
  if (!Array.isArray(day?.evidence) || day.evidence.length === 0) problems.push('缺少验收证据链接');
  if (typeof day?.note !== 'string' || day.note.trim().length < 20) problems.push('复盘少于 20 字');
  return problems;
}

export function revokeDayCompletion(day) {
  return { ...day, completed: false, completedAt: null };
}

export function reconcileDayCompletion(day) {
  if (!day.completed || completionProblems(day).length > 0) return revokeDayCompletion(day);
  return { ...day };
}

export function decodeProgress(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { ok: false, error: '进度文件必须是 JSON 对象。' };
  if (input.app !== PROGRESS_APP || input.schemaVersion !== PROGRESS_VERSION) {
    return { ok: false, error: '进度文件版本或应用标识不兼容。' };
  }
  if (!Array.isArray(input.days)) return { ok: false, error: 'days 必须是数组。' };
  if (input.days.length > MAX_IMPORTED_DAY_RECORDS) return { ok: false, error: 'days 数组过大，无法安全读取。' };

  const seen = new Set();
  const days = [];
  const warnings = [];
  for (const [index, candidate] of input.days.entries()) {
    const recordName = `第 ${index + 1} 条 Day 记录`;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      warnings.push(`${recordName}不是对象，已跳过。`);
      continue;
    }
    if (!Number.isInteger(candidate.day) || candidate.day < 1 || candidate.day > DAY_COUNT) {
      warnings.push(`${recordName}的编号不在 1–91，已跳过。`);
      continue;
    }
    if (seen.has(candidate.day)) {
      warnings.push(`Day ${candidate.day} 重复，已保留第一条有效记录。`);
      continue;
    }
    if (typeof candidate.completed !== 'boolean') {
      warnings.push(`Day ${candidate.day} 的 completed 不是 boolean，已跳过。`);
      continue;
    }
    if (candidate.completedAt !== null && typeof candidate.completedAt !== 'string') {
      warnings.push(`Day ${candidate.day} 的 completedAt 不是字符串或 null，已跳过。`);
      continue;
    }
    const minutes = candidate.minutes ?? 0;
    const note = candidate.note ?? '';
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
      warnings.push(`Day ${candidate.day} 的分钟数不在 0–1440，已跳过。`);
      continue;
    }
    if (typeof note !== 'string' || note.length > 500) {
      warnings.push(`Day ${candidate.day} 的复盘不是字符串或超过 500 字，已跳过。`);
      continue;
    }
    const evidence = candidate.evidence ?? [];
    if (!Array.isArray(evidence) || evidence.length > 5) {
      warnings.push(`Day ${candidate.day} 的证据不是数组或超过 5 项，已跳过。`);
      continue;
    }
    const safeEvidence = [];
    let evidenceError = '';
    for (const item of evidence) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        evidenceError = '证据不是对象';
        break;
      }
      if (typeof item.label !== 'string' || item.label.length > 100 || !isSafeEvidenceUrl(item.url)) {
        evidenceError = '证据标签或 URL 不合法';
        break;
      }
      safeEvidence.push({ label: item.label, url: item.url });
    }
    if (evidenceError) {
      warnings.push(`Day ${candidate.day} 的${evidenceError}，已跳过。`);
      continue;
    }

    seen.add(candidate.day);
    const decodedDay = reconcileDayCompletion({
      day: candidate.day,
      completed: candidate.completed,
      completedAt: candidate.completedAt,
      minutes,
      note,
      evidence: safeEvidence,
    });
    if (candidate.completed && !decodedDay.completed) {
      warnings.push(`Day ${candidate.day} 未满足完成条件，已保留学习记录并撤销完成状态。`);
    }
    days.push(decodedDay);
  }
  return {
    ok: true,
    warnings,
    value: {
      app: PROGRESS_APP,
      schemaVersion: PROGRESS_VERSION,
      exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date(0).toISOString(),
      days,
    },
  };
}

export function mergeProgress(current, imported, replace = false) {
  const decodedCurrent = decodeProgress(current);
  const decodedImported = decodeProgress(imported);
  const baseDays = !replace && decodedCurrent.ok ? decodedCurrent.value.days : [];
  const byDay = new Map(baseDays.map((day) => [day.day, day]));
  const importedDays = decodedImported.ok ? decodedImported.value.days : [];

  for (const next of importedDays) {
    const previous = byDay.get(next.day) ?? emptyDay(next.day);
    const evidence = replace
      ? next.evidence
      : [...new Map([...previous.evidence, ...next.evidence].map((item) => [item.url, item])).values()].slice(0, 5);
    const completed = replace ? next.completed : previous.completed || next.completed;
    const mergedDay = {
      day: next.day,
      completed,
      completedAt: completed ? (next.completedAt ?? previous.completedAt) : null,
      minutes: replace ? next.minutes : Math.max(previous.minutes, next.minutes),
      note: replace ? next.note : next.note.trim().length > previous.note.trim().length ? next.note : previous.note,
      evidence,
    };
    byDay.set(next.day, reconcileDayCompletion(mergedDay));
  }

  const result = {
    app: PROGRESS_APP,
    schemaVersion: PROGRESS_VERSION,
    exportedAt: new Date().toISOString(),
    days: Array.from({ length: DAY_COUNT }, (_, index) => byDay.get(index + 1) ?? emptyDay(index + 1)),
  };
  const validation = decodeProgress(result);
  if (!validation.ok) return createProgress();
  const validatedByDay = new Map(validation.value.days.map((day) => [day.day, day]));
  return {
    ...result,
    days: Array.from({ length: DAY_COUNT }, (_, index) => validatedByDay.get(index + 1) ?? emptyDay(index + 1)),
  };
}

export function normalizeProgress(input) {
  const decoded = decodeProgress(input);
  return decoded.ok ? mergeProgress(createProgress(), decoded.value, true) : createProgress();
}

export function progressSummary(progress) {
  return {
    completed: progress.days.filter((day) => day.completed).length,
    minutes: progress.days.reduce((sum, day) => sum + day.minutes, 0),
  };
}
