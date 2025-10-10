# A2G Parser Quick Start

## Parser API

All functions are pure (no global mutation) except `adjustMeasuringRange`, which updates internal range configuration for subsequent decodes.

### Types

Input types:
```ts
interface UplinkInput {
  fPort: number // LoRaWAN FPort
  bytes: number[] // Raw payload as array of unsigned bytes (0-255)
  recvTime?: string // Optional ISO timestamp from your LNS
}

interface HexUplinkInput {
  fPort: number // LoRaWAN FPort
  bytes: string // Hex-encoded payload (case-insensitive, even length)
  recvTime?: string // Optional ISO timestamp from your LNS
}
```

Return type (shared by all decode helpers):
```ts
type Result = {
  data: Record<string, any> // Parsed key/value pairs
  warnings?: string[] // Non-fatal anomalies
} | {
  errors: string[] // Fatal or structural issues only
}
```

To understand the `data` field, review the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/A2G/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/A2G/uplink.schema.json).

Supported `channels` exposed in the decoded payload:
```ts
// Channel identifiers available in measurement output
// (payloads with 6 bytes only contain the pressure channel)
type ChannelName
  = | 'pressure'
    | 'flow'
    | 'input_1'
    | 'input_2'
    | 'input_3'
    | 'input_4'
    | 'relay_status_1'
    | 'relay_status_2'
```

Channels that support adjusting the measurement range:
```ts
// Relay status channels are boolean flags and cannot be adjusted
type AdjustableChannelName
  = | 'pressure'
    | 'flow'
    | 'input_1'
    | 'input_2'
    | 'input_3'
    | 'input_4'
```

### `decodeUplink(input)`
```ts
function decodeUplink(input: UplinkInput): Result
```

### `decodeHexString(hexInput)`
```ts
function decodeHexString(hexInput: HexUplinkInput): DecodeResult
```
`bytes` must have even length; case-insensitive.

### `setMeasurementRanges(channel, range)`
```ts
// Will throw on invalid channel name or if the channel disallows range updates
function setMeasurementRanges(
  channelName: AdjustableChannelName,
  range: {
    start: number
    end: number
  }
): void
```
Applies to future decodes only.

### `adjustRoundingDecimals(decimals)`
```ts
// Smartly adjust number of decimals for rounded values
// Impacts all numeric values in all outputs
// Default is 4
function adjustRoundingDecimals(decimals: number): void
```
Applies to future decodes only.

## Quick Start

Some network servers may not conform to the LoRaWAN codec specification. In this case, you need to create a small wrapper function.

Your device ranges might not be the default. Insert your desired ranges before decoding like this:

```ts
// Parser code...

// Quick start guide...

setMeasurementRanges('pressure', { start: 0, end: 100 })
```
