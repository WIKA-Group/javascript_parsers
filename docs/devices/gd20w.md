# GD20W Gas Density Transmitter

![GD20W](/GD20W.png)

#### Description of the device

In order to prevent system failures in switchgear and network outages, the permanent monitoring of the gas density is essential.

The model GD-20-W calculates the current gas density from the pressure and temperature using a complex virial equation in the gas density sensor’s powerful microprocessor. Pressure changes resulting from temperature effects will be compensated by this and will not affect the output value.

For more information see [product site](https://www.wika.com/en-en/gd_20_w.WIKA).

## JavaScript Parser API

The following functions are exposed by the JavaScript parser:

- `decodeUplink(input)`
- `decodeHexString(fPort, hexEncodedString)`
- `decodeBase64String(fPort, base64EncodedString)`

See the [API Description](/users/api-description) for full details on how to use these functions.

## NPM Module Inclusion

<!--@include: ../../packages/library/README.md#devices-table{2,3}-->
<!--@include: ../../packages/library/README.md#devices-table{6,6}-->
