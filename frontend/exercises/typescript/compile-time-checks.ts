import type { ExerciseId } from './contracts';

type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
type AtLeastOne<T> = { [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>> }[keyof T];
type Patch = AtLeastOne<{ title: string; dueDate: string | null; status: Status }>;

const acceptedStatus: Status = 'open';
const acceptedPatch: Patch = { dueDate: null };
void acceptedStatus;
void acceptedPatch;

// These negative fixtures are compiled by tsc; removing the expected error or weakening the type fails typecheck.
// @ts-expect-error blocked is not a member of Status
const invalidStatus: Status = 'blocked';
// @ts-expect-error an empty object is not an AtLeastOne patch
const emptyPatch: Patch = {};
// @ts-expect-error dueDate cannot be a number
const numericDate: Patch = { dueDate: 20260830 };
void invalidStatus;
void emptyPatch;
void numericDate;

export const compilerChecksByExercise: Record<ExerciseId, true> = {
  B01: true, B02: true, B03: true, B04: true, B05: true, B06: true, B07: true, B08: true, B09: true,
  A01: true, A02: true, A03: true, A04: true, A05: true, A06: true, A07: true, A08: true, A09: true,
  C01: true, C02: true, C03: true, C04: true, C05: true, C06: true, C07: true, C08: true, C09: true,
};
