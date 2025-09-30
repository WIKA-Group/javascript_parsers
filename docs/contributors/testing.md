# Testing

This project uses Vitest for all test suites. Tests ensure the correctness of codec implementations, parser wiring, schema alignment and important runtime behaviors that are difficult or impractical to fully express in TypeScript's type system.

## Purpose

- Describe the test strategy used across the `packages/parsers` package.
- Show how device examples (the spec-required examples file) are used as authoritative test fixtures.
- Explain how we test register lookups and why we use controlled typecasting in tests.
- Provide commands and quick tips for running targeted tests in the monorepo.

> Note: Although benchmarks were considered during development, they are not part of the project's test requirements and are intentionally omitted from this guide.

## Test tooling and scripts

- We use Vitest as the test runner. The repository root `package.json` exposes the main scripts:

  - `pnpm test`: runs Vitest in watch mode (depending on your local environment).
  - `pnpm coverage`: runs Vitest once and collects coverage information.

If you want to run a single test file or pattern with Vitest from the repo root:

```bash
pnpm test -- <pattern-or-path>
```

## Test types and organization

We organize tests into a few focused areas:

- Unit tests for shared utilities (for example `utils` helpers that convert numbers and bytes).
- Unit tests for codec utilities and runtime validations (for example `checkChannelsValidity`, `checkCodecsValidity`).
- Device-level integration tests that exercise the full parser stack for a single device using the device `examples.json` fixtures and the generated Valibot schemas.
- Register lookup and mapping tests that validate our runtime expectations for typecasts we apply in places where the static type system would be too complex or slow to model.

Examples in the repository show these patterns under `packages/parsers/__tests__` and device-specific test files under `packages/parsers/src/devices/<DEVICE>/*.test.ts`.

## Device example testing (spec-required examples)

Each device folder that implements a parser includes an `examples.json` file containing the canonical examples required by the device spec. We use these examples as integration tests.

The typical test flow for device examples is:

1. Import the device `useParser()` factory from the device's `parser` module.
2. Import the `examples.json` file and filter examples by type (uplink, hexUplink, etc.).
3. Import the Valibot-generated schema factory for the device output (for example `createPEWUplinkOutputSchema`) and validate the decoded output with `v.parse(...)` to ensure the implementation matches the schema.

This pattern ensures three guarantees in a single test:

- The codec/parser implementation decodes the provided example input to the expected output structure.
- The decoded output actually conforms to the runtime schema that will be published with the package (Valibot runtime validation).
- Any accidental divergence between examples, implementation and schema is caught early in CI.

A minimal device test example (repository contains a real example) follows this shape:

```ts
import * as v from 'valibot'
import examples from './examples.json' assert { type: 'json' }
import { useParser } from './parser'
import { createPEWUplinkOutputSchema } from './schema'

const { decodeUplink, decodeHexUplink } = useParser()
const outputSchema = createPEWUplinkOutputSchema()

examples.filter(e => e.type === 'uplink').forEach((ex) => {
  const out = decodeUplink(ex.input as any)
  expect(out).toEqual(ex.output)
  expect(() => v.parse(outputSchema, out)).not.toThrow()
})
```

## Register lookup tests and controlled typecasting

Some parts of the codebase (for example the register mapping and lookup machinery used by codecs) are intentionally implemented with light-weight, explicit typecasts in tests and factories. Modeling all possible register shapes precisely in TypeScript would add significant complexity and reduce developer productivity, while giving marginal type-safety benefits at runtime.

To keep the codebase maintainable and fast to change, we therefore:

1. Keep run-time logic simple and pragmatic (often casting to `any` or to narrow shapes inside factories where the shape is known by construction).
2. Rely on thorough tests to ensure that the casts are correct. Tests exercise the register lookup code paths with representative inputs and assert the runtime outputs precisely.

Concretely:

- Register tables used by codecs are hard-coded in factories and tests will import these tables and assert the resolved register values and conversions.
- Tests validate boundary cases (missing registers, updated register values, type conversions, and error handling).
- When a cast is used in production code for ergonomics, a focused unit test exists that proves the cast matches the actual runtime structure produced by the device examples and schema.

This approach keeps the TypeScript types practical and avoids over-engineering the type system while preserving safety through deterministic tests.

## Test authoring tips

- Prefer small, focused unit tests for utilities and codec internals. Keep device tests as end-to-end as practical using the `examples.json` files.
- When adding a new device parser, add at least one `examples.json` (the spec-required file) and a device test that exercises uplink and hex uplink examples.
- For complex register transformations, add unit tests that import the register map and exercise the lookup and conversion logic.
- Use `vi.fn()` to create spies/mocks when you need to assert that helper functions or codec hooks were invoked (see existing parser tests for examples).

## Running tests in CI and locally

- Locally, run the parsers package tests with:

```bash
pnpm --filter ./packages/parsers test
```

- Generate coverage for local inspection:

```bash
pnpm --filter ./packages/parsers coverage
```

- Continuous integration should run `pnpm test` and `pnpm coverage` at minimum for the `packages/parsers` package to ensure no regressions.

## Coverage expectations and contribution policy

- Tests are the primary mechanism to guard correctness where types are intentionally relaxed.
- When introducing casts or simplifying typings, add tests that verify the runtime structure used by codecs and register lookups.
