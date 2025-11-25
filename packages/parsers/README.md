# @w2a-iiot/raw-javascript-parsers

This packages contain the raw built javascript parsers for WIKA's IIoT devices.

These are intended to be used in the WIKA toolbox and are not intended to be used as standalone packages.

If you are looking for a way to include javascript parsers in your project, please refer to the `@w2a-iiot/parsers` package or the [documentation](https://wika-group.github.io/javascript_parsers/).

<!-- #region devices-and-apis -->
## Supported Devices and Versions
<!-- #region devices-versions-table -->
| Parser generation       | Version | Devices                                                                           |
|-------------------------|---------|-----------------------------------------------------------------------------------|
| Modern modular          | `4.x.x` | PEW, NETRIS1, NETRIS3 family (FLRU, PEU, PGU, TGU, TRU), TRW, Netris2             |
| Transitional TypeScript | `3.x.x` | - (previously NETRIS2)                                                            |
| Legacy JavaScript       | `2.x.x` | A2G, F98W6, GD20W, PGW23                                                          |
<!-- #endregion devices-versions-table -->

## Version 4.x.x

The parser is built on the codec abstraction layer and can host multiple codecs at once. Each codec ships with default measuring ranges, but you should always tune them for the concrete probe you deploy.

- **`decodeUplink(input: { bytes: number[], fPort: number, recvTime?: string })`**:<br>
    Validates `bytes`, `fPort`, and optional `recvTime` before selecting the matching codec and decoding measurements or status messages. Returns a typed `data` payload for the chosen codec or an `errors` array when decoding fails.
- **`decodeHexUplink(input: { bytes: string; fPort: number; recvTime?: string })`**:<br>
    Accepts hexadecimal payloads, converts them to integer arrays, and delegates to `decodeUplink`. Useful when integrations provide the payload as hex rather than raw byte arrays.
- **`encodeDownlink(input: { codec: string; input: unknown })`**:<br>
    Looks up the requested codec and runs its encoder. On success it returns the downlink frame as an array of 8-bit integers. If the codec is missing or encoding is unsupported an exception is thrown. Only outputs a single frame.
- **`encodeMultipleDownlinks(inputs: { codec: string; input: unknown })`**:<br>
    Essentially the same as `encodeDownlink` but outputs one or more frames depending on the codec’s capabilities and the requested action. Uses a byteLimit input to determine how many frames to generate when the action requires multiple frames and how they should be split. The input is specified per device in the device documentation.
- **`adjustMeasuringRange(channelName: string, range: { start: number; end: number })`**:<br>
    Updates the measuring range for the named channel across every registered codec, enabling runtime calibration without rebuilding the bundle. Use this right after instantiating the parser to align the default ranges with your sensor’s data sheet. If the channel is unknown or flagged as non-adjustable because the range is fixed by hardware or protocol rules (for example internal device temperature), an error is thrown.
- **`adjustRoundingDecimals(decimals: number)`**:<br>
    Normalizes the requested precision, then applies it to all codecs so numeric outputs round consistently.

## Version 3.x.x

Previously, the `NETRIS2` device used this format. It has now been migrated to `4.x.x`.
The parser is written in TypeScript and ships as a function that returns the helpers below.

- **`decodeUplink(input: { bytes: number[], fPort: number, recvTime?: string })`**:<br>
    Performs schema validation on the uplink structure, inspects the message type byte, and decodes measurements, process alarms, technical alarms, configuration status, identification, or keep-alive frames.
- **`decodeHexUplink(input: { bytes: string; fPort: number; recvTime?: string })`**:<br>
   Ensures the `bytes` field is a valid hexadecimal string, converts it to an integer array, and forwards the request to `decodeUplink`.
- **`encodeDownlink(input: DownlinkInput): number[]`**:<br>
    Accepts one of the typed `NETRIS2` actions (factory reset, battery reset, channel disable, main configuration update, process alarm configuration, measurement offset, or start-up time). Returns the downlink frame as an array of 8-bit integers on success or throws an exception when validation fails. Input varies based on the device.
- **`adjustRoundingDecimals(decimals: number)`**:<br>
    Overrides the default rounding precision used when presenting channel values.

## Version 2.x.x

The parser is delivered as a single JavaScript file that manipulates global measurement ranges. Before the decoding helpers can be used you must edit the top-level variables (for example `FORCE_RANGE_START`, `FORCE_RANGE_END`, `DEVICE_TEMPERATURE_RANGE_START`, `DEVICE_TEMPERATURE_RANGE_END`) so they reflect the sensor-specific measuring span published in the device documentation.

- **`decodeUplink(input: { bytes: number[]; fPort: number; recvTime?: Date })`**:<br>
    Decodes strain, device temperature, and battery voltage readings when the measurement ranges are defined. Populates the `data` object with the scaled values or records parsing errors in `errors`.
- **`decodeHexString(fPort: number, hexEncodedString: string)`**:<br>
    Converts a hex string to bytes and then runs `decodeUplink`.
- **`decodeBase64String(fPort: number, base64EncodedString: string)`**:<br>
    Converts a Base64 string to bytes before delegating to `decodeUplink`.

All APIs above emit their results as plain JavaScript objects that can be consumed directly by gateways, network servers, or custom applications.
<!-- #endregion devices-and-apis -->
