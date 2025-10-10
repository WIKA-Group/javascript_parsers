# GD20W Parser Quick Start

## Parser API

All functions are pure (no global mutation) except `setMeasurementRanges` which updates internal range configuration for subsequent decodes.

### Types:

Input types:
```ts
interface UplinkInput {
  fPort: number // LoRaWAN FPort
  bytes: number[] // Raw payload as array of unsigned bytes (0-255)
  recvTime?: string // Optional ISO timestamp (if your LNS provides it)
}

interface HexUplinkInput {
  fPort: number // LoRaWAN FPort
  bytes: string // Raw payload as hex-encoded string (case-insensitive, even length)
  recvTime?: string // Optional ISO timestamp (if your LNS provides it)
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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/GD20W/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/GD20W/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'channel0' | 'channel1' | 'channel2' | 'channel3' | 'channel4' | 'channel5'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'channel0' | 'channel1' | 'channel2' | 'channel3' | 'channel4' | 'channel5'
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

setMeasurementRanges('channel0', { start: 0, end: 100 })
```
