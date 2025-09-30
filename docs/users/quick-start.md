# Quick Start (Parser Generations)
# Quick Start (Parser Generations)

> This guide builds on the original Quick Start card and explains how to integrate the parser into your chosen runtime (network server, gateway, Node-RED, or custom application) for every currently available parser generation (legacy 2.x.x, transitional 3.x.x, and modern 4.x.x).
Gather the same prerequisites as described on the hardware Quick Start card and confirm which parser generation you are deploying.

1. **Collect LoRaWAN credentials.** You need the Dev EUI, App EUI (JoinEUI) and App Key printed on the Quick Start card that shipped with your device. The App Key stays secret. Only copy it into the systems that require it.
   ![Quick Start Guide Card](/Quick-Start-Guide-Card.png)
2. **Know the measuring range(s).** Check the sensor label and data sheet for the default measuring range per channel. You will either transfer these values into the script or call the appropriate adjustment helper depending on the parser generation.
3. **Download the matching parser bundle.** Use the latest release from the [GitHub releases page](https://github.com/WIKA-Group/javascript_parsers/releases) or export a tailored build from the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox). If you plan to run the parser inside Node-RED, see the [Node-RED Integration](/users/node-red) page. For network/gateway deployments, see [Integration Guide](/users/integration).

## Step-by-step setup

1. **Determine the parser generation.**
   Use the version string on the downloaded parser (for example in the filename, comment header, or `metadata.json`).

<!--@include: ../../packages/parsers/README.md#devices-versions-table-->

1. **Register the device on your network server.**
   Follow the gateway or network server UI to add a new device, then enter the Dev EUI and App Key you collected earlier. Some servers require the JoinEUI/App EUI as well.

2. **Choose your integration point and prepare a runtime step.**

   The parser can run wherever it makes most sense in your architecture: a network server (preferred for centralized management), a gateway that supports payload codecs, a Function inside Node-RED, or a custom application. See [Integration Guide](/users/integration) for server/gateway deployment and [Node-RED Integration](/users/node-red) for a Node-RED specific example.

3. **Provide the parser with the incoming payload.**

   Your runtime will supply data in one of these common forms: a raw byte array, a hex string, or a Base64 string. Normalize that input to the form the parser expects (examples below). The decoding call you use depends on the parser distribution you chose (prebuilt single-file vs. npm package).

5. **Apply version-specific adjustments.**

   After you have the parser available in your runtime, apply the snippet that matches your parser generation. These snippets assume the incoming payload is Base64. Adapt the input normalization if your server already supplies raw bytes.

   #### Legacy JavaScript parsers (`2.x.x`)

   1. Add your measuring ranges at the top of the script, right below the initial comments:

      ```javascript
      /**
       * Measurement ranges per channel (edit to match your sensor).
       */
      var TEMPERATURE_RANGE_START = -200
      var TEMPERATURE_RANGE_END = 850
      var PRESSURE_RANGE_START = 0
      var PRESSURE_RANGE_END = 250
      ```

      (Adjust the variable names to match the ones already declared in the file. Each device exposes the relevant constants near the top.)

   2. At the end of the script (after the parser exports), convert the incoming Base64 string and decode it:

      ```javascript
      msg.payload = decodeBase64String(1, msg.payload)
      return msg
      ```

      Replace `1` with the actual `fPort` if you have knowledge of the actual port used.

   #### NETRIS2 transitional parser (`3.x.x`)

   3. Measurement ranges are fixed to 4–20 mA and must not be changed. Optional: tune rounding before decoding.

      ```javascript
      adjustRoundingDecimals(2) // optional, defaults to 4
      ```

   4. Add a helper that converts Base64 to raw bytes and decode the uplink:

      ```javascript
      function base64ToBytes(b64) {
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        return Array.from(bytes)
      }

      msg.payload = decodeUplink({
        bytes: base64ToBytes(msg.payload),
        fPort: msg.fPort ?? 1,
      })

      return msg
      ```

      If your flow needs to send configuration commands, reuse `encodeDownlink` the same way:

      ```javascript
      const downlinkFrame = encodeDownlink({ /* schema-compliant input */ })
      ```

   #### Modern modular parsers (`4.x.x`)

   5. Adjust measuring ranges per channel name (see the [device](/devices/) documentation for supported channel identifiers). Call this once before decoding.

      ```javascript
      adjustMeasuringRange('pressure', { start: -1, end: 20 })
      adjustMeasuringRange('device temperature', { start: -40, end: 125 })
      ```

      Optional: refine numeric precision with `adjustRoundingDecimals(2)`.

   6. Convert Base64 payloads to bytes (if necessary) and decode:

      ```javascript
      function base64ToBytes(b64) {
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        return Array.from(bytes)
      }

      msg.payload = decodeUplink({
        bytes: base64ToBytes(msg.payload),
        fPort: msg.fPort ?? 1,
      })

      return msg
      ```

      For hex strings, call `decodeHexUplink({ bytes: msg.payload, fPort: ... })` instead.

6. **Deploy and activate.**

   Deploy your integration changes in your chosen runtime (restart or redeploy an integration on your network server, push the updated script to your gateway, or deploy the Node-RED flow). Then activate or rejoin the device to trigger uplinks.

7. **Validate the outputs.**

   Compare the decoded values with reference payloads or known sensor readings. Adjust measuring ranges or rounding (where supported) until the numbers match expectations.

## Troubleshooting

- **Unknown channel error:** The channel name passed to `adjustMeasuringRange` must exactly match the device documentation (case-sensitive). Refer to the device page under [/devices/](/devices/).
- **Base64 decoding fails:** Confirm the network server sends a Base64 string. If it already provides a byte array, pass it directly to `decodeUplink` without conversion.
