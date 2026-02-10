# TULIP3 implementation guide

This page provides a quick orientation to the modern WIKA TULIP3 codec stack so that you can diagnose issues or extend the implementation without reverse-engineering the entire codebase. It highlights where the core logic lives, how data flows through the decoder, and the checklist to follow when you add capabilities or fix bugs.

> Downlink support is not implemented yet. The encoder APIs are stubbed out intentionally and will be added in a future iteration.

## High-level architecture

TULIP3 is implemented inside `packages/parsers/src/codecs/tulip3/` and plugs into device parsers via `defineParser()` just like TULIP2. The implementation is spread across a few focused modules:

- **`codec.ts`**:<br>Entry point that exports `defineTULIP3Codec()`. It wires message dispatch, validates channels, and exposes the codec interface (`decode`, `canTryDecode`, `adjustMeasuringRange`, rounding helpers).
- **`profile.ts`**:<br>Type definitions and helpers for authoring device profiles. Device profiles declare sensor/channel layout, measurement ranges, rounding defaults, and alarm flag maps. Profiles are treated as mutable by runtime adjustments, so new codec instances must receive fresh profile objects.
- **`messages/`**:<br>Message-specific decoders. Each file handles a message type or subtype (data, process alarms, device alarms, configuration, identification, keep-alive, spontaneous). Shared utilities like `validateMessageHeader` live in `messages/index.ts`.
- **`registers/`**:<br>Register decoding infrastructure. `parseRegisterBlocks()` slices raw register payloads and `evaluateRegisterBlocks()` applies lookup tables to produce structured output objects. Device-specific lookups live under `devices/<DEVICE>/parser/tulip3/registers/`.
- **`lookups.ts`**:<br>Shared enumerations for status codes, measurand, units, protocol data types, and other dictionary-style metadata used across messages.

Device parsers integrate the codec by returning it from `createTULIP3...Codec()` helpers (see `packages/parsers/src/devices/<DEVICE>/parser/tulip3/`). Tests in each device folder exercise the codec using spec-required examples and schemas.

## Message flow in a nutshell

1. `defineParser()` validates all registered codecs and invokes `defineTULIP3Codec()`.
2. `defineTULIP3Codec()` inspects the first byte of the payload to choose a message handler (0x10–0x17). Subtype selection is handled by `readMessageSubtype()` and `validateMessageHeader()`.
3. Handlers decode payloads into domain objects, leveraging:
   - device profile metadata for channel names and ranges,
   - shared lookups for human-readable values,
   - register utilities for configuration/identification messages.
4. The codec returns typed output (e.g., `TULIP3UplinkOutput`) which is surfaced to callers through the parser API.

## Data messages and measurement conversion

TULIP3 data messages (message types `0x10` and `0x11`, subtype `0x01`) include a `sourceDataType` field for each measurement that indicates the original encoding format (e.g., `"uint16 - TULIP scale 2500 - 12500"`, `"float - IEEE754"`). This field is informational only—the parser automatically converts the raw value to a real measurement using the device's configured channel ranges.

**Key points:**
- The `value` field contains the **already converted** measurement in the channel's configured units.
- The `sourceDataType` field documents the original wire format but does not require manual conversion.
- Range conversion happens during decoding using the channel's `start` and `end` values from the device profile.

For devices that support `adjustMeasuringRange()`, you can change the target range before decoding, and the parser will scale measurements accordingly. For devices with TULIP3 support, you should verify the channel ranges from **identification frames** (message type `0x14`, subtype `0x01`) during initial setup to ensure the parser configuration matches the physical device. See the device-specific documentation for channels that allow range adjustments.

## Updating or extending TULIP3

When you need to modify the implementation:

1. **Start with the device profile.** Adjust sensor channels, measurement ranges, or alarm flags in the profile factory (`profile.ts` types ensure structure). Remember to create a new object per codec instance.
2. **Update lookup tables** if new enumerations are introduced (e.g., measurand or units). Keep them `as const` so TypeScript inference stays precise.
3. **Extend message decoders** inside `messages/`. Add new handlers or tweak existing ones; reuse helpers (rounding, validation) to keep behavior consistent.
4. **Adjust register parsing** when new registers appear. Add entries under `registers/` and update device-specific lookup maps. Tests should cover the mapping to guarantee casts remain accurate.
5. **Regenerate schemas** if msg payload shape changes (see [Schemas](/contributors/schemas)).
6. **Add tests**:
   - Extend the device’s `examples.json` with new fixtures.
   - Add or update Vitest cases (`driver-examples.test.ts` or targeted unit tests in `__tests__/`).
   - Confirm coverage includes register lookup paths when using casts.
7. **Run validation**:<br>`pnpm test` and, if schemas changed, `pnpm schema`.

## Known limitations

- **Downlink encoding**:<br>Not implemented. The codec’s `encode` function intentionally throws to prevent accidental usage. Future work will add encoder support once the specification stabilizes.
- **Generics ergonomics**:<br>Some message handlers use focused `@ts-expect-error` annotations due to complex profile generics. When editing, prefer keeping inference hints (e.g., `as const` on lookups) rather than introducing broad `any` casts.

Use this guide to orient yourself, then dive into the referenced modules to implement changes. The combination of targeted TypeScript types, Valibot schemas, and the tests should make it straightforward to verify behavior after each modification.
