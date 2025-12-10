# Schemas

LoRaWAN payload codecs are expected to ship JSON Schemas for every uplink decoder they expose, and for downlink encoders whenever they exist. This page explains how we satisfy that requirement, how the Valibot source of truth stays in sync with the generated JSON files, and what to watch out for when you extend or consume the schemas.

## Why Schemas Matter

- **Protocol compliance**:<br>The LoRaWAN Payload Codec API (TS013-1.0.0) states that `uplink.schema.json` must accompany every codec. Downlink schemas are optional but must be supplied when device supports downlinks.
- **Type safety for consumers**:<br>The Valibot validators we author in TypeScript are compiled to JSON Schemas. Those JSON files are bundled with the NPM packages so network servers, gateways, or integrators can validate payloads without running the full parser.
- **Single source of truth**:<br>The same Valibot definitions feed our TypeScript `InferOutput` types. When we regenerate the JSON Schemas we also refresh the TypeScript types consumed by codecs and parsers, keeping editor hints aligned with runtime behaviour.

## Where Everything Lives

- **Schema factories**:<br>Each device exposes a factory in `packages/parsers/src/devices/<Device>/schema/index.ts`. Factories typically return unions that cover every supported protocol generation for that device (for example, PEW combines TULIP2/TULIP3 outputs).
- **Shared building blocks**:<br>Common Valibot helpers reside in `packages/parsers/src/schemas/**`. These helpers model generic constructs such as channel mappings, alarm flags, or semver validation.
- **Generated JSON**:<br>Running the schema script writes `uplink.schema.json` and (when relevant) `downlink.schema.json` alongside the device folder. These files are committed to the repo because tooling expects them to be present in the published package.

## Generation Pipeline

We rely on Valibot for runtime validation and `@valibot/to-json-schema` to convert definitions into JSON Schema Draft-07.

1. Author or update the Valibot schema factory.
2. Execute the generator:

    ```bash
    pnpm schema
    ```

3. The script `packages/parsers/scripts/schema.ts` crawls `packages/parsers/src/devices/**/schema/index.ts`, imports the factories with `jiti`, converts them, and writes JSON under the device folder.
4. Review the console output. Any conversion issues are logged as warnings (error mode is set to `warn` to prevent CI noise). Investigate warnings immediately, they often point to unsupported Valibot pipelines.
5. Commit the regenerated JSON files together with your TypeScript changes so the published package remains self-consistent.

## Schema Design Principles

- **Mirror real payloads**:<br>Schemas intentionally use deeply nested objects, discriminated unions, and literal picklists to match the precise protocol surface. This keeps IDE hints and runtime validation accurate, even if the definitions become verbose.
- **Model unions explicitly**:<br>When a message byte can map to multiple shapes (for example TULIP2 alarm types), encode every variant as a union member. The resulting JSON Schema may be large, but it documents all valid combinations.
- **Keep literals literal**:<br>Use `as const` and Valibot `v.literal` / `v.picklist` helpers so channel names, alarm IDs, and message types remain literal strings or numbers. These literals drive the TypeScript downstream types used by codecs.

## Using the Types in Codecs

- Import `InferOutput` from Valibot (for example `type PEWTULIP2DataMessageUplinkOutput = v.InferOutput<...>`). These aliases are the types that codec handlers and parser generics consume.
- Expect some friction: when schemas involve large unions, TypeScript can struggle with inference. It is acceptable to cast at the point of use, but keep casts narrow (for example `as PEWTULIP2ProcessAlarmsData[number]`) so you do not erase safety for the rest of the pipeline.
- **Complex Schemas & Inference Limits**: For highly complex schemas (like TULIP3's full uplink union), TypeScript may hit call stack limits when inferring the output type directly from the schema object. In these cases, it is necessary to construct the output type manually from the constituent child schemas (e.g., `type Output = v.InferOutput<typeof Child1> | v.InferOutput<typeof Child2>`) and cast the schema factory return type to `any` or a simplified type to bypass the compiler limitation while maintaining type safety for consumers via the explicit type definition.
- When codecs share schema-derived types with the parser (`defineParser`), the generics guarantee that the public package exposes the correct input/output shapes to end users. See [Type Generics and Inference Guarantees](./codec-development.md#type-generics-and-inference-guarantees) for the bigger picture.

## Workflow for Schema Updates

1. **Plan the change**:<br>Identify which device(s) require new measurements or configuration options. Update fixtures and tests first to capture the new behaviour.
2. **Adjust Valibot definitions**:<br>Modify shared helpers under `packages/parsers/src/schemas` or the device-specific factory. Introduce new unions or picklists rather than widening everything to `string`/`number`.
3. **Update codecs/parsers**:<br>Wire the new types into codec handlers and parser outputs. Use the schema-derived TypeScript aliases wherever possible.
4. **Regenerate JSON**:<br>Run the schema script and ensure both the TypeScript compiler and the JSON converter succeed.
5. **Run tests**:<br>Execute the relevant Vitest suites so you catch regression issues and ensure type-level expectations still hold.
6. **Document**:<br>If the wire format changes, update the device documentation under `docs/devices/` and mention any new configuration hooks.

## Troubleshooting

- **Converter warnings**:<br>The Valibot → JSON bridge can complain when certain piped validators are unsupported (for example, `pipe(number(), integer(), min(0))`). Reorder the validators (`min`/`max` before `integer`) or add explicit comments explaining the limitation.
- **Type blow-ups**:<br>If TypeScript inference becomes unmanageable, consider factoring parts of the schema into smaller helpers and re-exporting typed aliases. Casting is a last resort; document why it is required.
- **Schema drift**:<br>Never hand-edit the JSON files. If a reviewer spots an inconsistency between TypeScript and JSON, rerun the generator and re-check everything into git.

## Known Limitations & Future Work

- The current schema definitions priorities accuracy over ergonomics, resulting in large JSON files and complex union types.
- Some codec implementations still require `@ts-expect-error` annotations until we simplify the generics in the shared helpers.

Despite the complexity, keeping the Valibot definitions truthful ensures our published packages deliver reliable type hints and compliant schemas to every integration partner.
