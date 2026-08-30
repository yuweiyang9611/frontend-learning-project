export const PROGRESS_APP = 'issueflow-learning-progress';
export const PROGRESS_VERSION = 1;
export const PROGRESS_STORAGE_KEY = 'issueflow:frontend-learning-project:progress:v1';
export const DAY_COUNT = 91;

function emptyDay(day) {
  return { day, completed: false, completedAt: null, minutes: 0, note: '', evidence: [] };
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

export function decodeProgress(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: '进度文件必须是 JSON 对象。' };
  if (input.app !== PROGRESS_APP || input.schemaVersion !== PROGRESS_VERSION) {
    return { ok: false, error: '进度文件版本或应用标识不兼容。' };
  }
  if (!Array.isArray(input.days) || input.days.length > DAY_COUNT) return { ok: false, error: 'days 必须是最多 91 项的数组。' };
  const seen = new Set();
  const days = [];
  for (const candidate of input.days) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { ok: false, error: '每个 Day 必须是对象。' };
    if (!Number.isInteger(candidate.day) || candidate.day < 1 || candidate.day > DAY_COUNT || seen.has(candidate.day)) {
      return { ok: false, error: 'Day 必须在 1–91 且不能重复。' };
    }
    if (typeof candidate.completed !== 'boolean') return { ok: false, error: 'completed 必须是 boolean。' };
    if (!(candidate.completedAt === null || typeof candidate.completedAt === 'string')) return { ok: false, error: 'completedAt 必须是字符串或 null。' };
    const minutes = candidate.minutes ?? 0;
    const note = candidate.note ?? '';
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) return { ok: false, error: '单日分钟数必须在 0–1440。' };
    if (typeof note !== 'string' || note.length > 500) return { ok: false, error: '单日复盘最多 500 字。' };
    const evidence = candidate.evidence ?? [];
    if (!Array.isArray(evidence) || evidence.length > 5) return { ok: false, error: '每个 Day 最多 5 个证据链接。' };
    const safeEvidence = [];
    for (const item of evidence) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return { ok: false, error: '证据必须是对象。' };
      if (typeof item.label !== 'string' || item.label.length > 100 || !isSafeEvidenceUrl(item.url)) {
        return { ok: false, error: '证据标签或 URL 不合法；只允许 HTTPS 或本站相对地址。' };
      }
      safeEvidence.push({ label: item.label, url: item.url });
    }
    seen.add(candidate.day);
    days.push({
      day: candidate.day,
      completed: candidate.completed,
      completedAt: candidate.completedAt,
      minutes,
      note,
      evidence: safeEvidence,
    });
  }
  return {
    ok: true,
    value: {
      app: PROGRESS_APP,
      schemaVersion: PROGRESS_VERSION,
      exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date(0).toISOString(),
      days,
    },
  };
}

export function mergeProgress(current, imported, replace = false) {
  const base = replace ? createProgress() : structuredClone(current);
  const byDay = new Map(base.days.map((day) => [day.day, day]));
  for (const next of imported.days) {
    const previous = byDay.get(next.day) ?? emptyDay(next.day);
    const evidence = replace
      ? next.evidence
      : [...new Map([...previous.evidence, ...next.evidence].map((item) => [item.url, item])).values()].slice(0, 5);
    byDay.set(next.day, {
      day: next.day,
      completed: replace ? next.completed : previous.completed || next.completed,
      completedAt: next.completedAt ?? previous.completedAt,
      minutes: replace ? next.minutes : Math.max(previous.minutes, next.minutes),
      note: next.note || previous.note,
      evidence,
    });
  }
  return {
    app: PROGRESS_APP,
    schemaVersion: PROGRESS_VERSION,
    exportedAt: new Date().toISOString(),
    days: Array.from({ length: DAY_COUNT }, (_, index) => byDay.get(index + 1) ?? emptyDay(index + 1)),
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
