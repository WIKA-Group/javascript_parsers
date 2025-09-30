# Node-RED Integration

This guide explains how to use WIKA parsers inside a Node-RED flow regardless of parser generation (legacy formats or newer unified ones). Instead of prescribing a single function call, it points you to the stable, device‑specific APIs exposed by each parser.

## When to Use Node-RED

Use Node-RED if you want a visual workflow that:

1. Receives raw (often Base64 / hex) uplink payloads from a network server or gateway.
2. Decodes them into structured telemetry using a WIKA parser.
3. Routes, enriches, stores or visualizes the decoded data.

## Typical Flow

```
[Ingress (MQTT / HTTP / LoRaWAN)]
   → [(optional) Filter / Switch]
   → [Function (runs WIKA parser)]
   → [Debug / Dashboard / Storage]
```

![Node-Red Flow](/Node-Red-Flow.png)

## Obtaining a Parser

Choose the approach that best fits your Node-RED deployment model:

1. Prebuilt single‑file parser from Releases:

   Go to the project [Releases](https://github.com/WIKA-Group/javascript_parsers/releases) and download the device‑specific JavaScript file (or bundled archive). This is ideal when you cannot install npm packages in the Node-RED environment (e.g. locked appliance / hosted service). Paste the file contents into a Function node. The decoding helpers (`decodeUplink`, `decodeHexUplink`, `decodeBase64Uplink`, and any documented setters like `adjustRoundingDecimals`) are registered globally.

2. Preconfigure & export via IIoT Toolbox:

   Use the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) to select your device, set measurement ranges, rounding, or other available options, test sample payloads, then export the already tailored parser file. This avoids manual editing inside Node-RED later. Like the prebuilt release files, the toolbox export places the same decoding helper functions globally.

