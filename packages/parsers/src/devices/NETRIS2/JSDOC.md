# NETRIS2 Parser Quick Start

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

To understand the data field, take a look at the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'Electrical current1' | 'Electrical current2'
```
Channels that support adjusting the measurement range:
```ts
type AdjustableChannelName = never // No adjustable channels in NETRIS2
```

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `Electrical current1` | 4 | 20 | mA | No |
| `Electrical current2` | 4 | 20 | mA | No |

*Both channels have fixed 4-20 mA ranges that cannot be adjusted.

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
  codec: 'NETRIS2TULIP2'
  input: ConfigurationInput | ResetInput | ResetBatteryInput
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
If the documentation refers to percentage values, use the real world values. (e.g. 20% for threshold with 4-20mA range is 7.2mA (0.2 * (20-4) + 4)).

To understand the input structure, refer to the [downlink schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/downlink.schema.json) and [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/examples.json).

### `encodeMultipleDownlinks(input)`
```ts
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

To understand the input structure, refer to the [downlink schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/downlink.schema.json) and [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/examples.json).

## About NETRIS2 Channels

**Note:** NETRIS2 has fixed 4-20 mA measurement ranges for both channels that cannot be adjusted. The device always reads electrical current in the 4-20 mA range. No configuration is required for measurement ranges.

If you need to verify the device configuration, check the identification frames after device activation.

### TULIP2 Identification Frames

Identification messages (message type `6`/`0x06`) confirm the configured channels:

**Example TULIP2 identification frame:**
```json
{
  "data": {
    "messageType": 6,
    "configurationId": 1,
    "productIdName": "NETRIS2",
    "channels": [
      {
        "channelId": 0,
        "channelName": "Electrical current1"
      },
      {
        "channelId": 1,
        "channelName": "Electrical current2"
      }
    ]
  }
}
```

---

## Quick Start

1. No measurement range configuration needed (fixed 4-20 mA)
2. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`
3. For downlink configuration, refer to the downlink schema documentation above
