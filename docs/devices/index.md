# Supported Devices

> **Disclaimer:** “TULIP” is WIKA’s internal application-layer protocol used to encode and decode device data across wireless transports such as LoRa® and LoRaWAN®. It is a protocol codename, not a product name, and is referenced here solely for documentation clarity.

WIKA LPWAN devices are supported to varying degrees depending on three factors:

- Parser generation (TULIP2 vs TULIP3)
- Device capabilities and supported features
- Device firmware

This page summarizes the current regional availability of parser generations, a device-level support matrix and which parsers are included in the NPM module [`@w2a-iiot/parsers`](https://www.npmjs.com/package/@w2a-iiot/parsers).

## Regional availability

| Region | TULIP2 | TULIP3 |
|--------|:------:|:------:|
| Europe | ✔️ (current) | ❌ |
| India  | ✔️ (current) | ❌ |
| North America | ❌ | ✔️ (current) |
| Other regions | ❌ | ❌ |

Note: region availability may change in the future, additional regions such as South America, Africa, or Oceania may be added later.

## Device support matrix

| Device | TULIP2 Uplink | TULIP2 Downlink | TULIP3 Uplink | TULIP3 Downlink |
|--------|:-------------:|:---------------:|:-------------:|:---------------:|
| [A2G](./a2g.md) | ✔️ | ⚪ | ⚪ | ⚪ |
| [NETRIS_F (prev. F98W6)](./netris-f.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [GD20W](./gd20w.md) | ✔️ | ✔️ | ⚪ | ⚪ |
| [NETRIS1](./netris1.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [NETRIS2](./netris2.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [PEW](./pew.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [PGW23](./pgw23.md) | ✔️ | ✔️ | ⚪ | ⚪ |
| [TRW](./trw.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [FLRU+NETRIS3](./netris3/flru.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [PEU+NETRIS3](./netris3/peu.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [PGU+NETRIS3](./netris3/pgu.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [TGU+NETRIS3](./netris3/tgu.md) | ✔️ | ✔️ | ✔️ | ✔️ |
| [TRU+NETRIS3](./netris3/tru.md) | ✔️ | ✔️ | ✔️ | ✔️ |

**Legend:**
- <span title="Implemented">✔️</span> implemented in the parser (and supported by device)
- <span title="Not implemented">❌</span> supported by device, but not yet implemented in the parser
- <span title="Not supported by device">⚪</span> not supported by the device (regardless of parser)

> Note: TULIP2 was reimplemented multiple times, expect some differences in behavior between the various TULIP2 parsers.

## NPM Module Inclusion

Some parsers are available as part of the NPM module [`@w2a-iiot/parsers`](https://www.npmjs.com/package/@w2a-iiot/parsers).

<!--@include: ../../packages/library/README.md#devices-table-->

## Configuration frame

Here we summarize information about the configuration frame sent across all TULIP2 devices as an uplink.

### Capability

See the following table for device support of the configuration frame feature:

| Device   | Configuration |
| -------- | ------------- |
| A2G      | ❌             |
| PEW-1000 | ✔️             |
| NETRIS1  | ✔️             |
| TRW      | ✔️             |
| PGW23    | ✔️             |
| GD20W    | ✔️             |

### Configuration Status Value LSB (Byte 2; Bit 3-0)

| Device   | Bit 3-0 |
| -------- | -------------- |
| A2G      | not applicable |
| PEW-1000 | reserved       |
| NETRIS1  | reserved       |
| TRW      | reserved       |
| PGW23    | Last packet index received                                     |
| GD20W    | reserved |

### Response Status  (Byte 2; Bit 7-4)

| Device   | 0: Packet received | 1: No packet received | 2: Config applied with success | 3: Config rejected – At least 1 parameter is incorrect | 4: Config discarded – Never received all packets | 5: Config discarded – Force drop received | 6: Command success | 7: Command failed |
| -------- | ------------------ | --------------------- | ------------------------------ | ------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------- | ------------------ | ----------------- |
| PGW_23   | ✔️                  | ✔️                     | ✔️                              | ✔️                                                      | ✔️                                                | ✔️                                         | ✔️                  | ✔️                 |
| PEW_1000 |                    |                       | ✔️                              | ✔️                                                      |                                                  | ✔️                                         | ✔️                  | ✔️                 |
| TRW      |                    |                       | ✔️                              | ✔️                                                      |                                                  |                                           | ✔️                  | ✔️                 |
| Netris 1 |                    |                       | ✔️                              | ✔️                                                      |                                                  |                                           | ✔️                  | ✔️                 |
| GD20W    |                    |                       | ✔️                              | ✔️                                                      | ✔️                                                |                                           | ✔️                  | ✔️                 |