3. NPM package integration ([`@w2a-iiot/parsers`](https://www.npmjs.com/package/@w2a-iiot/parsers)):

   Recommended if you control the filesystem (e.g. local install, Docker image you build, or a self‑managed server). Install the package in the Node-RED user directory and `import` it inside Function nodes. This is the most maintainable route when you handle multiple devices or want version pinning via `package.json`.

Environment note: For option 3 your Node-RED runtime must allow installing dependencies (e.g. `~/.node-red` or project mode). If you are using a managed/hosted platform without shell access, prefer options 1 or 2.

See the [devices overview](/devices/#npm-module-inclusion) for the exact factory function name. Only those factories listed in the documentation are considered supported.

> Distribution difference summary:
> - Releases / IIoT Toolbox export (options 1 & 2): Only decoding (and possible encoding / config) helper functions are provided globally (`decodeUplink`, `decodeHexUplink`, `decodeBase64Uplink`, `encodeDownlink` if supported, plus documented setters). There is NO factory function to instantiate, just call the helpers directly.
> - NPM module (option 3): No global helpers are injected. You must import a factory (e.g. `import { NETRIS2Parser } from '@w2a-iiot/parsers'`), create a parser instance, then call instance methods: `parser.decodeUplink(...)`.

## Available APIs (Superset)

Depending on the device and feature maturity, a parser instance may expose some or all of:

- `decodeUplink(input)`: Primary uplink decoder (LoRaWAN specification style object `{ fPort, bytes | data }`).
- `encodeDownlink(input)`: (If supported) Builds a downlink frame.
- `decodeHexString(fPort, hex)` / `decodeBase64String(fPort, b64)`: Convenience helpers for raw payload strings.
- `adjustRoundingDecimals(n)`: (If available) Adjusts rounding of numeric outputs.
- `setMeasurementRanges(start, end)`: (If the device has configurable measurement ranges).

Refer to the specific device documentation for which of these apply. If a method isn’t listed there, treat it as unsupported for that device.

> API Variability (Important): The exact set of helpers and even subtle input expectations can differ significantly between devices right now because parsers originate from different generation waves. For example:
> - Some legacy devices expose only `decodeUplink` and `decodeHexUplink` while newer ones also provide `decodeBase64Uplink` or `encodeDownlink`.
> - A few older helpers may expect slightly different input object shapes or omit convenience wrappers available on newer devices.
> - Optional configuration setters (`adjustRoundingDecimals`, `setMeasurementRanges`, etc.) are not universally present.
>
> A consolidation effort is underway to align all devices behind a uniform API surface; until that ships, ALWAYS confirm the currently supported functions and accepted input forms on the device’s own page in the devices overview (`/devices/`). If something is not documented there, plan as if it is not supported for that device.
>
> When a new major or feature release changes any of these APIs, consult the [Migration Guide](/users/migration-guide) which highlights breaking changes, renamed helpers, input/shape adjustments and recommended upgrade paths.

## Designing the Function Node

Within a Function node you usually:

1. Load / cache a parser instance (avoid recreating on every message if possible).
2. Normalize the incoming payload to one of: raw bytes array, hex string, Base64 string, or a LoRaWAN style object.
3. Call the most appropriate API:
    - If you already have the LoRaWAN metadata (`fPort`, raw bytes array): use `decodeUplink`.
    - If the network server only supplies a Base64 string: use `decodeBase64String(fPort, base64)`.
    - If only a hex string is provided: use `decodeHexString(fPort, hex)`.
4. Attach the decoded object to `msg.payload` (or another property) and return the message.

### Minimal Example (Prebuilt / IIoT Toolbox Variant)

```javascript
// Using a prebuilt or toolbox-exported single file parser where helpers are global.
// No import; call decodeUplink (or decodeHexUplink / decodeBase64Uplink) directly.
// Prebuilt or IIoT Toolbox code pasted here...

const decoded = decodeUplink({ fPort: msg.fPort, bytes: msg.bytes })
msg.payload = decoded
return msg
```

### Minimal Example (NPM Variant)

```javascript
// This code runs inside a Node-RED Function node.
// Install the package externally (e.g. in your Node-RED userDir) then use modern ESM import.
// (Node-RED 3+ can load external modules; ensure functionExternalModules is enabled. If your runtime
// does not allow 'import', fall back to the bundled single-file parser approach.)

import { NETRIS2Parser } from '@w2a-iiot/parsers'

let parser = global.get('wika_netris2_parser')
if (!parser) {
   parser = NETRIS2Parser()
   // Optional device-specific adjustments, only if documented:
   // parser.setMeasurementRanges(0, 100)
   global.set('wika_netris2_parser', parser)
}

// Assume msg contains: msg.fPort and msg.payloadRaw (Base64 from network server)
const decoded = parser.decodeBase64String(msg.fPort, msg.payloadRaw)
msg.payload = decoded
return msg
```

Choose the decoding helper (`decodeUplink`, `decodeHexUplink`, `decodeBase64Uplink` in prebuilt form OR `parser.decodeUplink`, etc. in the npm form) based on the format you actually receive. Avoid converting formats unnecessarily.

## Handling Multiple Devices

When flows process different device types (NPM module scenario):

1. Detect the device (DevEUI / application tag / topic segment).
2. Maintain a parser map keyed by an identifier.
3. Instantiate missing parsers on demand.

```javascript
// Import all parser factories you expect to use.
import { NETRIS2Parser, A2GParser } from '@w2a-iiot/parsers'

let parsers = global.get('wika_parsers') || {}
function getParser(kind) {
   if (!parsers[kind]) {
      const factory = {
         netris2: NETRIS2Parser,
         a2g: A2GParser,
         // add others as needed
      }[kind]
      if (!factory) throw new Error('Unsupported device type: ' + kind)
      parsers[kind] = factory()
   }
   return parsers[kind]
}
global.set('wika_parsers', parsers)

const kind = msg.deviceType // populate earlier in the flow
const parser = getParser(kind)
msg.payload = parser.decodeBase64String(msg.fPort, msg.base64)
return msg
```

Prebuilt (single-file) scenario with multiple devices: create one Function node per device and paste the corresponding single-file parser into each, or combine files if you accept the maintenance overhead, names do not clash as long as you do not rename helpers, but keeping them separated improves clarity.

## Configuration & Ranges

Some devices expose configuration setters (e.g. measurement ranges). Only call them if listed in that device’s documentation. Store adjusted instances in context/global so you don’t repeat configuration for every message.

## Downlinks

If a device supports `encodeDownlink`, create a separate Function node for building commands. Supply the documented input structure. If not documented, the device likely does not (yet) support downlink encoding.

## Best Practices

- Reuse parser instances (store in `context` / `global`).
- Keep device‑specific logic close to where you select the parser, not scattered in downstream nodes.
- Treat undocumented methods as internal; rely only on those listed in device + API reference docs.

## Further Reference

See:

- Device documentation pages (feature availability, configuration notes).
- API Reference for detailed parameter and return shapes.
- Network server integration guides if you need to adapt ingress formats.

![Node-Red Flow Output](/Node-Red-Flow-Output.png)

By following this pattern you can integrate any current or future WIKA parser version without rewriting the Node-RED flow, only the npm factory usage (when you choose the package route) and the set of helper functions exposed per device vary.
