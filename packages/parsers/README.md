# @w2a-iiot/raw-javascript-parsers

This packages contain the raw built javascript parsers for WIKA's IIoT devices.

These are intended to be used in the WIKA toolbox and are not intended to be used as standalone packages.

If you are looking for a way to include javascript parsers in your project, please refer to the `@w2a-iiot/parsers` package or the [documentation](https://wika-group.github.io/javascript_parsers/).

<!-- #region devices-and-apis -->
## Supported Devices and Versions

> **All devices now use the modern `4.x.x` architecture.** The `2.x.x` and `3.x.x` parser generations are no longer shipped.

| Device                                    | Current | Previous |
|-------------------------------------------|:-------:|:--------:|
| A2G                                       | `4.x.x` | `2.x.x`  |
| F98W6                                     | `4.x.x` | `2.x.x`  |
| GD20W                                     | `4.x.x` | `2.x.x`  |
| PGW23                                     | `4.x.x` | `2.x.x`  |
| NETRIS2                                   | `4.x.x` | `3.x.x`  |
| NETRIS1                                   | `4.x.x` | `2.x.x`  |
| NETRIS3 family (FLRU, PEU, PGU, TGU, TRU) | `4.x.x` | `2.x.x`  |
| TRW                                       | `4.x.x` | `2.x.x`  |
| PEW                                       | `4.x.x` | `2.x.x`  |

## Version 4.x.x (Current)

The parser is built on the codec abstraction layer and can host multiple codecs at once. Each codec ships with default measuring ranges, but you should always tune them for the concrete probe you deploy.

> **Breaking Change in 4.4.0**: The `encodeDownlink` and `encodeMultipleDownlinks` functions now use `protocol` instead of `codec` to select the encoder. Update your code from `{ codec: 'name', input: ... }` to `{ protocol: 'TULIP3', input: ... }`. Codecs export protocol constants (e.g., `TULIP3_PROTOCOL`) to prevent typos and provide IDE autocomplete.

- **`decodeUplink(input: { bytes: number[], fPort: number, recvTime?: string })`**:<br>
    Validates `bytes`, `fPort`, and optional `recvTime` before selecting the matching codec and decoding measurements or status messages. Returns a typed `data` payload for the chosen codec or an `errors` array when decoding fails.
- **`decodeHexUplink(input: { bytes: string; fPort: number; recvTime?: string })`**:<br>
    Accepts hexadecimal payloads, converts them to integer arrays, and delegates to `decodeUplink`. Useful when integrations provide the payload as hex rather than raw byte arrays.
- **`encodeDownlink(input: { protocol: string; input: unknown })`**:<br>
    Looks up the codec matching the requested `protocol` (e.g., `'TULIP2'`, `'TULIP3'`) and runs its encoder. On success it returns the downlink frame as an array of 8-bit integers. If no codec with that protocol is found or encoding is unsupported, an error with detailed information is returned in the `errors` field. Only outputs a single frame.
- **`encodeMultipleDownlinks(input: { protocol: string; input: unknown })`**:<br>
    Essentially the same as `encodeDownlink` but outputs one or more frames depending on the codec’s capabilities and the requested action. Uses a byteLimit input to determine how many frames to generate when the action requires multiple frames and how they should be split. The input is specified per device in the device documentation.
- **`adjustMeasuringRange(channelName: string, range: { start: number; end: number })`**:<br>
    Updates the measuring range for the named channel across every registered codec, enabling runtime calibration without rebuilding the bundle. Use this right after instantiating the parser to align the default ranges with your sensor’s data sheet. If the channel is unknown or flagged as non-adjustable because the range is fixed by hardware or protocol rules (for example internal device temperature), an error is thrown.
- **`adjustRoundingDecimals(decimals: number)`**:<br>
    Normalizes the requested precision, then applies it to all codecs so numeric outputs round consistently.

## Version 3.x.x (Legacy)

> **Note:** NETRIS2 has been migrated to `4.x.x`. The information below is preserved to help users migrate from `3.x.x`.

The parser was written in TypeScript and shipped as a function that returned the helpers below.

- **`decodeUplink(input: { bytes: number[], fPort: number, recvTime?: string })`**:<br>
    Performed schema validation on the uplink structure, inspected the message type byte, and decoded measurements, process alarms, technical alarms, configuration status, identification, or keep-alive frames.
- **`decodeHexUplink(input: { bytes: string; fPort: number; recvTime?: string })`**:<br>
   Ensured the `bytes` field was a valid hexadecimal string, converted it to an integer array, and forwarded the request to `decodeUplink`.
- **`encodeDownlink(input: DownlinkInput): number[]`**:<br>
    Accepted one of the typed `NETRIS2` actions (factory reset, battery reset, channel disable, main configuration update, process alarm configuration, measurement offset, or start-up time). Returned the downlink frame as an array of 8-bit integers on success or threw an exception when validation failed.
- **`adjustRoundingDecimals(decimals: number)`**:<br>
    Overrode the default rounding precision used when presenting channel values.

## Version 2.x.x (Legacy)

> **Note:** A2G, F98W6, GD20W, and PGW23 have been migrated to `4.x.x`. The information below is preserved to help users migrate from `2.x.x`.

The parser was delivered as a single JavaScript file that manipulated global measurement ranges. Before the decoding helpers could be used you had to edit the top-level variables (for example `FORCE_RANGE_START`, `FORCE_RANGE_END`, `DEVICE_TEMPERATURE_RANGE_START`, `DEVICE_TEMPERATURE_RANGE_END`) so they reflected the sensor-specific measuring span published in the device documentation.

- **`decodeUplink(input: { bytes: number[]; fPort: number; recvTime?: Date })`**:<br>
    Decodes strain, device temperature, and battery voltage readings when the measurement ranges are defined. Populates the `data` object with the scaled values or records parsing errors in `errors`.
- **`decodeHexString(fPort: number, hexEncodedString: string)`**:<br>
    Converts a hex string to bytes and then runs `decodeUplink`.
- **`decodeBase64String(fPort: number, base64EncodedString: string)`**:<br>
    Converts a Base64 string to bytes before delegating to `decodeUplink`.

All APIs above emit their results as plain JavaScript objects that can be consumed directly by gateways, network servers, or custom applications.
<!-- #endregion devices-and-apis -->
