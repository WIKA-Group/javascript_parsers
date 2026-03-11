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
| [NETRIS_F (prev. F98W6)](./netris-f.md) | ✔️ | ✔️ | ❌ | ❌ |
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
