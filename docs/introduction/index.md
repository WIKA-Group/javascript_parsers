# What are WIKA parsers?

The WIKA parsers are a set of message interpreters written in TypeScript, designed to decode and encode data from WIKA IIoT sensors and devices. They help you integrate WIKA IIoT sensors and devices into your applications.

Initially they were intended to be used in LoRaWAN gateways and network servers so they are almost [fully compatible](/users/lorawan-compatibility) with the [LoRaWAN® Payload Codec API Specification TS013-1.0.0](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api). Additionally, they can also be used in other environments such as web applications, Node.js applications, or any JavaScript-based application.

## Use Cases

- **LoRaWAN integration**

The parsers ship as standalone JavaScript files, which can be used in LoRaWAN gateways and network servers to decode uplink messages and encode downlink messages. They fulfill the standard API of `decodeUplink` and `encodeDownlink` with the necessary files specified by the [LoRaWAN® Payload Codec API Specification TS013-1.0.0](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api).

See [here](/users/integration) for more information on how to use the parsers in a LoRaWAN gateway or network server.

- **Web applications**

Another way the parsers are released is as an npm package. This allows you to easily integrate the parsers into your web applications. You can install the package via npm and use the parsers to decode uplink messages and encode downlink messages in your web application.

The parsers are written without any native Node.js dependencies, which makes them suitable for use in web applications. You can include the parsers in your web application to decode uplink messages from WIKA IIoT sensors and devices and display the data in a user-friendly way.

If you are looking for an easy way to decode and encode WIKA IIoT sensor data, you can take a look at the [WIKA Toolbox](https://wika-group.github.io/iiot_toolbox/).

- **Server applications**

Another benefit of having runtime-agnostic parsers is that they can be used in server applications as well. This means you can use the parsers in Node.js applications to decode uplink messages and encode downlink messages from WIKA IIoT sensors and devices. This allows you to process the data on the server and store it in a database or perform further analysis.

[Here](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples/server) you can find examples of how to use them in a server environment.
