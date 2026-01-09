# Quick Start

> This guide explains how to integrate the parser into your chosen runtime (network server, gateway, Node-RED, or custom application).

## Prerequisites

1. **Collect LoRaWAN credentials.** You need the Dev EUI, App EUI (JoinEUI) and App Key printed on the Quick Start card that shipped with your device. The App Key stays secret. Only copy it into the systems that require it.
   ![Quick Start Guide Card](/Quick-Start-Guide-Card.png)
2. **Know the measuring range(s).** Check the sensor label and data sheet for the default measuring range per channel. You will configure these using the `adjustMeasuringRange` helper.

## Step-by-step setup

1. **Download the parser bundle.**

   Go to the [Downloads](/users/downloads) page and choose either the WIKA IIoT Toolbox (recommended) or GitHub Releases. If you plan to run the parser inside Node-RED, see the [Node-RED Integration](/users/node-red) page. For network/gateway deployments, see [Integration Guide](/users/integration).

2. **Register the device on your network server.**

   Follow the gateway or network server UI to add a new device, then enter the Dev EUI and App Key you collected earlier. Some servers require the JoinEUI/App EUI as well.

3. **Choose your integration point.**

   The parser can run wherever it makes most sense in your architecture: a network server (preferred for centralized management), a gateway that supports payload codecs, a Function inside Node-RED, or a custom application. See [Integration Guide](/users/integration) for server/gateway deployment and [Node-RED Integration](/users/node-red) for a Node-RED specific example.

4. **Verify API compatibility.**

   The WIKA parsers expose `decodeUplink(input)` by default, following the [LoRaWAN® Payload Codec API Specification](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api).

   **Most** network servers and gateways are spec-compliant and work immediately. Just upload the parser and you're done.

   **However**, some systems expect different function names (e.g., `decode`, `Decode`, `decodePayload`). If your system is non-compliant, add this wrapper at the **bottom** of your downloaded parser:

   ```javascript
   // Add at the bottom of the parser file
   function decode(input) {
       return decodeUplink(input)
   }
   ```

   Replace `decode` with whatever function name your gateway/network server expects. Check your system's documentation under "payload formatters" or "codec" sections.

5. **Configure measuring ranges.**

   Adjust measuring ranges per channel name (see the [device](/devices/) documentation for supported channel identifiers). Call this once before decoding.

   ```javascript
   adjustMeasuringRange('pressure', { start: -1, end: 20 })
   adjustMeasuringRange('device temperature', { start: -40, end: 125 })
   ```

   Optional: refine numeric precision with `adjustRoundingDecimals(2)`.

6. **Provide the parser with the incoming payload.**

   Your runtime will supply data in one of these common forms: a raw byte array, a hex string, or a Base64 string. Use the appropriate decoding method:

   **For byte arrays:**
   ```javascript
   msg.payload = decodeUplink({
     bytes: msg.payload,  // already a byte array
     fPort: msg.fPort ?? 1,
   })
   return msg
   ```

   **For hex strings:**
   ```javascript
   msg.payload = decodeHexUplink({
     bytes: msg.payload,  // hex string like "010203"
     fPort: msg.fPort ?? 1,
   })
   return msg
   ```

   **For Base64 strings:**
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

7. **Deploy and activate.**

   Deploy your integration changes in your chosen runtime (restart or redeploy an integration on your network server, push the updated script to your gateway, or deploy the Node-RED flow). Then activate or rejoin the device to trigger uplinks.

8. **Validate the outputs.**

   Compare the decoded values with reference payloads or known sensor readings. Adjust measuring ranges or rounding until the numbers match expectations.

## Troubleshooting

- **Unknown channel error:** The channel name passed to `adjustMeasuringRange` must exactly match the device documentation (case-sensitive). Refer to the device page under [/devices/](/devices/).
- **Base64 decoding fails:** Confirm the network server sends a Base64 string. If it already provides a byte array, pass it directly to `decodeUplink` without conversion.

## Migrating from older parsers

If you are upgrading from a legacy `2.x.x` or `3.x.x` parser, see the [Migration Guide](/users/migration-guide) for detailed instructions.
