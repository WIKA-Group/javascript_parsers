# F98W6 Parser Quick Start

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/F98W6/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/F98W6/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'strain' | 'device temperature' | 'battery voltage'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'strain'
```

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `strain` | -312.5 | 312.5 | µε | Yes |
| `device temperature` | -45 | 110 | °C | No |
| `battery voltage` | 0 | 5 | V | No |

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

## Verifying Measurement Ranges

**Strain channel:** The default range (-312.5 to 312.5 µε) may not match your device. Check your device specifications or purchase documentation for the actual configured strain range.

**Device temperature and battery voltage:** These channels have fixed ranges that cannot be adjusted (-45 to 110°C and 0-5V respectively).

### TULIP2 Identification Frames

Identification messages (message type `6`/`0x06`) confirm the configured ranges:

**Example TULIP2 identification frame:**
```json
{
  "data": {
    "messageType": 6,
    "configurationId": 1,
    "productIdName": "F98W6",
    "channels": [
      {
        "channelId": 0,
        "channelName": "strain",
        "measurementRangeStart": -312.5,
        "measurementRangeEnd": 312.5
      },
      {
        "channelId": 1,
        "channelName": "device temperature"
      },
      {
        "channelId": 2,
        "channelName": "battery voltage"
      }
    ]
  }
}
```

---

## Quick Start

1. Check your device's actual strain range from device specifications or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace values with your device's actual strain range from specifications or identification frames
adjustMeasuringRange('strain', { start: -312.5, end: 312.5 })
```
