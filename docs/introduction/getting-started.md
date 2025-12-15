# Getting started

Try the parsers online on the [WIKA Toolbox](https://wika-group.github.io/iiot_toolbox/).

---

As mentioned in the [introduction](./index.md), the WIKA parsers are runtime-agnostic message interpreters written in TypeScript. They can be used in various environments, including LoRaWAN gateways, network servers, web applications, and server applications.

They parsers are written on a per-device basis, allowing for easy customization and extension. All supported devices are listed in the [Supported Devices](/devices/) section.

## LoRaWAN Gateways and Network Servers

The parsers are also designed to be used in LoRaWAN gateways and network servers. They follow the [LoRaWAN® Payload Codec API Specification TS013-1.0.0](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api) and provide the necessary functions to decode uplink messages and encode downlink messages.

You can download prebuilt parsers from the [Downloads](/users/downloads) page. The [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox/) allows you to configure and download parsers tailored to your specific devices. After you have downloaded your parser, go to the documentation of your gateway or network server to learn where and how to integrate the parser.

For most common network servers, such as The Things Network (TTN), ChirpStack or Loriot, you can find specific examples in the [Networkserver Integration](/users/integration) guide.

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
