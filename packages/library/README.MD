# @w2a-iiot/parsers

Javascript parsers for WIKA's IIoT devices.
Can be used on the server or in the browser.

For more information about the parsers, please visit the [documentation](https://wika-group.github.io/javascript_parsers/).

## Installation

You can install the package using npm:

```bash
npm install @w2a-iiot/parsers
```

## Usage

```typescript
import { NETRIS2parser } from '@w2a-iiot/parsers';

// creates a Netris2 parser instance
const parser = NETRIS2parser();

// decodes the uplink message
const data = parser.decodeUplink({...})
```
