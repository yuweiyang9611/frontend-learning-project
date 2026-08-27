# TypeScript Lab developer guide

The in-app lab at `/labs/typescript` teaches TypeScript with IssueFlow's real domain models. It is intentionally not a free-form code executor:

- every runner is ordinary TypeScript that participates in `strict` compilation;
- visible snippets are focused concept excerpts; the tested implementations live in `examples.ts` and `catalog.ts`;
- invalid examples live in `compile-time-examples.ts` and use `@ts-expect-error`;
- runtime inputs begin as `unknown` and are narrowed before use;
- lessons never call the API or mutate IssueFlow product data;
- learning progress uses its own device-local storage key.

## Files

| File                                       | Purpose                                                     |
| ------------------------------------------ | ----------------------------------------------------------- |
| `examples.ts`                              | Reusable, runnable examples and teaching types              |
| `compile-time-examples.ts`                 | Expected compiler errors checked by `tsc`                   |
| `catalog.ts`                               | Lesson copy, code samples, default inputs, and safe runners |
| `examples.test.ts`                         | Runtime and type-level tests                                |
| `../../screens/TypeScriptLabPage.tsx`      | Accessible interactive learning UI                          |
| `../../screens/TypeScriptLabPage.test.tsx` | URL, runner, filter, and progress tests                     |

## Run the examples

```powershell
cd frontend
npm run typecheck
npm test -- src/features/typescript-lab/examples.test.ts src/screens/TypeScriptLabPage.test.tsx
npm run dev
```

Open <http://localhost:3000/labs/typescript> after signing in.

## Learning order

1. TypeScript versus runtime values
2. Interfaces and structural typing
3. `as const`, unions, `satisfies`, and exhaustive `never`
4. Optional versus nullable PATCH fields
5. Generics and constraints
6. Utility types
7. `keyof` and indexed access
8. Typed validation
9. Query-string boundaries
10. Immutable array pipelines
11. Safe integer IDs, calendar dates, and offset timestamps
12. `unknown`, discriminated unions, and typed API failures

## Add a lesson

1. Put reusable logic in `examples.ts`; React should only provide controls and display.
2. Add normal, boundary, and invalid-input tests.
3. Add expected compile failures to `compile-time-examples.ts` when the lesson is about the compiler.
4. Add one catalog entry with a real production source path, C# bridge, challenge, and deterministic default runner.
5. Keep the runner synchronous and side-effect free. Never use `eval`, `new Function`, an API call, or shared product storage.
