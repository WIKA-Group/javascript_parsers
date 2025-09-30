![WIKA](./docs/public//logo_wika.png "WIKA")

# WIKA LPWAN Parser Monorepo

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

_TypeScript/JavaScript payload codecs for WIKA IIoT devices._

## Overview

This monorepo hosts the build tooling, raw codecs, and TypeScript helpers that turn WIKA LPWAN device payloads into structured data. The same stack powers both uplink decoding and the optional downlink encoders. Detailed guides and API docs can be found [here](https://wika-group.github.io/javascript_parsers/).

## Quick start

### Install dependencies

```bash
npm install @w2a-iiot/parsers
```

### Use a parser in your project

```ts
import { NETRIS2Parser } from '@w2a-iiot/parsers'

const parser = NETRIS2Parser()
const result = parser.decodeUplink({ bytes: [0x01, 0x00], fPort: 1 })

console.log(result)
```

## Documentation

📚 Full guides, device references, and contributor docs: [wika-group.github.io/javascript_parsers](https://wika-group.github.io/javascript_parsers/)

## Packages at a glance

- `packages/parsers/` – Raw, build-ready codecs for direct use in gateways, network servers, or ZIP releases.
- `packages/library/` – TypeScript convenience layer published as [`@w2a-iiot/parsers`](https://www.npmjs.com/package/@w2a-iiot/parsers).
- `examples/` – Sample integrations and scripts that demonstrate real-world usage.
- `docs/` – VitePress source for the hosted documentation.

### Helpful scripts

- `pnpm build` – Build all packages and regenerate release assets.
- `pnpm test` – Run the Vitest suite.
- `pnpm docs:dev` – Start the documentation site locally.

## Contributing & support

Review the contributor section of the docs for setup. Need help or spotted an issue? Please open a GitHub issue in this repository so we can follow up with you.

## License

Distributed under the [MIT License](./LICENSE).

## Release Notes
4.2.1
 - Added project documentation site

4.2.0
 - TRW: migrate to typescript and TULIP2 codec
 - TRW: add support for TULIP3
 - NETRIS1: specify measurands in schema

4.1.0
 - NETRIS1: migrate to typescript and TULIP2 codec
 - NETRIS1: add support for TULIP3
 - Fix: default and PEW alarm flags in TULIP3 codec

4.0.0
 - Major refactor: modular codec architecture and unified device parser interface enabling multiple codecs (TULIP2/TULIP3).
 - PEW: integrated TULIP3 codec and migrated parser/codec structure to TypeScript.
 - Added TULIP3 codec and tests for tulip codecs; moved devices into nested `devices` directories.
 - Build: migrated to tsdown.
 - Chores & housekeeping: rename TULIP1 → TULIP2, dependency cleanup and other refactors.

3.2.1
 - parsers: correctly validate hex string in `decodeHexUplink`

3.2.0
 - library: updated NETRIS2 `encodeDownlink` to use `configurationId` instead of `transactionId`
 - library: updated NETRIS2 `decodeUplink` to return structured output instead of raw frames

3.1.1
 - use configurationId in favor of transactionId in downlink

3.1.0
 - Added functionality to decode hex strings to new parsers
 - Bumped valibot dependency to 1.1.0

3.0.1
 - Correctly release built packages and simplify build process

3.0.0
 - Enhanced repository structure
 - Added the parser for NETRIS2

2.5.0
 - Added parsing for the A2G alarm messages
 - Fixed an issue A2G with low power messages
 - Fixed an issue GD20W with schema and examples

2.4.1
 - Fix GD20W image

2.4.0
 - Added the parser for GD20W
 - Added support for A2G low power messages.

2.3.0
 - Added the parser for PEU+NETRIS3.

2.2.0
 - Added the parser for NETRIS2.

2.1.0
 - Fixed an issue where the use of the function padStart affected the ES5 compatibility.
 - Added the parser for A2G.
 - Added the parser for TRW.

2.0.0
 - First Release

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/%40w2a-iiot/parsers?style=flat&colorA=464646&colorB=16489A
[npm-version-href]: https://npmjs.com/package/@w2a-iiot/parsers
[npm-downloads-src]: https://img.shields.io/npm/dm/%40w2a-iiot/parsers?style=flat&colorA=464646&colorB=16489A
[npm-downloads-href]: https://npmjs.com/package/@w2a-iiot/parsers
[bundle-src]: https://img.shields.io/bundlephobia/minzip/%40w2a-iiot/parsers?style=flat&colorA=464646&colorB=16489A
[bundle-href]: https://bundlephobia.com/result?p=%40w2a-iiot%2Fparsers
[license-src]: https://img.shields.io/github/license/WIKA-Group/javascript_parsers.svg?style=flat&colorA=464646&colorB=16489A
[license-href]: https://github.com/WIKA-Group/javascript_parsers/blob/main/LICENSE
