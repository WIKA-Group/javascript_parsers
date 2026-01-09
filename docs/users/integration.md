# Integration Guide

This guide provides instructions on how to integrate the WIKA JavaScript parsers into your LoRaWAN network server or gateway.

## Exposed Functions

The WIKA parsers follow the [LoRaWAN® Payload Codec API Specification TS013-1.0.0](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api) and expose the following primary function:

- **`decodeUplink(input)`** - Decodes uplink messages from your devices

For additional functions and version-specific details, see the [API Description](/users/api-description) page.

### Spec-Compliant Systems

For **most** LoRaWAN gateways and network servers that comply with the specification, the parser works out of the box. Simply:

1. Download and configure your parser (set measuring ranges)
2. Upload it to your gateway/network server
3. Done! The parser will automatically use `decodeUplink()`

::: warning Important
Always adjust the measuring ranges to match your specific sensor before deployment.
:::

### Non-Compliant Systems

Some gateways or network servers use **custom function names** instead of the standard `decodeUplink`. If your system expects a different function name (e.g., `decode`, `Decode`, `decodePayload`, `Decoder`), add a wrapper function at the **bottom** of your downloaded parser:

```javascript
// Add this at the bottom of your parser file
function decode(input) {
    return decodeUplink(input)
}
```

Replace `decode` with whatever function name your system expects. This simple wrapper is sufficient for most cases.

**How to check:** Consult your gateway or network server documentation. Look for sections about "payload formatters", "codec", or "decoder" to find the expected function name.

## Network Server Integration

To integrate the WIKA parsers into your LoRaWAN network server, follow these general steps. Specific instructions may vary depending on the network server you are using.

1. **Download the Parser**:<br>Obtain the latest prebuilt parser from the [releases](https://github.com/WIKA-Group/javascript_parsers/releases) section of the repository or configure it on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) (recommended).
2. **Configure the Parser**:<br>Set up the parser according to your specifications. Set the rounding decimals and measurement ranges as needed. The [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) provides an easy way to configure these settings before downloading the parser.
3. **Upload the Parser**:<br>Go to the documentation of your network server to learn where and how to upload or configure the parser.
4. **Test the Parser**:<br>Send test payloads to ensure that the parser is functioning correctly. This can also be done on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) if you have used it to configure the parser in the first step.
5. **Monitor and Maintain**:<br>Regularly check the [Release notes](https://github.com/WIKA-Group/javascript_parsers?tab=readme-ov-file#release-notes) to stay updated with any changes or improvements to the parsers.

## Gateway Integration

If you are using a LoRaWAN gateway that supports custom payload parsers, follow these generic steps:

1. **Download the Parser**:<br>Go to the [Downloads](/users/downloads) page. Use the WIKA IIoT Toolbox (recommended) or download from GitHub Releases.
2. **Configure the Parser**:<br>Set up the parser according to your specifications. Set the rounding decimals and measurement ranges as needed. The [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) provides an easy way to configure these settings before downloading the parser.
3. **Upload the Parser**:<br>Go to the documentation of your gateway to learn where and how to upload or configure the parser.
4. **Test the Parser**:<br>Send test payloads to ensure that the parser is functioning correctly. This can also be done on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) if you have used it to configure the parser in the first step.
5. **Monitor and Maintain**:<br>Regularly check the [Release notes](https://github.com/WIKA-Group/javascript_parsers?tab=readme-ov-file#release-notes) to stay updated with any changes or improvements to the parsers.

## Custom Integration

If you need to integrate the WIKA JavaScript parsers into a custom application or platform, please refer to the [Custom Integration](/users/custom-integration) guide.
