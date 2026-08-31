import { describe, expect, it } from 'vitest';
import { EXERCISE_IDS, exerciseContracts, runExercise, type ExerciseId } from './contracts';
import { referenceSolutions } from './reference';
import { workbenchSolutions } from './workbench';

function isExerciseId(value: unknown): value is ExerciseId {
  return typeof value === 'string' && EXERCISE_IDS.includes(value as ExerciseId);
}

const requested = process.env.EXERCISE_ID;
if (requested && !isExerciseId(requested)) throw new Error('Unknown exercise ID: ' + requested);
const selected: readonly ExerciseId[] = requested && isExerciseId(requested) ? [requested] : EXERCISE_IDS;
const solutions = process.env.EXERCISE_TARGET === 'workbench' ? workbenchSolutions : referenceSolutions;

function cloneContractInput(value: unknown): unknown {
  if (typeof value === 'function') return value;
  if (value instanceof Error || value instanceof DOMException) return value;
  if (Array.isArray(value)) return value.map(cloneContractInput);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneContractInput(nestedValue)]),
    );
  }
  return value;
}

for (const id of selected) {
  describe(id + ' contract', () => {
    for (const contract of exerciseContracts[id]) {
      it(contract.name, () => {
        expect(runExercise(solutions, id, cloneContractInput(contract.input))).toEqual(contract.expected);
      });
    }
  });
}

describe('exercise infrastructure', () => {
  it('registers exactly 27 exercises with at least three cases each', () => {
    expect(EXERCISE_IDS).toHaveLength(27);
    for (const id of EXERCISE_IDS) expect(exerciseContracts[id].length).toBeGreaterThanOrEqual(3);
  });
});
