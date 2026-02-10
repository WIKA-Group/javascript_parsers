# PEW Parser Quick Start

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/PEW/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/PEW/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'pressure' | 'device temperature'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'pressure'
```

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `pressure` | 0 | 10 | bar/psi/MPa | Yes |
| `device temperature` | -45 | 110 | °C | No |

*Unit depends on device configuration. Check device specifications or identification frames for actual unit and range.

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

## Verifying Measurement Ranges

**Critical:** The default range may not match your device. Always verify the actual range from one of these sources:

1. **Device specifications** from your purchase order or datasheet
2. **Identification frames** sent by the device after activation

Using incorrect ranges will result in incorrect measurement values in all data messages.

### TULIP3 Identification Frames

For devices using TULIP3 protocol, the first uplinks after device activation include identification messages (message type `20`/`0x14`, subtype `1`/`0x01`) that report the actual measurement ranges:

- **Pressure channel**: Check `minMeasureRange` and `maxMeasureRange` in sensor1/channel1. Common ranges: 0-100 psi, 0-10 bar, 0-1 MPa, etc.
- **Device temperature channel**: Always -45°C to 110°C (fixed, cannot be adjusted).

**Example TULIP3 identification frame:**
```json
{
  "data": {
    "messageType": 20,
    "messageSubType": 1,
    "identification": {
      "sensor1": {
        "channel1": {
          "measurand": "Pressure (gauge)",
          "unit": "psi",
          "minMeasureRange": 0,
          "maxMeasureRange": 100,
          "channelName": "pressure"
        }
      }
    }
  }
}
```

### TULIP2 Identification Frames

For devices using TULIP2 protocol, identification messages (message type `6`/`0x06`) also report the measurement ranges, but in a different format:

**Example TULIP2 identification frame:**
```json
{
  "data": {
    "messageType": 6,
    "configurationId": 1,
    "productIdName": "PEW",
    "channels": [
      {
        "channelId": 0,
        "channelName": "pressure",
        "pressureType": "gauge",
        "measurementRangeStart": 0,
        "measurementRangeEnd": 100
      }
    ]
  }
}
```

---

## Quick Start

1. Check your device's actual pressure range from purchase configuration, device specifications, or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: e.g. `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace 0 and 100 with your device's actual pressure range
setMeasurementRanges('pressure', { start: 0, end: 100 })
```
