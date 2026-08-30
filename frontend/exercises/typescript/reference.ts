import {
  EXERCISE_IDS,
  type ExerciseSolutions,
  type LabLessonId,
  type PagedResult,
  type PreviewDecodeResult,
} from './contracts';

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

function decodePreview(value: unknown): PreviewDecodeResult {
  const item = record(value);
  if (!item) return { ok: false, path: '$' };
  if (typeof item.id !== 'number' || !Number.isSafeInteger(item.id) || item.id <= 0) {
    return { ok: false, path: '$.id' };
  }
  if (typeof item.title !== 'string') return { ok: false, path: '$.title' };
  if (!isStatus(item.status)) return { ok: false, path: '$.status' };
  return { ok: true, value: { id: item.id, title: item.title, status: item.status } };
}

function mapPage<T, U>(input: PagedResult<T> & { readonly map: (value: T) => U }): PagedResult<U>;
function mapPage(
  input:
    | (PagedResult<string> & { readonly operation: 'length' })
    | (PagedResult<{ readonly title: string }> & { readonly operation: 'title' }),
): PagedResult<number> | PagedResult<string>;
function mapPage(
  input: PagedResult<unknown> & {
    readonly map?: (value: never) => unknown;
    readonly operation?: 'length' | 'title';
  },
): PagedResult<unknown> {
  const items = input.items.map((item) => {
    if (input.map) return input.map(item as never);
    if (input.operation === 'length') return typeof item === 'string' ? item.length : 0;
    const candidate = record(item);
    return candidate?.title;
  });
  return { items, page: input.page, pageSize: input.pageSize, total: input.total };
}

function groupIds<K extends PropertyKey, T extends Record<K, PropertyKey> & { readonly id: PropertyKey }>(input: {
  readonly items: readonly T[];
  readonly key: K;
}): Record<string, Array<T['id']>> {
  const grouped: Record<string, Array<T['id']>> = {};
  for (const item of input.items) {
    const group = String(item[input.key]);
    (grouped[group] ??= []).push(item.id as T['id']);
  }
  return grouped;
}

export const referenceSolutions: ExerciseSolutions = {
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
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return typeof input === 'string' && labels[input] ? labels[input] : 'Invalid';
  },
  B05: (input) => {
    const labels: Record<string, string> = {
      open: 'Ready for triage',
      in_progress: 'Actively moving',
      resolved: 'Ready to verify',
      closed: 'Completed work',
    };
    return typeof input === 'string' ? (labels[input] ?? 'Unknown') : 'Unknown';
  },
  B06: isStatus,
  B07: (input) => {
    return input.items.map((item) => (item.id === input.id ? { ...item, status: input.status } : item));
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
    const page = Number.isSafeInteger(input.page) && input.page > 0 ? input.page : 1;
    const pageSize = Number.isSafeInteger(input.pageSize) && input.pageSize > 0 ? input.pageSize : 20;
    const start = (page - 1) * pageSize;
    return {
      items: input.items.slice(start, start + pageSize),
      page,
      pageSize,
      total: input.items.length,
    };
  },
  A02: mapPage,
  A03: (input) => {
    return input.items.map((item) => [item[input.key], item] as const);
  },
  A04: groupIds,
  A05: (input) => {
    return { ...input.object, [input.key]: input.value };
  },
  A06: (input) => {
    if ('id' in input) {
      return { id: input.id, title: input.title, status: input.status };
    }
    return input;
  },
  A07: (input) => {
    return Object.keys(input).length > 0;
  },
  A08: decodePreview,
  A09: (input) => {
    if (!Array.isArray(input)) return { ok: false, paths: ['$'] };
    const values: Array<Extract<PreviewDecodeResult, { ok: true }>['value']> = [];
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
    const allowed = new Set<LabLessonId>(['literal-unions', 'runtime-decoder', 'wire-scalars']);
    return Array.isArray(input)
      ? [
          ...new Set(
            input.filter((item): item is LabLessonId => typeof item === 'string' && allowed.has(item as LabLessonId)),
          ),
        ]
      : [];
  },
  C05: (input) => {
    const value = record(input);
    if (value?.kind === 'id') return Number.isSafeInteger(value.value) && Number(value.value) > 0;
    if (value?.kind === 'date') return isCalendarDate(value.value);
    if (value?.kind === 'instant') {
      return (
        typeof value.value === 'string' &&
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(value.value) &&
        Number.isFinite(Date.parse(value.value))
      );
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
    if (input.status === 204) return { kind: 'no-content' };
    if (input.status >= 200 && input.status < 300) {
      return { kind: 'json', value: input.body };
    }
    return { kind: 'problem', status: input.status };
  },
  C08: (input) => (isStatus(input) ? input : null),
  C09: (input) => {
    if (input.failed) return input.items.map((item) => ({ ...item }));
    return input.items.map((item) => (item.id === input.id ? { ...item, status: input.next } : item));
  },
};

if (Object.keys(referenceSolutions).length !== EXERCISE_IDS.length) {
  throw new Error('Reference solution registry is incomplete.');
}
