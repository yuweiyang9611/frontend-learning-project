import { EXERCISE_IDS, type ExerciseId, type ExerciseSolution } from './contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function own(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

const statuses = ['open', 'in_progress', 'resolved', 'closed'] as const;

function isStatus(value: unknown): value is (typeof statuses)[number] {
  return typeof value === 'string' && statuses.includes(value as (typeof statuses)[number]);
}

function isCalendarDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function decodePreview(
  value: unknown,
): { ok: true; value: { id: unknown; title: string; status: (typeof statuses)[number] } } | { ok: false; path: string } {
  const item = record(value);
  if (!item) return { ok: false, path: '$' };
  if (!Number.isSafeInteger(item.id) || Number(item.id) <= 0) return { ok: false, path: '$.id' };
  if (typeof item.title !== 'string') return { ok: false, path: '$.title' };
  if (!isStatus(item.status)) return { ok: false, path: '$.status' };
  return { ok: true, value: { id: item.id, title: item.title, status: item.status } };
}

export const referenceSolutions: Record<ExerciseId, ExerciseSolution> = {
  B01: (input) => {
    const item = record(input);
    if (!item) return 'unknown';
    return item.stable ? 'literal:' + String(item.value) : typeof item.value;
  },
  B02: (input) => {
    const item = record(input);
    return item && typeof item.id === 'number' && typeof item.displayName === 'string'
      ? item.id + ':' + item.displayName
      : null;
  },
  B03: (input) => {
    const item = record(input) ?? {};
    if (!own(item, 'value')) return 'omitted';
    if (item.value === null) return 'null';
    return 'value:' + String(item.value);
  },
  B04: (input) => {
    const labels: Record<string, string> = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' };
    return typeof input === 'string' && labels[input] ? labels[input] : 'Invalid';
  },
  B05: (input) => {
    const labels: Record<string, string> = {
      open: 'Ready for triage',
      in_progress: 'Actively moving',
      resolved: 'Ready to verify',
      closed: 'Completed work',
    };
    return typeof input === 'string' ? labels[input] ?? 'Unknown' : 'Unknown';
  },
  B06: isStatus,
  B07: (input) => {
    const value = record(input);
    const items = Array.isArray(value?.items) ? value.items : [];
    return items.map((candidate) => {
      const item = record(candidate);
      return item && item.id === value?.id ? { ...item, status: value?.status } : candidate;
    });
  },
  B08: (input) => {
    const item = record(input);
    if (item?.kind === 'error' && typeof item.message === 'string') return item.message;
    if (item?.kind === 'string' && typeof item.value === 'string') return item.value;
    return 'Unknown error';
  },
  B09: (input) => {
    const item = record(input);
    if (item?.kind === 'idle') return 'Not started';
    if (item?.kind === 'loading') return 'Loading';
    if (item?.kind === 'success') return 'Loaded:' + String(item.value);
    if (item?.kind === 'error') return 'Error:' + String(item.message);
    return 'Invalid state';
  },
  A01: (input) => {
    const value = record(input) ?? {};
    const items = Array.isArray(value.items) ? value.items : [];
    const page = Number.isSafeInteger(value.page) && Number(value.page) > 0 ? Number(value.page) : 1;
    const pageSize = Number.isSafeInteger(value.pageSize) && Number(value.pageSize) > 0 ? Number(value.pageSize) : 20;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
  },
  A02: (input) => {
    const value = record(input) ?? {};
    const items = Array.isArray(value.items) ? value.items : [];
    const operation = value.operation;
    const mapped = items.map((item) => {
      if (operation === 'length') return typeof item === 'string' ? item.length : 0;
      const candidate = record(item);
      return candidate?.title;
    });
    return { items: mapped, page: value.page, pageSize: value.pageSize, total: value.total };
  },
  A03: (input) => {
    const value = record(input) ?? {};
    const items = Array.isArray(value.items) ? value.items : [];
    const key = typeof value.key === 'string' ? value.key : '';
    return items.flatMap((item) => {
      const candidate = record(item);
      const index = candidate?.[key];
      return candidate && (typeof index === 'string' || typeof index === 'number') ? [[index, candidate]] : [];
    });
  },
  A04: (input) => {
    const value = record(input) ?? {};
    const items = Array.isArray(value.items) ? value.items : [];
    const key = typeof value.key === 'string' ? value.key : '';
    const grouped: Record<string, unknown[]> = {};
    for (const item of items) {
      const candidate = record(item);
      if (!candidate) continue;
      const group = String(candidate[key]);
      (grouped[group] ??= []).push(candidate.id);
    }
    return grouped;
  },
  A05: (input) => {
    const value = record(input) ?? {};
    const object = record(value.object) ?? {};
    return typeof value.key === 'string' ? { ...object, [value.key]: value.value } : object;
  },
  A06: (input) => {
    const value = record(input) ?? {};
    if (typeof value.id === 'number' && typeof value.title === 'string' && isStatus(value.status)) {
      return { id: value.id, title: value.title, status: value.status };
    }
    return Object.fromEntries(
      Object.entries(value).filter(([, messages]) => Array.isArray(messages) && messages.every((item) => typeof item === 'string')),
    );
  },
  A07: (input) => {
    const value = record(input);
    return Boolean(value && Object.keys(value).length > 0);
  },
  A08: decodePreview,
  A09: (input) => {
    if (!Array.isArray(input)) return { ok: false, paths: ['$'] };
    const values: unknown[] = [];
    const paths: string[] = [];
    input.forEach((item, index) => {
      const result = decodePreview(item);
      if (result.ok) values.push(result.value);
      else paths.push(result.path.replace('$', '$[' + index + ']'));
    });
    return paths.length ? { ok: false, paths } : { ok: true, values };
  },
  C01: (input) => {
    const value = record(input);
    return Boolean(
      value &&
        Array.isArray(value.items) &&
        Number.isSafeInteger(value.page) &&
        Number(value.page) > 0 &&
        Number.isSafeInteger(value.pageSize) &&
        Number(value.pageSize) > 0 &&
        Number.isSafeInteger(value.total) &&
        Number(value.total) >= value.items.length,
    );
  },
  C02: (input) => ({
    decoded: typeof input === 'string',
    valid: typeof input === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input),
  }),
  C03: (input) => {
    const params = new URLSearchParams(typeof input === 'string' ? input : '');
    const result = new URLSearchParams();
    const page = Number(params.get('page'));
    if (Number.isSafeInteger(page) && page > 1) result.set('page', String(page));
    const status = params.get('status');
    if (isStatus(status)) result.set('status', status);
    const query = result.toString();
    return query ? '?' + query : '';
  },
  C04: (input) => {
    const allowed = new Set(['literal-unions', 'runtime-decoder', 'wire-scalars']);
    return Array.isArray(input)
      ? [...new Set(input.filter((item): item is string => typeof item === 'string' && allowed.has(item)))]
      : [];
  },
  C05: (input) => {
    const value = record(input);
    if (value?.kind === 'id') return Number.isSafeInteger(value.value) && Number(value.value) > 0;
    if (value?.kind === 'date') return isCalendarDate(value.value);
    if (value?.kind === 'instant') {
      return typeof value.value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value.value) && Number.isFinite(Date.parse(value.value));
    }
    return false;
  },
  C06: (input) => {
    const value = record(input);
    if (!value || !Number.isSafeInteger(value.status)) return 'unknown';
    if (value.status === 400 && record(value.errors)) return 'validation';
    if (value.status === 404) return 'not-found';
    if (Number(value.status) >= 500) return 'server';
    return 'unknown';
  },
  C07: (input) => {
    const value = record(input) ?? {};
    const status = Number(value.status);
    if (status === 204) return { kind: 'no-content' };
    if (status >= 200 && status < 300) return { kind: 'json', value: value.body };
    return { kind: 'problem', status };
  },
  C08: (input) => (isStatus(input) ? input : null),
  C09: (input) => {
    const value = record(input) ?? {};
    const items = Array.isArray(value.items) ? value.items : [];
    if (value.failed) return items.map((item) => ({ ...(record(item) ?? {}) }));
    return items.map((item) => {
      const candidate = record(item);
      return candidate?.id === value.id ? { ...candidate, status: value.next } : candidate;
    });
  },
};

if (Object.keys(referenceSolutions).length !== EXERCISE_IDS.length) {
  throw new Error('Reference solution registry is incomplete.');
}
