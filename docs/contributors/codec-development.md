# Codec Development Overview

Codec development is the path you take when a device speaks a protocol variant that none of the shipped codecs can handle yet. This page captures the design rules, folder layout, and validation steps required to add a new codec safely, whether you are extending an existing TULIP generation or preparing for the next one.

## When You Need a Codec

Build or extend a codec when any of the following is true:

- The device uses a TULIP generation that is not implemented (`TULIP4`, `TULIP5`, …) or a vendor-specific dialect.
- Message types, alarm semantics, or register layouts diverge from the assumptions in the shared codec.
- You need new downlink encoders that are currently unavailable.
- Two devices would otherwise fork into wildly different handler logic within the same codec.

If the device already fits an existing codec, skip this page and follow the [Parser Development Workflow](/contributors/parser-development) instead.

## Prerequisites

- A full protocol specification (message tables, value scaling, alarm flag meanings).
- Example payload captures that cover each message type, including error paths.
- Agreement on the target directory (`packages/parsers/src/codecs/<family>/`).
- Updated TypeScript types or schema definitions when the output payload changes.

## Project Layout

Each codec family lives under `packages/parsers/src/codecs/`:

- `tulip2/`: Channel-based handlers with manual message routing.
- `tulip3/`: Device profile factories plus message/encoding helpers.
- Future generations (for example `tulip4/`) should mirror this structure to keep adoption predictable.

Inside the family folder place:

- `codec.ts`: Exports the `defineTULIPxCodec` factory that returns a `Codec` object.
- `messages/`: Shared message parsers or encoders.
- `profile.ts` (TULIP3+): Helpers for building device profiles.
- `__tests__/`: Unit tests focused on the codec logic.

## Type Generics and Inference Guarantees

The public NPM packages rely heavily on TypeScript generics to surface accurate input/output shapes to downstream consumers. When you author a codec or parser, keep the following contracts in mind, misusing them typically results in `any` leaking into the published types.

### The `Codec` type

`packages/parsers/src/codecs/codec.ts` defines the shared `Codec<TCodecName, TData, TChannelName, TEncoder>` type. Each type parameter has a specific purpose:

- `TCodecName extends string`: Literal identifier exposed to consumers. Downstream code uses this in discriminated unions (for example, when selecting a codec for `encodeDownlink`). Always build the name with template literals (``${deviceName}TULIP3Codec``) so it stays literal.
- `TData extends GenericUplinkOutput`: Exact result type of `decode`. In TULIP2 this becomes the union of all handler return types; in TULIP3 it is `TULIP3UplinkOutput<TDeviceProfile>` so channel metadata matches the profile.
- `TChannelName extends string`: Compile-time list of valid channel names. `defineParser` uses this to gate `adjustMeasuringRange`, preventing typos at call sites.
- `TEncoder`: Optional encoder signature. When provided, the resulting codec surface includes a strongly typed `encode` function; otherwise the property is omitted entirely. If your codec cannot encode, leave this parameter as `undefined`.

### `defineTULIP2Codec`

The TULIP2 factory threads generics through options:

- `TChannels extends TULIP2Channel[]`: Provide channel arrays as `const` so literal names and IDs survive inference.
- `THandlers extends MessageHandlers<TChannels>`: Each handler can return a different payload type. The utility type `ReturnTypeOfHandlers<TChannels, THandlers>` builds a union so `decode` returns an exact discriminated shape.
- `TEncoder extends ((input: object) => number[]) | undefined`: Supply a narrow encoder signature per codec (for example `encodeHandler: (input: MyDownlink) => number[]`). That flows into both the codec type and parser `encodeDownlink` helper.

When you implement `defineTULIP2Codec`:

- Declare channels inline and cast with `as const` to keep literal property names.
- Return specific handler payload types rather than `GenericUplinkOutput`; this improves editor autocomplete for consumers.
- Avoid reusing channel arrays between codecs. Besides the runtime mutation risk, doing so often widens the inferred tuple type to `TULIP2Channel[]`, losing literal channel names.

#### Channel Range Adjustment Restrictions

Channels can optionally specify `adjustMeasurementRangeDisallowed: true` to prevent runtime range modification:

```typescript
const channels = [
  { name: 'pressure', start: 0, end: 100, channelId: 0 }, // Adjustable
  { name: 'humidity', start: 0, end: 100, channelId: 1, adjustMeasurementRangeDisallowed: true }, // Fixed
] as const
```

Use this flag for channels where the measuring range is constrained by hardware (battery voltage, signal strength) or protocol specifications (relative humidity always 0-100%). The parser's `adjustMeasuringRange` helper validates this flag at runtime and throws distinct errors for:

