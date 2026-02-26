# PGW23.100.11 Parser Quick Start

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/PGW23_100_11/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/PGW23_100_11/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'pressure' | 'device temperature' | 'battery voltage'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'pressure'
```

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `pressure` | 0 | 10 | bar/psi/MPa | Yes |
| `device temperature` | -40 | 60 | °C/°F | No |
| `battery voltage` | 0 | 5 | V | No |

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

### `encodeDownlink(input)`
```ts
interface DownlinkInput {
  protocol: 'TULIP2'
  input: {
    deviceAction: 'configuration'
    configurationId?: number
    byteLimit?: number
    mainConfiguration?: {
      measuringRate: number
      publicationFactorWhenNoAlarm: number
      publicationFactorWhenAlarm: number
    }
    channel0?: false | true | {
      alarms?: {
        deadBand: number
        lowThreshold?: number
        highThreshold?: number
        lowThresholdWithDelay?: { value: number, delay: number }
        highThresholdWithDelay?: { value: number, delay: number }
        risingSlope?: number
        fallingSlope?: number
      }
    }
    channel1?: false | true
  } | {
    deviceAction: 'resetToFactory'
  } | {
    deviceAction: 'resetBatteryIndicator'
    configurationId?: number
  }
}

// encode a single downlink frame
function encodeDownlink(input: DownlinkInput): {
  bytes: number[] // Encoded downlink payload as array of unsigned bytes (0-255)
  fPort: number // LoRaWAN FPort to use
  warnings?: string[] // Non-fatal anomalies
} | {
  errors: string[] // Fatal or structural issues only
}
```

Validates the input and encodes it into a single downlink frame. It uses the same range configuration as used for decoding.
If the documentation refers to percentage values, use the real world values. (e.g. 20% deadband with 0-10 bar range is 2 bar (0.2 * 10)).

To understand the input structure, refer to the [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/PGW23_100_11/examples.json).

### `encodeMultipleDownlinks(input)`
```ts
// Same input type as encodeDownlink()
// encodes the given configuration in one or more downlink frames depending on byte size
function encodeMultipleDownlinks(
  input: DownlinkInput
): {
  frames: number[][] // Encoded downlink payloads as arrays of unsigned bytes (0-255)
  fPort: number // LoRaWAN FPort to use
  warnings?: string[] // Non-fatal anomalies
} | {
  errors: string[] // Fatal or structural issues only
}
```

To understand the input structure, refer to the [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/PGW23_100_11/examples.json).

## Verifying Measurement Ranges

**Critical:** The default pressure range may not match your device. Always verify the actual range from one of these sources:

1. **Device specifications** from your purchase order or datasheet
2. **Identification frames** sent by the device

Using incorrect ranges will result in incorrect measurement values in all data messages.

### TULIP2 Identification Frames

For this device, identification messages (message type `7`/`0x07`) report pressure and device temperature ranges:

**Example TULIP2 identification frame:**

```json
{
  "data": {
    "messageType": 7,
    "configurationId": 1,
    "deviceInformation": {
      "measurementRangeStartPressure": 0,
      "measurementRangeEndPressure": 10,
      "measurementRangeStartDeviceTemperature": -40,
      "measurementRangeEndDeviceTemperature": 60,
      "pressureUnitName": "bar",
      "deviceTemperatureUnitName": "°C"
    }
  }
}
```

Use the pressure range values to configure the parser before decoding and encoding TULIP2 values.

---

## Quick Start

1. Check your device's actual pressure range from purchase configuration, device specifications, or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: e.g. `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace 0 and 10 with your device's actual pressure range
setMeasurementRanges('pressure', { start: 0, end: 10 })
```
