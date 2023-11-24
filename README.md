![WIKA](https://www.wika.com/media/Images/System/WebsiteLogo/logo_wika.svg "WIKA")

# Welcome to the WIKA LPWAN device parser repo

This repository contains the JavaScript parser for our LPWAN devices:

* [PEW](src/PEW/) 
* [PGU+NETRIS3](src/PGU_NETRIS3/)
* [FLRU+NETRIS3](src/FLRU_NETRIS3/) 
* [TGU+NETRIS3](src/TGU_NETRIS3/)
* [TGU+NETRIS3](src/TRU_NETRIS3/) 
* [NETRIS1](src/NETRIS1/) 
* [PGW23](src/PGW23_100_11/)
* [F98W6](src/F98W6/) 

The JavaScript parser converts the raw byte payload of our devices into a JavaScript object (defined in the uplink.schema.json file).

All our JavaScript parser scripts follow the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.

## Repository Structure
Each folder for each device contains the following files:
* driver-examples.spec.js -> contains the test driver for unit testing
* driver.yaml -> contains some meta information
* examples.json -> contains some input and output payload examples for unit testing
* index.json -> contains source code of the payload parser
* metadata.json -> contains some meta information about the parser
* package.json -> contains meta information and dependencies
* uplink.json -> contains a complete object example
* uplink.schema.json -> contains the output object specification
* README.md -> contains information about the sensor

## Usage
> ! Attention: You must modify the index.js file before you can use the JavaScript parsers !

Each payload parser file starts with a public section. Here you have to enter your the measuring ranges of the sensor your are using. The measuring ranges can be found on the model label of your sensor and in the data sheet of the sensor.

```javascript
// PGU with NETRIS3  
/**
 * The starting value of the pressure range.
 * @type {number}
 */
var PRESSURE_RANGE_START = 0; // bar

/**
 * The ending value of the pressure range.
 * @type {number}
 */
var PRESSURE_RANGE_END = 10; // bar

/**
 * The starting value of the device temperature range.
 * @type {number}
 */
var DEVICE_TEMPERATURE_RANGE_START = -40; // °C

/**
 * The ending value of the device temperature range.
 * @type {number}
 */
var DEVICE_TEMPERATURE_RANGE_END = 100; // °C
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
For more information about parser using see [JavaScript Parser Usage](/doc/JavaScriptUsage.md)