# A2G Parser Quick Start

## Parser API

All functions are pure (no global mutation) except `adjustMeasuringRange`, which updates internal range configuration for subsequent decodes.

### Types

Input types:
```ts
interface UplinkInput {
  fPort: number // LoRaWAN FPort
  bytes: number[] // Raw payload as array of unsigned bytes (0-255)
  recvTime?: string // Optional ISO timestamp from your LNS
}

interface HexUplinkInput {
  fPort: number // LoRaWAN FPort
  bytes: string // Hex-encoded payload (case-insensitive, even length)
  recvTime?: string // Optional ISO timestamp from your LNS
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

To understand the `data` field, review the [examples](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/A2G/examples.json) and the [schema definition](https://github.com/WIKA-Group/javascript_parsers/blob/main/packages/parsers/src/devices/A2G/uplink.schema.json).

Supported `channels` to identify different sensors by:
```ts
// Is used in the returned data
type ChannelName = 'pressure' | 'flow' | 'input_1' | 'input_2' | 'input_3' | 'input_4' | 'relay_status_1' | 'relay_status_2'
```

**Channel Configuration:**

| Channel Name | Default Min | Default Max | Unit | Configurable |
|--------------|-------------|-------------|------|-------------|
| `pressure` | 0 | 100 | % | No |
| `flow` | 0 | 100 | % | No |
| `input_1` | 0 | 100 | % | No |
| `input_2` | 0 | 100 | % | No |
| `input_3` | 0 | 100 | % | No |
| `input_4` | 0 | 1 | - | No |
| `relay_status_1` | 0 | 1 | - | No |
| `relay_status_2` | 0 | 1 | - | No |

*All channels have fixed ranges that cannot be adjusted.

### `decodeUplink(input)`
```ts
function decodeUplink(input: UplinkInput): Result
```

### `decodeHexString(hexInput)`
```ts
function decodeHexString(hexInput: HexUplinkInput): DecodeResult
```
`bytes` must have even length; case-insensitive.

### `adjustRoundingDecimals(decimals)`
```ts
// Smartly adjust number of decimals for rounded values
// Impacts all numeric values in all outputs
// Default is 4
function adjustRoundingDecimals(decimals: number): void
```
Applies to future decodes only.

## About A2G Channels

**Note:** A2G has fixed measurement ranges for all channels that cannot be adjusted. The device reads 8 different inputs with predefined ranges. No measurement range configuration is required.

---

## Quick Start

1. No measurement range configuration needed (all channels have fixed ranges)
2. Add wrapper function if your network server is non-compliant: `function decode(input) { return decodeUplink(input) }`
