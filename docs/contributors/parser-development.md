# Parser Development Workflow

This guide explains how to add support for a new device inside the 4.x.x parser stack. We start by pinning down what “parser” means in this codebase, then walk through the PEW implementation as a reference build. The last section highlights when you must develop a new codec first and where to find that process.

## Terminology

- **Device parser**:<br>The bundle created by `defineParser(...)`. It orchestrates one or more codecs, exposes the public helpers (`decodeUplink`, `decodeHexUplink`, `encodeDownlink`, `adjustMeasuringRange`, `adjustRoundingDecimals`), and lives under `packages/parsers/src/devices/<DeviceName>/`.
- **Codec**:<br>A protocol implementation (for example, `defineTULIP2Codec`, `defineTULIP3Codec`) that knows how to decode and optionally encode messages for a specific TULIP generation. Codecs live under `packages/parsers/src/codecs/`.
- **Device profile**:<br>The typed configuration objects that TULIP3 codecs consume (sensor channels, alarms, register limits, …). These usually sit next to the codec factory in the device folder.

When we say “add a new parser”, we normally mean “add a new device parser that wires together the existing codecs for that device”. Building a codec is a distinct task with different acceptance criteria.

## Choosing the Right Workflow

1. **Does the device speak an existing TULIP protocol version that already has a codec?**
   - ✅ *Yes* → Implement a **device parser** and reuse the codec factories.
   - ❌ *No* → Start with **codec development** (see [Codec Development Overview](/contributors/codec-development)) before creating the device parser wrapper.
2. **Does the device require multiple protocol versions at once?** Many NETRIS3-class devices ship both TULIP2 and TULIP3 support. In that case your device parser will register both codecs.
3. **Is the device a slight variant of an existing profile?** Prefer cloning and adjusting the device profile so the codec logic stays shared.

The remainder of this page focuses on the first branch: creating a device parser for a device that relies on one or more existing codecs.

## Building a Device Parser (Example: `PEW`)

Device parser development follows the same rhythm for every device:

1. **Create the device workspace**
   - Duplicate the structure from a similar device under `packages/parsers/src/devices/<ExistingDevice>/`.
   - At minimum you will want an `index.ts`, a `parser/` directory, and (if needed) local `schema/` or `fixtures/` folders.

2. **Author the parser factory** (`parser/index.ts`)
   - Import `defineParser` from `packages/parsers/src/parser`.
   - Import or create the codec factories you need.
   - Provide a unique `parserName` and pass the codec list. `PEW` registers both TULIP2 and TULIP3 codecs:

      ```ts
      import { defineParser } from '../../../parser'
      import { createTULIP2PEWCodec } from './tulip2'
      import { createTULIP3PEWCodec } from './tulip3'

      export const PEW_NAME = 'PEW-1000'

      export function useParser() {
        return defineParser({
          parserName: PEW_NAME,
          codecs: [createTULIP2PEWCodec(), createTULIP3PEWCodec()],
        })
      }
      ```

   - The helper returned by `defineParser` enforces that channel names and ranges match across codecs, so prefer creating the codec instances with fresh profile objects.
   - Instantiate codecs inside this module so the TypeScript generics stay intact. Moving the array construction elsewhere can widen the inferred types and degrade the public API. See [Type Generics and Inference Guarantees](./codec-development.md#type-generics-and-inference-guarantees) for the full contract.

3. **Expose the public entry point** (`index.ts`)
   - Instantiate the parser inside a factory-style helper and re-export the public API:

      ```ts
      import useParser from './parser'
      import '../../polyfills'

      const { adjustMeasuringRange, adjustRoundingDecimals, decodeHexUplink, decodeUplink } = useParser()

      export { adjustMeasuringRange, adjustRoundingDecimals, decodeHexUplink, decodeUplink }
      ```

   - The polyfills import ensures the bundle works in constrained runtimes such as network servers.

4. **Configure device profiles (TULIP3)**
   - TULIP3 codecs consume device profiles that define channels and alarm flags. For `PEW` this lives in `parser/tulip3/profile.ts`. Clone an existing profile, adjust the alarm selectors, and define channel ranges that match the datasheet.
   - Keep the profile factory idempotent, always return a fresh object, to avoid shared mutable state between parser instances.

5. **Provide TULIP2 channel definitions (if applicable)**
   - Legacy codecs still require explicit channel arrays and handler maps. Reuse utilities like `roundValue`, `TULIPValueToValue`, and the measurement lookup tables from `packages/parsers/src/utils`.

6. **Add schemas, fixtures, and documentation**
   - Place JSON schemas under `parser/schema/` if the device exposes custom message shapes.
   - Capture representative uplinks in `fixtures/` and reference them in tests and documentation.
   - Update the VitePress device page under `docs/devices/` so downstream users know the parser exists.

7. **Write automated tests**
   - Add Vitest suites under `packages/parsers/__tests__/` that exercise the new parser end-to-end using fixtures.
   - Aim to cover `decodeUplink`, `decodeHexUplink`, and any rounding or range adjustments.

8. **Verify the bundle**
   - Run `pnpm build` to ensure the device parser compiles.
   - Execute `pnpm test` (or the narrower Vitest command) and update coverage snapshots when necessary.

## Runtime Configuration Hooks

Every device parser exposes a consistent surface:

- `adjustMeasuringRange(channelName, { start, end })`: Use immediately after instantiation to align ranges with the deployed probe. All codecs receive the update.
- `adjustRoundingDecimals(decimals)`: Normalises the precision through `getRoundingDecimals` and applies it to each codec.
- `encodeDownlink({ codec, input })`: Only available when the codec implements an encoder (for example TULIP2 maintenance actions). Guarded by runtime checks for missing support.

Document how integrators should invoke these hooks when you update the device guide so the configuration stays in sync.

## When You Need a New Codec

Some devices introduce protocol changes that existing codecs cannot handle. Build a new codec when:

- The device speaks a new TULIP generation or a vendor-specific extension.
- Channels, alarm flags, or register layouts diverge from the assumptions in the shared codec.
- The device requires downlink encoders that are not modelled yet.

Codec development lives in its own guide because it touches message parsing, alarm semantics, validation schemas, and long-lived shared utilities. Start with the [Codec Development Overview](./codec-development.md) to plan that work before returning here to wire the codec into a device parser.

## Related Reading

- [Architecture](./architecture.md): High-level overview of the monorepo and codec abstraction.
- [Repository Setup](./repo-setup.md): Bootstrapping the workspace with `pnpm`.
- [Testing](./testing.md): Writing and running parser tests with Vitest and coverage gating.
