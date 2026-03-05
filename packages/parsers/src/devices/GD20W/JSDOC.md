# GD20W Parser Quick Start

## Parser API

All functions are pure (no global mutation) except `adjustMeasuringRange` which updates internal range configuration for subsequent decodes and encodes.

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

### `decodeHexUplink(hexInput)`
```ts
function decodeHexUplink(hexInput: HexUplinkInput): Result
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

### `encodeDownlink(input)`
```ts
interface DownlinkInput {
  protocol: 'TULIP2'
  input: {
    deviceAction: 'configuration'
    mainConfiguration?: {
      measuringRateWhenNoAlarm: number
      publicationFactorWhenNoAlarm: number
      measuringRateWhenAlarm: number
      publicationFactorWhenAlarm: number
    }
    channel0?: false | true | { alarms?: object }
    channel1?: false | true | { alarms?: object }
    channel2?: false | true | { alarms?: object }
    channel3?: false | true | { alarms?: object }
    channel4?: false | true | { alarms?: object }
    channel5?: false | true | { alarms?: object }
    configurationId?: number
    byteLimit?: number
  } | {
    deviceAction: 'resetToFactory'
  } | {
    deviceAction: 'resetBatteryIndicator'
    configurationId?: number
  } | {
    deviceAction: 'getConfiguration'
    mainConfiguration?: true
    channel0?: true | { alarms?: true }
    channel1?: true | { alarms?: true }
    channel2?: true | { alarms?: true }
    channel3?: true | { alarms?: true }
    channel4?: true | { alarms?: true }
    channel5?: true | { alarms?: true }
    configurationId?: number
    byteLimit?: number
  }
}

function encodeDownlink(input: DownlinkInput): {
  bytes: number[]
  fPort: number
  warnings?: string[]
} | {
  errors: string[]
}
```

### `encodeMultipleDownlinks(input)`
```ts
function encodeMultipleDownlinks(input: DownlinkInput): {
  frames: number[][]
  fPort: number
  warnings?: string[]
} | {
  errors: string[]
}
```

## Verifying Ranges

All channels on the GD20W are 4-20 mA current loop inputs and are **configurable**. You must verify the actual measurement ranges from your device specifications or identification frames. The parser defaults to placeholder ranges that may not match your device configuration.

### Using Identification Frames (TULIP2)

GD20W currently supports TULIP2. Look for identification message type `0x09` (extended device identification) to get actual channel ranges:

```json
{
  "data": {
    "messageType": 9,
    "channelRanges": {
      "channel0": { "min": 0, "max": 12 },
      "channel1": { "min": 0, "max": 200000 }
    }
  }
}
```

Use `channelRanges.channelX.min/max` to configure the parser before decoding or encoding range-based values.

## Quick Start

1. Check your device's actual measurement ranges from purchase configuration, device specifications, or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace values with your device's actual measurement ranges from specifications or identification frames
adjustMeasuringRange('channel0', { start: 0, end: 100 })
adjustMeasuringRange('channel1', { start: 0, end: 250 })
// ... configure other channels as needed
```
