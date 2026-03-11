# NETRIS2 Parser Quick Start

## Parser API

All functions are pure. NETRIS2 does not support changing measuring ranges because both channels are fixed to 4-20 mA.

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

Both channels have fixed 4-20 mA ranges that cannot be adjusted.

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
// Will always throw for NETRIS2 because no channel supports range updates
function adjustMeasuringRange(
  channelName: AdjustableChannelName,
  range: {
    start: number
    end: number
  }
): void
```

NETRIS2 exposes the common parser API, but both current channels are fixed by the device and protocol. No range adjustment is required or supported.

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
    deviceAction: 'resetBatteryIndicator'
    configurationId?: number
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

Validates the input and encodes it into a single downlink frame.
If the documentation refers to percentage values, use the real-world current values. For NETRIS2, 20% within a 4-20 mA span corresponds to 7.2 mA because 0.2 multiplied by (20 minus 4), plus 4, equals 7.2.

To understand the input structure, refer to the [downlink schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/downlink.schema.json) and [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/examples.json).

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

To understand the input structure, refer to the [downlink schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/downlink.schema.json) and [downlink examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/NETRIS2/examples.json).

## About NETRIS2 Channels

**Note:** NETRIS2 has fixed 4-20 mA measurement ranges for both channels that cannot be adjusted. The device always reads electrical current in the 4-20 mA range. No configuration is required for measurement ranges.

If you need to verify the device configuration, check the identification frames after device activation.

### TULIP3 Identification Frames

For devices using TULIP3 protocol, the first uplinks after device activation can include identification messages (message type `20`/`0x14`) that report the actual configured measurands, units, and register-backed metadata for both channels.

- **Current channel 1**: Check `sensor1/channel1` for `measurand`, `unit`, and identification registers.
- **Current channel 2**: Check `sensor1/channel2` for `measurand`, `unit`, and identification registers.
- **Communication module**: Product, channel plan, firmware, and serial number are exposed on the communication module level.

**Example TULIP3 identification frame:**
```json
{
  "data": {
    "messageType": 20,
    "messageSubType": 1,
    "identification": {
      "sensor1": {
        "channel1": {
          "measurand": "Current",
          "unit": "mA",
          "minMeasureRange": 4,
          "maxMeasureRange": 20,
          "channelName": "Electrical current1"
        },
        "channel2": {
          "measurand": "Current",
          "unit": "mA",
          "minMeasureRange": 4,
          "maxMeasureRange": 20,
          "channelName": "Electrical current2"
        }
      }
    }
  }
}
```

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

1. No measurement range configuration is needed because both channels are fixed to 4-20 mA.
2. Add a wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`
3. Use `protocol: 'TULIP2'` or `protocol: 'TULIP3'` when encoding downlinks.
4. Refer to the schema and examples for the exact downlink structure.
