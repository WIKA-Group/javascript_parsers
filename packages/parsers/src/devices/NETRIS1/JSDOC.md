# NETRIS1 Parser Quick Start

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS1/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS1/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'measurement'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = 'measurement'
```

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `measurement` | 0 | 10 | °C/°F/V/mA/% | Yes |

*Unit and range depend on device configuration. Check device specifications or identification frames for actual unit and range.

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
type DownlinkInput = {
  protocol: 'TULIP2'
  input: {
    deviceAction: 'configuration'
    // Configuration fields...
  } | {
    deviceAction: 'resetToFactory'
  } | {
    deviceAction: 'resetBatteryIndicator'
    configurationId?: number
  } | {
    deviceAction: 'getConfiguration'
    mainConfiguration?: true
    channel0?: true | { alarms?: true }
  }
} | {
  protocol: 'TULIP3'
  input: {
    action: 'readRegisters'
    // Read register fields...
  } | {
    action: 'writeRegisters'
    // Write register fields...
  } | {
    action: 'forceCloseSession'
  } | {
    action: 'restoreDefaultConfiguration'
  } | {
    action: 'newBatteryInserted'
  } | {
    action: 'getAlarmStatus'
    // Alarm status fields...
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
If the documentation refers to percentage values, use the real world values. (e.g. 20% deadband with 0-10 range is 2 (0.2 * 10)).

To understand the input structure, refer to the [downlink schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS1/downlink.schema.json) and [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS1/examples.json).

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

To understand the input structure, refer to the [downlink schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS1/downlink.schema.json) and [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS1/examples.json).

## Verifying Measurement Ranges

**Critical:** The default measurement range (0-10) is a placeholder and likely does not match your device. NETRIS1 devices are highly configurable and support various sensor types (temperature, current, voltage, resistance). Always verify the actual range and unit from one of these sources:

1. **Device specifications** from your purchase order or datasheet
2. **Identification frames** sent by the device after activation

Using incorrect ranges will result in incorrect measurement values in all data messages.

### TULIP3 Identification Frames

For devices using TULIP3 protocol, the first uplinks after device activation include identification messages (message type `20`/`0x14`, subtype `1`/`0x01`) that report the actual measurement configuration:

**Example TULIP3 identification frame:**
```json
{
  "data": {
    "messageType": 20,
    "messageSubType": 1,
    "identification": {
      "sensor1": {
        "channel1": {
          "measurand": "Temperature",
          "unit": "°C",
          "minMeasureRange": -40,
          "maxMeasureRange": 85,
          "channelName": "measurement"
        }
      }
    }
  }
}
```

### TULIP2 Identification Frames

For devices using TULIP2 protocol, identification messages (message type `6`/`0x06`) report similar information:

**Example TULIP2 identification frame:**
```json
{
  "data": {
    "messageType": 6,
    "configurationId": 1,
    "productIdName": "NETRIS1",
    "channels": [
      {
        "channelId": 0,
        "channelName": "measurement",
        "measurand": "Temperature",
        "measurementRangeStart": -40,
        "measurementRangeEnd": 85
      }
    ]
  }
}
```

---

## Quick Start

1. Check your device's actual measurement range and unit from purchase configuration, device specifications, or identification frames (see above)
2. Add configuration code below at the bottom of your parser file
3. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`

**Configuration code** (add at bottom of parser file):

```ts
// Replace values with your device's actual measurement range from specifications or identification frames
setMeasurementRanges('measurement', { start: -40, end: 85 })
```