1. Non-existent channels: `"Channel {name} does not exist in parser {parserName}. Cannot adjust measuring range."`
2. Restricted channels: `"Channel {name} does not allow adjusting the measuring range in parser {parserName}."`

**Important for multi-codec parsers:** When multiple codecs are used in a single parser, the `adjustMeasurementRangeDisallowed` value **must be identical** for channels with the same name across all codecs. The `checkCodecsValidity` function enforces this at parser initialization:

```typescript
// ✅ VALID - Both codecs agree
const codec1 = defineTULIP2Codec({
  channels: [{ name: 'humidity', start: 0, end: 100, adjustMeasurementRangeDisallowed: true }],
  // ...
})
const codec2 = defineTULIP2Codec({
  channels: [{ name: 'humidity', start: 0, end: 100, adjustMeasurementRangeDisallowed: true }],
  // ...
})

// ❌ INVALID - Inconsistent settings
const codec1 = defineTULIP2Codec({
  channels: [{ name: 'humidity', start: 0, end: 100, adjustMeasurementRangeDisallowed: true }],
  // ...
})
const codec2 = defineTULIP2Codec({
  channels: [{ name: 'humidity', start: 0, end: 100 }], // undefined treated as false
  // ...
})
// Throws: "Channel humidity has inconsistent adjustMeasurementRangeDisallowed settings"
```

**Type-level implications:** The `TULIP2AdjustableChannelNames` helper type extracts only adjustable channel names for the parser's type signature. If **all** channels in a codec have `adjustMeasurementRangeDisallowed: true`, the adjustable channel names type will be inferred as `never`, and TypeScript will prevent any calls to `adjustMeasuringRange` at compile time. There might even be a type error when trying to pass the codec to `defineParser` if no channels are adjustable. If this is a required use case, the types have to be adjusted accordingly (currently not supported).

### `defineTULIP3Codec`

TULIP3 codecs depend on device profiles for their generics:

- `const TDeviceProfile extends TULIP3DeviceProfile`: Keep the profile factory (`defineTULIP3DeviceProfile`) typed `as const`; this preserves literal channel names, alarm flags, and message size limits.
  - **Granular Configuration**: The profile now requires explicit `registerConfig` and `alarmFlags` definitions for the communication module, and for every sensor and channel. This allows for precise modeling of devices where capabilities vary per-component (e.g., one sensor supports alarms while another does not).
- `ChannelNames<TDeviceProfile['sensorChannelConfig']>`: A helper mapped type that extracts channel names from the profile so `adjustMeasuringRange` and `defineParser` stay type-safe even when sensors are nested.
- `TULIP3UplinkOutput<TDeviceProfile>`: Ties every decoded message back to the originating profile, ensuring the output `data` object has precise key types.

Because the current implementation still relies on a default generic in the profile, you will see `// @ts-expect-error` annotations inside `decode`. These exist to keep the emitted JavaScript lean until we can simplify the type algebra. Do not remove them unless you are also addressing the underlying inference issue.

#### Channel Range Adjustment Restrictions (TULIP3)

TULIP3 channels support the same `adjustMeasurementRangeDisallowed` flag as TULIP2, but it's specified in the device profile's channel configuration:

```typescript
const profile = defineTULIP3DeviceProfile({
  deviceName: 'MySensor',
  sensorChannelConfig: {
    sensor1: {
      channel1: {
        channelName: 'pressure',
        start: 0,
        end: 1000,
        measurementTypes: [/* ... */],
        // adjustMeasurementRangeDisallowed omitted = adjustable
      },
      channel2: {
        channelName: 'humidity',
        start: 0,
        end: 100,
        measurementTypes: [/* ... */],
        adjustMeasurementRangeDisallowed: true, // Fixed range
      },
    },
  },
  // ...
} as const)
```

The same validation rules apply:

- **Multi-codec consistency:** When combining TULIP3 codecs with other protocol versions in a parser, channels with matching names must have identical `adjustMeasurementRangeDisallowed` values across all codecs.
- **Type inference:** The `ChannelNames` mapped type filters out channels where `adjustMeasurementRangeDisallowed extends true`, providing compile-time safety. If all channels are restricted, the type becomes `never`.
- **Runtime validation:** The parser throws specific errors distinguishing between non-existent channels and channels that exist but cannot be adjusted.

Unlike the base `Channel` type which only allows `adjustMeasurementRangeDisallowed?: true`, TULIP3's `TULIP3ChannelConfig` accepts `adjustMeasurementRangeDisallowed?: boolean` for greater flexibility during profile authoring. However, the validation logic normalizes both `false` and `undefined` to "allowed" for consistency.

### `defineParser`

`packages/parsers/src/parser.ts` binds everything together with additional generics:

