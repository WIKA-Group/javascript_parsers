# How It Works

The WIKA parsers are designed to decode and encode messages from WIKA's IIoT devices, allowing you to integrate them into your applications seamlessly.
These devices were designed with LoRaWAN in mind but some of them can also be used with other protocols such as Mioty, LWM2M, and others.
In almost all cases the devices send their data to some kind of gateway which forwards the data to a network server. From there the data can be forwarded to a web server or web application. Depending on the underlying protocol the "gateway" or "network server" might be called differently, but the data flow remains similar. Of course not only data can be sent from the device to the server, but also downlink messages can be sent from the server to the device. This is used to configure the device or to send commands to it.
Going forward a LoRaWAN like data flow is assumed, but the same principles apply to most other protocols as well.

![Dataflow from the device](/dataflow.svg)

The device compresses its data into a binary encoded message to save bandwidth and battery life. The parsers are designed to decode this binary data into a human-readable format and encode it back into binary format for downlink messages.

## Understanding Measurement Data

When the parser decodes measurement data, it performs automatic conversion from raw encoded values to real-world measurements. **The `value` field in the output contains the already-converted measurement** in the appropriate units (e.g., bar, psi, °C).

For TULIP3 devices, you may notice a `sourceDataType` field in data messages (e.g., `"uint16 - TULIP scale 2500 - 12500"` or `"float - IEEE754"`). This field is **informational only** and indicates how the value was originally encoded in the binary payload. You do not need to perform any additional conversion—the parser has already applied the device's measurement range configuration to produce the final `value`.

**Example:**
```json
{
  "data": {
    "measurements": [
      {
        "channelName": "pressure",
        "sourceDataType": "uint16 - TULIP scale 2500 - 12500",
        "value": 45.2, // ← Already converted to real pressure value
        "valueAcquisitionError": false
      }
    ]
  }
}
```

The accuracy of these converted values depends on correctly configuring the parser with your device's actual measurement ranges. Always verify the ranges from your device specifications or identification frames before processing data messages. See the [Quick Start Guide](/users/quick-start) for details on range configuration.

## Integration Points

The parsers can be integrated into
- the Gateway
- the Network Server
- the Application Server
- or the Web Application.

From there, the data is forwarded to the next step in the flow, typically a web server or web application. In most cases, we recommend integrating the parser at the network server or the application server. Placing the parser on the gateway can lead to challenges when new device types are introduced or when device‑specific fixes are required, as updates are harder to roll out. For this reason, gateway-level deployments are discouraged unless strictly necessary.

From the network server, you can configure how your application receives the data and route it to your targets, for example, delivering it to a webhook, message queue, or directly inserting it into a database. If the parser runs on the application server, decode the payload there and write the normalized data to your database or forward it to downstream services.
