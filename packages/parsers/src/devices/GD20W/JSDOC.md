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

#### Channel Configuration

| Channel Name | Min Value | Max Value | Unit | Configurable |
|-------------|-----------|-----------|------|--------------|
| channel0 | 4 | 20 | mA | ✓ |
| channel1 | 4 | 20 | mA | ✓ |
| channel2 | 4 | 20 | mA | ✓ |
| channel3 | 4 | 20 | mA | ✓ |
| channel4 | 4 | 20 | mA | ✓ |
| channel5 | 4 | 20 | mA | ✓ |

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

## Verifying Ranges

All channels on the GD20W are 4-20 mA current loop inputs and are **configurable**. You must verify the actual measurement ranges from your device specifications or identification frames. The parser defaults to placeholder ranges that may not match your device configuration.

### Using Identification Frames (TULIP2)

Both TULIP2 and TULIP3 supported devices send identification frames containing channel configuration. For TULIP2 devices, look for message type 6:

```json
{
  "data": {
    "messageType": 6,
    "channelId": 0,
    "channelName": "channel0",
    "measurementRangeStart": 0,
    "measurementRangeEnd": 100
  }
}
```

Use `measurementRangeStart` and `measurementRangeEnd` to configure the parser before decoding data messages.

## Quick Start

1. Check your device's actual measurement ranges from purchase configuration, device specifications, or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace values with your device's actual measurement ranges from specifications or identification frames
setMeasurementRanges('channel0', { start: 0, end: 100 })
setMeasurementRanges('channel1', { start: 0, end: 250 })
// ... configure other channels as needed
```
