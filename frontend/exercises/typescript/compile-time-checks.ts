import type {
  ExerciseFieldErrors,
  ExerciseId,
  ExerciseStatus,
  HttpDecodeResult,
  IssueListItem,
  IssuePreview,
  PreviewArrayDecodeResult,
  PreviewDecodeResult,
  ProblemClassification,
} from './contracts';
import { referenceSolutions } from './reference';

/**
 * Each method contains a positive compile fixture and a deliberately rejected
 * fixture. TypeScript verifies every @ts-expect-error; a weakened signature
 * therefore makes this file fail to compile instead of producing a false green.
 */
export const compilerChecksByExercise = {
  B01: () => {
    const result: string = referenceSolutions.B01({ stable: true, value: 'open' });
    void result;
    // @ts-expect-error B01 accepts only string or number values
    referenceSolutions.B01({ stable: true, value: false });
  },
  B02: () => {
    const fullUser = { id: 7, displayName: 'Ada', role: 'admin' };
    const result: string | null = referenceSolutions.B02(fullUser);
    void result;
    // @ts-expect-error B02 requires the minimal displayName field
    referenceSolutions.B02({ id: 7 });
  },
  B03: () => {
    referenceSolutions.B03({});
    referenceSolutions.B03({ value: null });
    // @ts-expect-error B03 distinguishes string, null, and omission
    referenceSolutions.B03({ value: 3 });
  },
  B04: () => {
    const label: string = referenceSolutions.B04('open');
    void label;
    // @ts-expect-error B04 derives a closed status union
    referenceSolutions.B04('blocked');
  },
  B05: () => {
    const label: string = referenceSolutions.B05('resolved');
    void label;
    // @ts-expect-error B05 requires a complete map of known states
    referenceSolutions.B05('waiting');
  },
  B06: () => {
    const candidate: unknown = 'open';
    if (referenceSolutions.B06(candidate)) {
      const status: ExerciseStatus = candidate;
      void status;
    }
    // @ts-expect-error B06 narrows to ExerciseStatus, never to blocked
    const wrongGuard: (value: unknown) => value is 'blocked' = referenceSolutions.B06;
    void wrongGuard;
  },
  B07: () => {
    const items = [{ id: 1, status: 'open' }] as const;
    referenceSolutions.B07({ items, id: 1, status: 'resolved' });
    // @ts-expect-error B07 cannot write an unknown status
    referenceSolutions.B07({ items, id: 1, status: 'blocked' });
  },
  B08: () => {
    const message: string = referenceSolutions.B08(new Error('failed'));
    void message;
    // @ts-expect-error B08 always normalizes to a string
    const code: number = referenceSolutions.B08('failed');
    void code;
  },
  B09: () => {
    const text: string = referenceSolutions.B09({ kind: 'success', value: 3 });
    void text;
    // @ts-expect-error success RemoteData owns a value
    referenceSolutions.B09({ kind: 'success' });
  },
  A01: () => {
    const page = referenceSolutions.A01({ items: [{ id: 1 }], page: 1, pageSize: 20 });
    const id: number = page.items[0]!.id;
    void id;
    // @ts-expect-error A01 preserves the generic item type
    const title: string = page.items[0]!.id;
    void title;
  },
  A02: () => {
    const page = referenceSolutions.A02({
      items: ['a', 'abcd'],
      page: 1,
      pageSize: 20,
      total: 2,
      map: (value) => value.length,
    });
    const length: number = page.items[0]!;
    void length;
    // @ts-expect-error A02 maps string items to numbers for this mapper
    const original: string = page.items[0]!;
    void original;
  },
  A03: () => {
    const entries = referenceSolutions.A03({
      items: [{ id: 1, title: 'A' }],
      key: 'id',
    });
    const key: number = entries[0]![0];
    void key;
    // @ts-expect-error A03 key must exist and contain a PropertyKey
    referenceSolutions.A03({ items: [{ id: 1 }], key: 'missing' });
  },
  A04: () => {
    const groups = referenceSolutions.A04({
      items: [{ id: 1, status: 'open' as const }],
      key: 'status',
    });
    const id: number = groups.open![0]!;
    void id;
    // @ts-expect-error A04 cannot group by an object-valued property
    referenceSolutions.A04({ items: [{ id: 1, meta: {} }], key: 'meta' });
  },
  A05: () => {
    const updated = referenceSolutions.A05({
      object: { title: 'Old', count: 1 },
      key: 'count',
      value: 2,
    });
    const count: number = updated.count;
    void count;
    // @ts-expect-error A05 ties value to the selected key
    referenceSolutions.A05({ object: { count: 1 }, key: 'count', value: 'two' });
  },
  A06: () => {
    referenceSolutions.A06({ id: 1, title: 'Typed', status: 'open' });
    const errors: ExerciseFieldErrors = { title: ['Required'] };
    referenceSolutions.A06(errors);
    // @ts-expect-error A06 error keys come only from editable fields
    const invalidErrors: ExerciseFieldErrors = { secret: ['Do not expose'] };
    void invalidErrors;
  },
  A07: () => {
    referenceSolutions.A07({ dueDate: null });
    // @ts-expect-error A07 requires at least one patch field
    referenceSolutions.A07({});
  },
  A08: () => {
    const decoded: PreviewDecodeResult = referenceSolutions.A08({
      id: 1,
      title: 'Safe',
      status: 'open',
    });
    void decoded;
    // @ts-expect-error A08 may fail, so it is not an IssuePreview directly
    const preview: IssuePreview = referenceSolutions.A08({});
    void preview;
  },
  A09: () => {
    const decoded: PreviewArrayDecodeResult = referenceSolutions.A09([]);
    void decoded;
    // @ts-expect-error A09 may return indexed decoder errors
    const values: readonly IssuePreview[] = referenceSolutions.A09([]);
    void values;
  },
  C01: () => {
    const valid: boolean = referenceSolutions.C01({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    void valid;
    // @ts-expect-error C01 produces a validation boolean
    const page: number = referenceSolutions.C01({});
    void page;
  },
  C02: () => {
    const result = referenceSolutions.C02('ada@example.com');
    const decoded: boolean = result.decoded;
    void decoded;
    // @ts-expect-error C02 validation flags are booleans
    const valid: string = result.valid;
    void valid;
  },
  C03: () => {
    const query: string = referenceSolutions.C03('?page=2');
    void query;
    // @ts-expect-error C03 accepts a query string boundary
    referenceSolutions.C03(2);
  },
  C04: () => {
    const progress = referenceSolutions.C04(['literal-unions']);
    const lesson = progress[0];
    void lesson;
    // @ts-expect-error C04 returns a readonly, catalog-constrained list
    progress.push('retired');
  },
  C05: () => {
    const valid: boolean = referenceSolutions.C05({ kind: 'id', value: 1 });
    void valid;
    // @ts-expect-error C05 always produces a boolean
    const normalized: string = referenceSolutions.C05('2026-01-01');
    void normalized;
  },
  C06: () => {
    const classification: ProblemClassification = referenceSolutions.C06({
      status: 404,
      title: 'Missing',
    });
    void classification;
    // @ts-expect-error C06 returns a closed classification union
    const status: number = referenceSolutions.C06({});
    void status;
  },
  C07: () => {
    const decodeNumber = (value: unknown): HttpDecodeResult<number> =>
      typeof value === 'number' ? { ok: true, value } : { ok: false, message: 'Expected a number' };
    const response = referenceSolutions.C07({ status: 200, body: 7, decode: decodeNumber });
    if (response.kind === 'json') {
      const decoded: number = response.value;
      void decoded;
      // @ts-expect-error C07 result value is determined by the supplied decoder
      const wrongValue: string = response.value;
      void wrongValue;
    }
    // @ts-expect-error C07 requires a success decoder instead of trusting body as T
    referenceSolutions.C07({ status: 200, body: 7 });
    // @ts-expect-error C07 requires a numeric HTTP status
    referenceSolutions.C07({ status: '204', body: null, decode: decodeNumber });
  },
  C08: () => {
    const transition = referenceSolutions.C08({ current: 'open', raw: 'resolved' });
    if (transition.accepted) {
      const requestStatus: ExerciseStatus = transition.request.status;
      void requestStatus;
    }
    const rawDomValue: string = 'blocked';
    // @ts-expect-error a raw DOM string is not a validated ExerciseStatus
    const unsafeStatus: ExerciseStatus = rawDomValue;
    void unsafeStatus;
    // @ts-expect-error C08 current state must already be a validated domain value
    referenceSolutions.C08({ current: 'blocked', raw: 'open' });
  },
  C09: () => {
    const items = [{ id: 1, status: 'open' }] as const;
    const timeline = referenceSolutions.C09({ items, id: 1, next: 'closed', failed: false });
    const phase: 'snapshot' | 'optimistic' | 'rollback' | 'invalidate' = timeline[0]!.phase;
    void phase;
    // @ts-expect-error C09 returns observable timeline events, not only final issue items
    const finalItems: readonly IssueListItem[] = timeline;
    void finalItems;
    // @ts-expect-error C09 optimistic state uses the closed status union
    referenceSolutions.C09({ items, id: 1, next: 'blocked', failed: false });
  },
} satisfies Record<ExerciseId, () => void>;
