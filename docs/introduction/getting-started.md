# Getting started

Try the parsers online on the [WIKA Toolbox](https://wika-group.github.io/iiot_toolbox/).

---

As mentioned in the [introduction](./index.md), the WIKA parsers are runtime-agnostic message interpreters written in TypeScript. They can be used in various environments, including LoRaWAN gateways, network servers, web applications, and server applications.

They parsers are written on a per-device basis, allowing for easy customization and extension. All supported devices are listed in the [Supported Devices](/devices/) section.

## LoRaWAN Gateways and Network Servers

The parsers are designed to be used in LoRaWAN gateways and network servers. They follow the [LoRaWAN® Payload Codec API Specification TS013-1.0.0](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api) and expose standard API functions.

### Default API

The parsers expose the following primary function by default:

- **`decodeUplink(input)`** - Decodes uplink messages from your devices

For spec-compliant gateways and network servers, you can use the parsers as-is without any modifications. Simply upload the parser and it will work immediately.

::: tip Adjusting Measuring Ranges
Always adjust the measuring ranges to match your specific sensor's data sheet. This can be done via the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox/) before downloading, or programmatically using `adjustMeasuringRange()`.
:::

### Non-Compliant Gateways/Network Servers

Some gateways or network servers may not fully comply with the LoRaWAN® Payload Codec API specification and expect different function names (e.g., `decode`, `Decode`, `decodePayload`). In these cases, you need to add a simple wrapper function at the bottom of your downloaded parser:

```javascript
// Example wrapper for non-compliant systems
function decode(input) {
    return decodeUplink(input)
}
```

Check your gateway or network server documentation to see which function name it expects.

### More Information

- See the [API Description](/users/api-description) for version-specific function details
- See the [Supported Devices](/devices/) section for device-specific information
- See the [Integration Guide](/users/integration) for detailed integration steps

You can download prebuilt parsers from the [Downloads](/users/downloads) page. The [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox/) allows you to configure and download parsers tailored to your specific devices.

## Web and Server Applications

The parsers are available as npm packages, which allows you to easily integrate them into your web or server applications.
This package is actually a wrapper around the raw parsers, providing a simplified interface and a few additional features.

You can install the package via npm and use the parsers to decode uplink messages and encode downlink messages in your application.

```bash
npm i @w2a-iiot/parsers
```

After installing the package, you can import the parsers and use them in your application. The parsers encapsulate the raw parsers and add some additional functionality, such as minifying downlink frames.

```typescript
import { NETRIS2Parser } from '@w2a-iiot/parsers'

const {
  decodeUplink,
  encodeDownlink,
  adjustRoundingDecimals
} = NETRIS2Parser()
```

From here on you can use the parsers functions to decode uplink messages and encode downlink messages. See [here](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples) for web and server examples.
