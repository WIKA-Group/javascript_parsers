![WIKA](assets/logo_wika.png "WIKA")

# Welcome to the WIKA LPWAN device parser monorepo

This repository ['javascript_parsers'](https://github.com/WIKA-Group/javascript_parsers) contains the JavaScript parser for our LPWAN devices:

* [A2G](./packages/parsers/src/A2G/)
* [F98W6](./packages/parsers/src/F98W6/)
* [GD20W](./packages/parsers/src/GD20W/)
* [NETRIS1](./packages/parsers/src/NETRIS1/)
* [NETRIS2](./packages/parsers/src/NETRIS2/)
* [FLRU+NETRIS3](./packages/parsers/src/FLRU_NETRIS3/)
* [PEU+NETRIS3](./packages/parsers/src/PEU_NETRIS3/)
* [PGU+NETRIS3](./packages/parsers/src/PGU_NETRIS3/)
* [TGU+NETRIS3](./packages/parsers/src/TGU_NETRIS3/)
* [TRU+NETRIS3](./packages/parsers/src/TRU_NETRIS3/)
* [PEW](./packages/parsers/src/PEW/)
* [PGW23](./packages/parsers/src/PGW23_100_11/)
* [TRW](./packages/parsers/src/TRW/)

The JavaScript parser converts the raw byte payload of our devices into a JavaScript object (defined in the uplink.schema.json file).
The parser for building the raw byte downlink payloads are available for some devices as well and are defined in the downlink.schema.json file.

All our JavaScript parser scripts follow the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.

## Release Structure

To make the parsers easily accessible for usage in gateways and network server, a zip file is generated which contains all the parsers and the required files to use them.
The zip file is generated by the build process and can be found in the release folder of the repository.
All supported devices are included in the zip file. The zip file contains a folder for each device with the following structure:

```bash
zip
├── <device name directory>
│   ├── downlink.schema.json    # contains the downlink object specification (only for some devices)
│   ├── driver.yaml             # contains some meta information
│   ├── examples.json           # contains some input and output payload examples for unit testing
│   ├── index.js                # contains source code of the payload parser
│   ├── metadata.json           # contains some meta information about the parser
│   ├── uplink.json             # contains a complete object example
│   ├── uplink.schema.json      # contains the output object specification
│   └── README.md               # contains information about the sensor
└── ...other devices
```

## Usage

### Usage in a project

Some of the parsers are available as npm packages. To use them, you can install the package via npm and use the parser in your project.

```bash
npm i @w2a-iiot/parsers
```

Afterwards the can be used in your project.

```typescript
import { NETRIS2Parser } from '@w2a-iiot/parsers'

const {
  decodeUplink,
  encodeDownlink,
  adjustRoundingDecimals
} = NETRIS2Parser()

adjustRoundingDecimals(2)

const decoding = decodeUplink(input)

console.log(decoding)
```

They encapsulate the raw parsers and add some additional functionality on top, for example minifying the downlink frames.

### Usage in a gateway or network server

#### New JavaScript Parsers (3.x.x and newer)

The javascript parsers are in the process of being rewritten in typescript. In addition the parsers will be made available as a npm package.
With the new parsers, there is no need to modify the index.js file before you can use the JavaScript parsers as they let you define the measuring ranges of the sensor via a function.
Additionally, the utility function `adjustRoundingDecimals` to adjust the amount of decimals of the output values.
To use those, just add the respective function call after the parser.

```javascript
/**
...
raw minified parser
...
*/

adjustRoundingDecimals(2);
// adjust the measuring range of channel 0 to -40 to 100
// returns an error string if the given channel id cannot be found
const undefinedOrErrorString = adjustMeasurementRange(0, {
  start: -40,
  end: 100
});

if(typeof undefinedOrErrorString === 'string') {
    console.error(undefinedOrErrorString);
}

const decoding = decodeUplink(input);

console.log(decoding);
```

Currently implemented parsers:
* NETRIS2 (does not support changing the measuring ranges as channels are always 4-20mA)

For more information about how to include the new parsers in your project, please refer to the [quick start guide](./doc/QuickStartGuide.md) and the [examples](./examples/README.md).

> **Note:** The `decodeHexString` and `decodeBase64String` functions are not available in the new parsers as the were made to be compatible with browser environments, which don't support the nodejs Buffer class.

#### Legacy JavaScript Parsers (2.x.x and older)

---
**ATTENTION**

!!! You must modify the index.js file before you can use the JavaScript parsers !!!

---

Each payload parser file starts with a public section. Here you have to enter your the measuring ranges of the sensor your are using. The measuring ranges can be found on the model label of your sensor and in the data sheet of the sensor.

```javascript
// PGU with NETRIS3
/**
 * The starting value of the pressure range.
 * @type {number}
 */
var PRESSURE_RANGE_START = 0 // bar

/**
 * The ending value of the pressure range.
 * @type {number}
 */
var PRESSURE_RANGE_END = 10 // bar

/**
 * The starting value of the device temperature range.
 * @type {number}
 */
var DEVICE_TEMPERATURE_RANGE_START = -40 // °C

/**
 * The ending value of the device temperature range.
 * @type {number}
 */
var DEVICE_TEMPERATURE_RANGE_END = 100 // °C
```

After the modification, you can use the index.js file on your network server.

### Calling the parsing function
The parser exposes three functions to decode raw byte messages:
* output = decodeUplink(input)
* output = decodeHexString(fPort, hexEncodedString)
* output = decodeBase64String(fPort, base64EncodedString)

```JavaScript
/**
 * "input": {
 *      "bytes": [1, 0, 0, 46, 151, 18, 83],
 *          "fPort": 1,
 *          "recvTime": "2023-11-11T13:37:00+02:00"
 *  }
 **/
const parser = require("index.js");
const output = parser.decodeUplink(input);
console.log(output);
/**
 *   "output": {
 *        "data": {
 *            "messageType": 1,
 *            "configurationId": 0,
 *            "measurement": {
 *                "channels": [
 *                    {
 *                        "channelId": 0,
 *                        "channelName": "pressure",
 *                        "value": 9.427
 *                    },
 *                    {
 *                        "channelId": 1,
 *                        "channelName": "device temperature",
 *                        "value": -18.09
 *                    }
 *                ]
 *            }
 *        }
 *    }
**/
```
For more information about parser using see the [Legacy JavaScript Parser Usage](/doc/LegacyJavaScriptUsage.md)

# Release Notes
3.2.1
 - parsers: correctly validate hex string in `decodeHexUplink`

3.2.0
 - library: updated NETRIS2 `encodeDownlink` to use `configurationId` instead of `transactionId`
 - library: updated NETRIS2 `decodeUplink` to return structured output instead of raw frames

3.1.1
 - use configurationId in favor of transactionId in downlink

3.1.0
 - Added functionality to decode hex strings to new parsers
 - Bumped valibot dependency to 1.1.0

3.0.1
 - Correctly release built packages and simplify build process

3.0.0
 - Enhanced repository structure
 - Added the parser for NETRIS2

2.5.0
 - Added parsing for the A2G alarm messages
 - Fixed an issue A2G with low power messages
 - Fixed an issue GD20W with schema and examples

2.4.1
 - Fix GD20W image

2.4.0
 - Added the parser for GD20W
 - Added support for A2G low power messages.

2.3.0
 - Added the parser for PEU+NETRIS3.

2.2.0
 - Added the parser for NETRIS2.

2.1.0
 - Fixed an issue where the use of the function padStart affected the ES5 compatibility.
 - Added the parser for A2G.
 - Added the parser for TRW.

2.0.0
 - First Release
