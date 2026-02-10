# FLRU + Netris3 Parser Quick Start

## Parser API

All functions are pure (no global mutation) except `adjustMeasuringRange` which updates internal range configuration for subsequent decodes.

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/FLRU_NETRIS3/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/FLRU_NETRIS3/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'level'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'level'
```

#### Channel Configuration

| Channel Name | Min Value | Max Value | Unit | Configurable |
|-------------|-----------|-----------|------|--------------|
| level | 0 | 1000 | mm / in | ✓ |

### `decodeUplink(input)`
```ts
function decodeUplink(input: UplinkInput): Result
```

### `decodeHexUplink(input)`
```ts
function decodeHexUplink(input: HexUplinkInput): Result
```
`bytes` must have even length; case-insensitive.

### `adjustMeasuringRange(channel, range)`
```ts
// Will throw on invalid channel name or if the channel disallows range updates
function adjustMeasuringRange(
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

The level channel on the FLRU is **configurable**. You must verify the actual measurement range from your device specifications or identification frames. The parser default shown in the table above may not match your device configuration.

### Using Identification Frames

This device supports both TULIP2 and TULIP3 protocols. Each sends identification frames containing channel configuration:

**TULIP3 (Message Type 20):**
```json
{
  "data": {
    "messageType": 20,
    "channelId": 0,
    "channelName": "level",
    "measurementRangeStart": 0,
    "measurementRangeEnd": 1000
  }
}
```

**TULIP2 (Message Type 6):**
```json
{
  "data": {
    "messageType": 6,
    "channelId": 0,
    "channelName": "level",
    "measurementRangeStart": 0,
    "measurementRangeEnd": 1000
  }
}
```

Use `measurementRangeStart` and `measurementRangeEnd` to configure the parser before decoding data messages.

## Quick Start

1. Check your device's actual measurement range from purchase configuration, device specifications, or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace values with your device's actual measurement range from specifications or identification frames
adjustMeasuringRange('level', { start: 0, end: 1000 })
```
