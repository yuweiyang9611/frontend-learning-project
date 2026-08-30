import type { ExerciseId, ExerciseSolutions } from './contracts';

const todo = <Id extends ExerciseId>(id: Id): ExerciseSolutions[Id] =>
  (() => {
    throw new Error('TODO ' + id + ': replace this function with your implementation, then rerun the exercise.');
  }) as unknown as ExerciseSolutions[Id];

export const workbenchSolutions: ExerciseSolutions = {
  B01: todo('B01'),
  B02: todo('B02'),
  B03: todo('B03'),
  B04: todo('B04'),
  B05: todo('B05'),
  B06: todo('B06'),
  B07: todo('B07'),
  B08: todo('B08'),
  B09: todo('B09'),
  A01: todo('A01'),
  A02: todo('A02'),
  A03: todo('A03'),
  A04: todo('A04'),
  A05: todo('A05'),
  A06: todo('A06'),
  A07: todo('A07'),
  A08: todo('A08'),
  A09: todo('A09'),
  C01: todo('C01'),
  C02: todo('C02'),
  C03: todo('C03'),
  C04: todo('C04'),
  C05: todo('C05'),
  C06: todo('C06'),
  C07: todo('C07'),
  C08: todo('C08'),
  C09: todo('C09'),
};
