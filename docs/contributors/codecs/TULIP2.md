# TULIP2 implementation guide

This short guide explains how the legacy-but-still-supported WIKA TULIP2 codec is implemented in the repository, where to look when things break, and how to evolve the decoder safely.

> Downlink encoding is optional in TULIP2. Most shipped codecs do not expose an encoder yet; support will arrive alongside future device firmware once the command set is finalised.

## High-level architecture

The TULIP2 stack lives in `packages/parsers/src/codecs/tulip2/` and integrates with device parsers through `defineParser()` like every other codec family.

- **`index.ts`**:<br> home of `defineTULIP2Codec()`. It validates channel layouts, wires message handlers, and exposes codec methods (`decode`, `canTryDecode`, rounding and measuring-range adjustments, optional `encode`).
- **Device handlers**:<br> each device keeps its message handlers under `packages/parsers/src/devices/<DEVICE>/parser/tulip2/`. A handler receives the raw `UplinkInput` plus context (`roundingDecimals`, `channels`) and returns a typed `GenericUplinkOutput`.
- **Shared utilities**:<br> channel validation (`checkChannelsValidity`) lives in `packages/parsers/src/codecs/utils.ts`; rounding helpers (`getRoundingDecimals`) live in `packages/parsers/src/utils.ts` and are reused by both TULIP2 and TULIP3.
- **Tests and fixtures**:<br> device folders include `examples.json` with mandatory spec fixtures and Vitest suites (for example `driver-examples.test.ts`) that assert decoded output against the implementation and schemas.

## Message flow in a nutshell

1. `defineParser()` constructs the device parser and includes one or more TULIP2 codecs.
2. `defineTULIP2Codec()` takes a channel map and handler table. The first payload byte (0x00–0x09) is used to look up the correct handler.
3. The selected handler decodes the rest of the payload. It can read channel metadata (name, range, ID) from the `channels` array, apply rounding via the provided `roundingDecimals`, and return warnings or errors if needed.
4. The codec surfaces the handler result as `GenericUplinkOutput`, which flows back through the device parser APIs (`decodeUplink`, `decodeHexUplink`).

## Updating or extending TULIP2

When evolving the codec or bringing a new device online:

1. **Define channels first.** Each channel needs a unique `name`, `channelId`, and measurement range. Keep the array `as const` so TypeScript captures literal names and IDs.
2. **Validate handlers cover every message type** you expect to see. Add new entries (0x00–0x09) in the handler table and reuse shared helpers for parsing/rounding.
3. **Avoid sharing channel arrays between codecs.** `adjustMeasuringRange()` mutates channel entries; ensure every codec instance gets a fresh channel array.
4. **Implement downlink (optional).** If the device supports encoding, supply an `encodeHandler` that produces the byte array. Keep validation strict and add tests around it.
5. **Update fixtures and schemas.** Extend `examples.json`, adjust schema factories if the output shape changes, and regenerate JSON schemas via `pnpm schema` when needed.
6. **Add or adjust tests.** Extend device-specific Vitest suites and ensure register or lookup logic is covered when you introduce casts or new enums.
7. **Run validation scripts.** At minimum execute `pnpm --filter ./packages/parsers test`; include `pnpm schema` if schema files were touched.

## Known limitations

- **Downlink parity**:<br> because few devices expose a stable command set, encoders are typically omitted. Expect to add them per device when customer requirements firm up.
- **Handler discipline**:<br> TULIP2 does not enforce exhaustive handler coverage. If a new message type appears at runtime without a matching handler, the codec will throw. Always add a handler and corresponding tests when you learn about new message IDs.
- **Mutable channels**:<br> `adjustMeasuringRange()` mutates the channel array. Reuse of the same array across codecs leads to surprising behaviour; always return new objects from device factories.

Armed with this overview, you can follow the paths in `defineTULIP2Codec()` and the device-specific handler modules to diagnose issues quickly or extend support for new payloads.
