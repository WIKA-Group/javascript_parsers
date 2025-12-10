# Architecture Overview

This page explains how the parser monorepo is structured, how the modern 4.x.x codec stack processes uplinks and downlinks, and where to extend the system for new devices or protocol generations.

## Monorepo layout at a glance

- `packages/parsers/` → Source of the raw codecs and device assets. Contains:
  - `src/parser.ts` with `defineParser`, the runtime entry point that wires codecs together.
  - `src/codecs/` for protocol implementations (TULIP2, TULIP3, and future generations).
  - `src/devices/<DEVICE>/` with device-specific driver code, fixtures, metadata, schemas, and tests.
  - `scripts/build.ts` and `scripts/schema.ts` to bundle releases and emit JSON schemas.
- `packages/library/` → The published `@w2a-iiot/parsers` wrapper that exposes factory functions (for example `NETRIS2parser`) against the raw codecs.
- `examples/` → Minimal server and web experiences that demonstrate how to embed the parsers.
- `docs/` → This documentation site, published with VitePress.

Everything is orchestrated via pnpm and a shared lockfile, so packages can share utilities while remaining buildable in isolation.

## Runtime architecture (4.x.x parsers)

### Parser wiring

`defineParser` in `packages/parsers/src/parser.ts` assembles a device parser out of one or more codecs:

1. Validates that all supplied codecs agree on channel definitions (names and ranges).
2. Normalises rounding precision via `getRoundingDecimals` from `utils.ts`.
3. Exposes helpers such as `decodeUplink`, `decodeHexUplink`, `encodeDownlink`, `adjustMeasuringRange`, and `adjustRoundingDecimals`.
4. Chooses the first codec whose `canTryDecode` returns true, or throws if `throwOnMultipleDecode` detects ambiguous matches.

This abstraction means each device parser can host multiple protocol generations simultaneously (for example, TULIP2 and TULIP3) while presenting a stable API.

### Codec abstraction

Codecs conform to the generic signature in `src/codecs/codec.ts`:

```ts
interface Codec {
  name: string
  canTryDecode: (input: UplinkInput) => boolean
  decode: (input: UplinkInput) => GenericUplinkOutput
  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (channelName: string, range: { start: number, end: number }) => void
  getChannels: () => Channel[]
  encode?: (input: object) => number[]
}
```

- **TULIP2 codecs** (`src/codecs/tulip2/index.ts`) dispatch on the first byte (`0x00–0x09`) to message handlers that receive validated channel metadata and rounding options.
- **TULIP3 codecs** (`src/codecs/tulip3/*`) consume richer device profiles: sensor/channel maps, measurement types, and granular register/alarm flag definitions per component.
- The utilities in `src/codecs/utils.ts` enforce channel uniqueness and range validity with helpful error messages.

Because the interface is generic, adding specialized codecs is straightforward. Future generations such as “WIKA TULIP4/5/6” only need to implement the same surface, `defineParser` will accept them alongside existing codecs.

### Shared utilities and schemas

- `src/shared.ts` hosts common parsing helpers: input validation, warning aggregation, channel range adjustments, and measurement conversions.
- `src/utils.ts` provides low-level math/encoding helpers (rounding, hex conversion, percentage mapping) shared across codecs.
- `src/types.ts` defines the typed outputs (`GenericUplinkOutput`, `Range`, `Channel`, etc.) that flow through codecs and parsers.
- `src/schemas/` contains valibot schema factories for uplink/hex inputs, which underpin runtime checks and schema generation.

## Data flow: uplink bytes → structured payload

1. **Input** arrives as `{ bytes, fPort, recvTime? }` from a gateway or integration.
2. `decodeUplink` validates the shape using the valibot schemas.
3. The parser queries each codec’s `canTryDecode` to find a candidate based on protocol-specific hints.
4. The codec’s `decode` handler transforms raw bytes into typed data (measurements, alarms, configuration status) and may attach warnings.
5. Common utilities normalise rounding, channel ranges, and error reporting before the result is returned as a `GenericUplinkOutput`.

Downlink encoding flows in the opposite direction: callers provide `{ codec: string, input: object }`, the parser locates the matching codec by name, and forwards to its `encode` handler when available.

## Device assets and schema contracts

Each device folder under `packages/parsers/src/devices/<DEVICE>` typically contains:

- `index.ts`/`index.js` → The parser entry for that device.
- `examples.json` → Uplink fixtures used by tests and documentation.
- `driver.yaml`, `metadata.json`, `README.md` → Metadata for downstream packaging.
- `schema/` → Type definitions (`index.ts`) that feed `scripts/schema.ts` to generate `uplink.schema.json` and, when supported, `downlink.schema.json`.
- Tests (`*.spec.ts`/`*.test.ts`) verifying decode/encode behaviour against real payloads.

The schema script loads each device’s valibot factories, converts them to JSON Schema via `@valibot/to-json-schema`, and writes the artifacts next to the device files. This keeps contract files in sync with the TypeScript types driving the codecs.

## Build and distribution pipeline

1. **Schema generation** (`pnpm schema`) runs `scripts/schema.ts`, producing `uplink.schema.json` and `downlink.schema.json` (when applicable).
2. **Bundling** (`pnpm build` or `pnpm --filter @w2a-iiot/raw-javascript-parsers build`) executes `scripts/build.ts` which:
  - Discovers device entry files with `globEntryFiles`.
  - Creates per-device tsdown configs via `makeBuildConfigFor`, targeting ES2015 and yielding tree-shaken ESM bundles.
  - Cleans `dist/`, builds each parser, post-processes output (JSDoc injection, export cleanup), and packages results into `parsers.zip`.
3. **Library packaging** (`pnpm build`) uses `packages/library/tsdown.config.ts` to emit the published ESM bundle and type declarations.
4. **Polyfills** (`src/polyfills.ts`) ensure legacy environments receive required ES features when bundles are executed in gateways or network servers.

## Extension points and legacy coexistence

- Adding a new device involves creating a profile under `packages/parsers/src/devices/<DEVICE>`, defining its codecs (TULIP2, TULIP3, or a new protocol generation), and wiring the parser export.
- Because codecs are modular, specialised protocol forks (for example, a device-specific telemetry mode) can coexist simply by implementing the codec interface and registering it with `defineParser`.
- All devices now use the modern `4.x.x` TypeScript codec architecture, providing a consistent development experience across the entire device matrix.
- The library package (`@w2a-iiot/parsers`) selectively wraps devices that are ready for external consumption, while the raw package exposes the full matrix for tooling such as the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox).

With this mental model in place, proceed to [Parser Development](/contributors/parser-development) for hands-on guidance when adding devices or evolving codecs.
