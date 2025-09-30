# Integration Guide

This guide provides instructions on how to integrate the WIKA JavaScript parsers into your LoRaWAN network server or gateway.

## Network Server Integration

To integrate the WIKA parsers into your LoRaWAN network server, follow these general steps. Specific instructions may vary depending on the network server you are using.

1. **Download the Parser**:<br>Obtain the latest prebuilt parser from the [releases](https://github.com/WIKA-Group/javascript_parsers/releases) section of the repository or configure it on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) (recommended).
2. **Configure the Parser**:<br>Set up the parser according to your specifications. Set the rounding decimals and measurement ranges as needed. The [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) provides an easy way to configure these settings before downloading the parser.
3. **Upload the Parser**:<br>Go to the documentation of your network server to learn where and how to upload or configure the parser.
4. **Test the Parser**:<br>Send test payloads to ensure that the parser is functioning correctly. This can also be done on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) if you have used it to configure the parser in the first step.
5. **Monitor and Maintain**:<br>Regularly check the [Release notes](https://github.com/WIKA-Group/javascript_parsers?tab=readme-ov-file#release-notes) to stay updated with any changes or improvements to the parsers.

## Gateway Integration

If you are using a LoRaWAN gateway that supports custom payload parsers, follow these generic steps:

1. **Download the Parser**:<br>Obtain the latest prebuilt parser from the [releases](https://github.com/WIKA-Group/javascript_parsers/releases) section of the repository or configure it on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) (recommended).
2. **Configure the Parser**:<br>Set up the parser according to your specifications. Set the rounding decimals and measurement ranges as needed. The [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) provides an easy way to configure these settings before downloading the parser.
3. **Upload the Parser**:<br>Go to the documentation of your gateway to learn where and how to upload or configure the parser.
4. **Test the Parser**:<br>Send test payloads to ensure that the parser is functioning correctly. This can also be done on the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) if you have used it to configure the parser in the first step.
5. **Monitor and Maintain**:<br>Regularly check the [Release notes](https://github.com/WIKA-Group/javascript_parsers?tab=readme-ov-file#release-notes) to stay updated with any changes or improvements to the parsers.

## Custom Integration

If you need to integrate the WIKA JavaScript parsers into a custom application or platform, please refer to the [Custom Integration](/users/custom-integration) guide.
