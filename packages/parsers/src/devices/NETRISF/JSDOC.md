# NETRIS_F Parser Quick Start

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRISF/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRISF/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
type ChannelName = 'measurement' | 'device temperature'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'measurement'
```

**Important note:** NETRIS_F TULIP2 delivers battery voltage as part of the decoded measurement output, but that does not make it a real formal parser channel.

- Only `measurement` and `device temperature` are formal parser channels
- In `TULIP2`, battery voltage is delivered as measurement telemetry in decoded uplink output
- That battery voltage value is still not a real configurable or adjustable channel
- Battery voltage is not a configurable channel and must not appear as a `channel2` configuration target
- `adjustMeasuringRange('measurement', ...)` only applies to the real configurable measurement channel

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `measurement` | -312.5 | 312.5 | µε | Yes |
| `device temperature` | -45 | 110 | °C | No |

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

**Strain/force/mass channel:** The default range (-312.5 to 312.5) may not match your device. Check your device specifications or purchase documentation for the actual configured range and engineering unit.

**Device temperature:** This channel has a fixed range that cannot be adjusted (-45 to 110°C).

**Battery voltage:** In `TULIP2`, this is delivered in decoded measurement output, but it is still not part of the formal parser channel configuration.

### TULIP3 Identification Frames

For devices using TULIP3 protocol, identification messages (message type `20`/`0x14`, subtype `1`/`0x01`) report the actual configured channel unit and range.

**Example TULIP3 identification frame:**
```json
{
  "data": {
    "messageType": 20,
    "messageSubType": 1,
    "identification": {
      "sensor1": {
        "channel1": {
          "measurand": "Strain",
          "unit": "µeps",
          "minMeasureRange": -312.5,
          "maxMeasureRange": 312.5,
          "channelName": "measurement"
        }
      }
    }
  }
}
```

### TULIP2 Identification Frames

Identification messages (message type `7`/`0x07`) confirm the configured ranges:

**Example TULIP2 identification frame:**
```json
{
  "data": {
    "messageType": 7,
    "configurationId": 65,
    "deviceInformation": {
      "productIdName": "NETRIS_F",
      "measurementType": "relative",
      "measurementRangeStart": -312.5,
      "measurementRangeEnd": 312.5,
      "measurementRangeStartDeviceTemperature": -45.0,
      "measurementRangeEndDeviceTemperature": 110.0,
      "measurementUnit": 185,
      "unitName": "µeps",
      "deviceTemperatureUnit": 32,
      "deviceTemperatureUnitName": "°C"
    }
  }
}
```

---

## Quick Start

1. Check your device's actual measurement range from device specifications or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace values with your device's actual measurement range from specifications or identification frames
adjustMeasuringRange('measurement', { start: -312.5, end: 312.5 })
```
