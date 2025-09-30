# A2G Pressure Transmitter

![A2G](/A2G.png)

#### Description of the device

The model A2G-520 measures the pressure difference on components such as ventilators or pitot tubes, e.g. model A2G-FM, and calculates the air flow using the calibration factor (K factor). By selecting the respective component manufacturer in the menu, the correct calculation formula is automatically taken into account.

To further optimise the air flow measurement under extreme ambient conditions such as altitude and high medium temperature, suitable sensors can be directly integrated.

The piezoresistive measuring element is temperature-compensated and particularly stable over the long term. It records even the smallest pressure differences and thus ensures high reliability and the highest measurement accuracy. The measured values are available as analogue voltage and current signals, digitally via the RS-485 interface using Modbus® RTU or via LoRaWAN® (LPWAN).

Integration into any control system or directly into cloud solutions is therefore easily possible.

The A2G-520 has freely adjustable measuring ranges. The instrument can be set using the WIKA app and NFC and, depending on the version, using buttons and a display. Efficient project documentation is possible using instrument parameter file readout via NFC and smartphone. The indication of up to four measured values and two relay states can be read from all viewing angles thanks to 2" TFT colour display with traffic light function and individualised measurement parameter lettering.

The construction of the A2G-520 is robust and weather-proof (IP65). The case can be opened without tools thanks to the snap-on cover.

For more information see [product site](https://www.wika.com/en-en/a2g_520.WIKA).

## JavaScript Parser API

The following functions are exposed by the JavaScript parser:

- `decodeUplink(input)`
- `decodeHexString(fPort, hexEncodedString)`
- `decodeBase64String(fPort, base64EncodedString)`

See the [API Description](/users/api-description) for full details on how to use these functions.

## NPM Module Inclusion

<!--@include: ../../packages/library/README.md#devices-table{2,3}-->
<!--@include: ../../packages/library/README.md#devices-table{4,4}-->
