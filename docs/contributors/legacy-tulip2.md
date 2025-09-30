# Legacy TULIP2 Guide

This page explains the historical parser variants, how the JavaScript implementations were structured, and the recommended path to migrate them onto the modern TypeScript-based TULIP2 codec stack.

## Legacy variants at a glance

| Generation | Version label | Example device(s) | Notes |
| --- | --- | --- | --- |
| Legacy TULIP2 (JavaScript) | 2.x.x | `F98W6` | Handwritten JavaScript formatters published with firmware 2.x.x |
| Transitional TypeScript port | 2.x.x | `GD20W` | First attempt at a literal TypeScript port; uses types but keeps legacy control flow. |
| Legacy TULIP2 (JavaScript) | 3.x.x | `NETRIS2` | Single device family using the evolved 3.x message map. Structure mirrors 2.x.x but with additional message codes and metadata. |

All three variants share the same conceptual protocol: the first byte selects a message type and subsequent bytes contain payload-specific fields. The differences are in code organisation, naming, and how much metadata is captured in lookups.

## Anatomy of the legacy JavaScript parsers (2.x.x and 3.x.x)

The classical 2.x.x formatter (`packages/parsers/src/devices/F98W6/index.js`) illustrates the patterns you will find across other devices:

- **Global measurement ranges**:<br>At the top of the file the developer must set `FORCE_RANGE_START`, `DEVICE_TEMPERATURE_RANGE_END`, etc. The decoder assumes these globals are configured before `decodeUplink` runs.
- **Single entry point**:<br>`decodeUplink(input)` dispatches on `input.bytes[0]` with a giant `switch` or `if` chain. Companion helpers (`decodeHexString`, `decodeBase64String`) normalise the payload before forwarding to `decodeUplink`.
- **Lookup dictionaries**:<br>Arrays or objects like `CHANNEL_NAMES_DICTIONARY`, `ALARM_EVENT_NAMES_DICTIONARY`, `DEVICE_ALARMS_DICTIONARY` convert numeric codes into human readable text. These are loosely typed and duplicated across devices.
- **Imperative parsing**:<br>Each message type manually slices byte ranges, applies scaling factors, and assembles the response object. Errors/warnings are pushed into arrays instead of thrown.

The 3.x.x format was a first approach to make the parsers modular. It tried to capture reusable logic in shared utilities. Handlers were not yet a simple input parameter so the structure still mirrors the 2.x.x style while having basic modular utilities. The measurement ranges were moved into the input parameters to avoid globals.

## Transitional TypeScript port (`GD20W`)

`packages/parsers/src/devices/GD20W/index.ts` shows the first attempt at bringing a legacy parser into TypeScript without yet adopting the modern codec API. Key observations:

- The file translates the legacy dictionaries into literal TypeScript constants (`MEASURAND_DICTIONARY`, `PROCESS_ALARM_TYPE_NAMES_DICTIONARY`, etc.) and declares verbose TypeScript interfaces for each message type.
- Control flow still mirrors the JavaScript formatter: it switches on message IDs inside a single decoding function.
- Strong typing helps describe the payloads but does not leverage shared helpers like `checkChannelsValidity` or the schema tooling. It is still effectively a 1:1 port of the legacy logic.

While this approach keeps behaviour identical, it inherits the drawbacks of mutable globals, duplicated lookups, and difficulty composing codecs.

## Migration path to the modern TULIP2 codec

Use the migrated `PEW` parser as the reference implementation (`packages/parsers/src/devices/PEW/parser/tulip2`). The high-level plan is:

1. **Inventory the legacy behaviour**:
   - List message types (first byte values) and the payload shapes they produce.
   - Capture scaling formulas, error sentinels (`0xFFFF`), and warning conditions.
   - Record measurement ranges and channel naming conventions.
2. **Create typed channel definitions**:
   - Translate global range constants into an `as const` array of `TULIP2Channel` objects.
   - Assign stable `channelId` values that match the legacy payload positions.
3. **Port message handlers**:
   - For each message code (0x00–0x09) author a `Handler` function. Reuse helper utilities (`roundValue`, `TULIPValueToValue`) where available or extract them from legacy code.
   - Keep warnings and error checks explicit; return them in the `GenericUplinkOutput` structure.
4. **Assemble the codec**:
   - Call `defineTULIP2Codec({ deviceName, channels, handlers, encodeHandler? })` in a factory (e.g. `createTULIP2DeviceCodec`). It is important that a factory function is used to return fresh channel arrays on each invocation. This way no state leaks between parser instances are possible.
   - Export a device parser that combines the TULIP2 codec with any TULIP3 codec via `defineParser()`.
5. **Add fixtures and tests**:
   - Move or recreate the legacy example payloads into `examples.json`.
   - Write or update Vitest suites (see `packages/parsers/src/devices/PEW/driver-examples.test.ts`) to assert decoded payloads and schema validation.
6. **Align schemas**:
   - Update the device’s Valibot factories to reflect the migrated output.
   - Run `pnpm schema` to regenerate `uplink.schema.json` (and `downlink.schema.json` if you added an encoder).
7. **Verify end-to-end**:
   - Run `pnpm test`, to confirm typechecks pass and run `pnpm lint` or `pnpm lint:fix` to ensure code style compliance.
   - Compare outputs against the legacy formatter to ensure regressions were not introduced.

The PEW migration demonstrates these steps cleanly: it extracted channel definitions into `createTULIP2PEWChannels()`, moved each legacy decode branch into a typed handler, and wired the codec through the shared parser factory.

## Migration considerations by legacy variant

- **2.x.x JavaScript formatters**:<br>Focus on replacing globals with typed channel definitions and lifting lookup dictionaries into constant maps. Most of the logic slots directly into `Handler` functions.
- **3.x.x (`NETRIS2`)** Has a different philosophy around how the parser is handled. Though the functions interpreting the messages can be similarly migrated to `Handler` functions, the overall structure may need to adapt to the new codec design.
- **Transitional TypeScript (`GD20W`)**:<br>Although typed, it still needs to be refactored into discrete handlers. Use the existing TypeScript types to seed Valibot schemas and unit tests during the migration.

## Pitfalls and tips

- **Channel range mutations**:<br>The modern codecs mutate channel objects when `adjustMeasuringRange()` runs. Always return fresh channel arrays from codec factories to avoid cross-parser pollution.
- **Error sentinels**:<br>Legacy formats often use `0xFFFF` or `0x7FFF` to mark invalid data. Ensure handlers detect these values and surface warnings so downstream systems behave the same.
- **Downlink parity**:<br>Most legacy parsers never implemented downlink encoding. Only add an `encodeHandler` when the device spec defines a stable command set; otherwise leave it undefined.
- **Schema drift**:<br>The moment you change output structure, update Valibot factories and regenerate JSON schemas to keep published artifacts in sync.
- **Testing depth**:<br>Legacy code relied on manual QA. The migration is an opportunity to codify fixtures and edge cases so future refactors are safer.