- `ParserOptions<TCodec extends AnyCodec>`: Passing your codec array lets the parser infer:
   - `decodeUplink` / `decodeHexUplink` return type: union of all codec `decode` outputs.
   - `adjustMeasuringRange(channelName)` signature: union of `TChannelName` values from every codec.
   - `encodeDownlink` input: discriminated union keyed by `codec` name, where the `input` shape matches the encoder’s first argument.

To keep inference intact, always instantiate codecs within the same module where you call `defineParser`, and avoid post-instantiation mutation of the codec array.

### Practical Tips

- Prefer `as const` when declaring channels, device profiles, and handler maps. Literal inference keeps template literal types intact.
- Export factory helpers (`createTULIP3<DEVICE>Codec`) instead of raw codec instances; this ensures fresh generic instantiation each time.
- If you introduce new message helpers, type their return values explicitly and feed them back into the codec handler signature, this prevents the compiler from falling back to `GenericUplinkOutput`.
- When you must broaden a type (for example to satisfy shared utilities), do it as late as possible to preserve inference for consumers.
- Document any `@ts-expect-error` usage directly above the line so future refactors know which generic limitation you are working around.

The generics are intentionally strict today to guarantee type safety in the published packages. We plan to simplify their ergonomics, but until then treat these patterns as part of the public API contract.

## Building a TULIP3 Codec

1. **Define the device profile factory**
   - Start from an existing profile under `packages/parsers/src/devices/<Device>/parser/tulip3/`.
   - Describe sensor channels, rounding defaults, identification/configuration register limits, and alarm flag selections.
   - Return a fresh object (`defineTULIP3DeviceProfile({...})`) to prevent shared mutable state.

2. **Create the codec factory**
   - Import `defineTULIP3Codec` from `packages/parsers/src/codecs/tulip3/codec`.
   - Call it with the device profile and export a typed helper (for example `createTULIP3PEWCodec`).
   - Ensure channel names and ranges match the datasheet; `checkChannelsValidity` will enforce this at runtime.

3. **Implement message handlers**
   - Reuse helpers in `packages/parsers/src/codecs/tulip3/messages/` for decoding alarms, registers, and spontaneous messages.
   - Add new helpers when the protocol introduces message types outside the existing enums.
   - Keep return shapes aligned with the Valibot schemas (`packages/parsers/src/schemas`).
  - Throw raw `Error` objects (or emit warnings via the shared helpers) when decoding failures occur. The parser runtime automatically catches them and prefixes the message with the codec identifier, so you don't need to prepend the codec name yourself.

4. **Add downlink encoders when needed**
   - Extend the codec return type with an `encode` function.
   - Protect the encoder with validation so parser callers receive actionable errors.

5. **Write fixtures and tests**
   - Place sample payloads under `packages/parsers/__tests__/fixtures/`.
   - Add Vitest suites that exercise each message type and encoder.
   - Assert warnings and error cases, not just happy paths.

## Building a TULIP2 Codec

1. **Describe the channels**
   - Define the `channels` array with `channelId`, `name`, and measuring range.
   - Use helpers like `roundValue` and `TULIPValueToValue` to keep scaling consistent.

2. **Provide handler maps**
   - Implement a `handlers` object keyed by message type byte (`0x01`, `0x02`, …).
   - Keep handlers small and delegate lookups or conversions to utilities in `packages/parsers/src/utils`.

3. **Handle encoder support (optional)**
   - Supply an `encodeHandler` when the device needs downlink support.
   - Validate inputs aggressively; invalid frames should throw informative errors.

4. **Test thoroughly**
   - Add focused tests around each handler to guarantee regression coverage.
   - Include edge cases such as truncated frames or out-of-range channel data.

## Shared Validation & Tooling

- Run `pnpm test` to execute codec unit tests.
- Use `pnpm build` to confirm the codec compiles inside the bundle.
- Regenerate JSON schemas with `pnpm schema` whenever the decoded payload shape changes.
- Double-check the `checkCodecsValidity` errors: they guarantee that channel ranges, channel names, and codec names remain in sync across a device parser.

## Handing Off to Device Parsers

Once the codec is stable:

1. Export the factory from the codec’s `index.ts`.
2. Wire it into the target device parser (see the PEW example in [Parser Development Workflow](./parser-development.md)).
3. Update device-specific documentation under `docs/devices/` so downstream users know which protocol versions are available.
4. Mention any new configuration hooks or encoder capabilities in the parser guide.

## Related Reading

- [Parser Development Workflow](./parser-development.md): Wiring codecs into device parsers.
- [Architecture](./architecture.md): How codecs plug into the parser abstraction.
- [Schemas](./schemas.md): Maintaining the Valibot schema definitions alongside codec updates.
- [Testing](./testing.md): Expectations for Vitest coverage and regression protection.
