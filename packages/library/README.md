# @w2a-iiot/parsers

Javascript parsers for WIKA's IIoT devices.
Can be used on the server or in the browser.

For more information about the parsers, please visit the [documentation](https://wika-group.github.io/javascript_parsers/).

## Installation

You can install the package using npm:

```bash
npm install @w2a-iiot/parsers
```

## Usage

```typescript
import { NETRIS2Parser, PEWParser } from '@w2a-iiot/parsers'

// creates a Netris2 parser instance
const parser = NETRIS2Parser()

// creates a PEW parser instance (supports uplink + downlink for TULIP2/TULIP3)
const pewParser = PEWParser()

// decodes the uplink message
const data = parser.decodeUplink({/** ... */})

// encodes a PEW downlink message
const downlink = pewParser.encodeDownlink({
  protocol: 'TULIP3',
  input: {
    action: 'getAlarmStatus',
    input: {
      processAlarmRequested: true,
      cmAlarmRequested: true,
    },
  },
})
```
## Included devices

<!-- #region devices-table -->
The following list shows whether a device is included in the package.
| Device       | Included | Factory function |
|--------------|:--------:| :----------------:|
|A2G           |    ❌    |  ❌  |
|F98W6         |    ❌    |  ❌  |
|GD20W         |    ❌    |  ❌  |
|NETRIS1       |    ❌    |  ❌  |
|NETRIS2       |    ✔️    |    `NETRIS2Parser` |
|FLRU+NETRIS3  |    ❌    |  ❌  |
|PEU+NETRIS3   |    ❌    |  ❌  |
|PGU+NETRIS3   |    ❌    |  ❌  |
|TGU+NETRIS3   |    ❌    |  ❌  |
|PEW           |    ✔️    |    `PEWParser` |
|PEW           |    ✔️    |  `PEWParser`  |
|PGW23         |    ❌    |  ❌  |
|TRW           |    ❌    |  ❌  |
<!-- #endregion devices-table -->

## API Reference

The API provided by the parsers here differs from the prebuilt scripts in the way the encoding works.
While for LoRaWAN codec specification compatibility, only a single downlink can be returned, the parsers here can return multiple downlinks for a single input. They also optimize the downlinks to be as short as possible and merge multiple configuration changes into a single downlink where possible.
