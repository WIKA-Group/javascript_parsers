# Custom Integration

The runtime-independent parser bundle lets you decode uplinks and build downlinks anywhere you can execute JavaScript, Node.js services, browser clients or edge functions. This page outlines recommended integration patterns, highlights the API differences compared with the prebuilt LoRaWAN scripts, and points you to the reference examples shipped with the repository.

## Choosing where to run the parser

The guidance from [How It Works](./how-it-works.md) still applies: decode as close to the network server or application server as possible so you can roll out parser updates centrally and keep gateways lightweight. Typical placement options include:

- **Application server** (recommended). Use the parser inside your web or API backend to normalize payloads before storing them or forwarding them to downstream services.
- **Network server hook**. If your LoRaWAN provider exposes custom integration hooks, you can deploy the parser there to deliver decoded JSON to the rest of your stack.
- **Edge function or worker**. Run the parser within a CDN worker or edge runtime when you need geographic proximity to incoming traffic but still want managed infrastructure.
- **Browser applications**. Useful for diagnostics, dashboards, or tooling where raw frames arrive via WebSocket or REST. Avoid embedding private credentials or exposing downlink endpoints directly in the browser.

## Installing the runtime-agnostic package

```bash
npm install @w2a-iiot/parsers
```

The library ships as an ES module. Import the device-specific factory function and instantiate it once per runtime instance. For example, the `NETRIS2` wrapper is exported as `NETRIS2Parser`.

```typescript
import { NETRIS2Parser } from '@w2a-iiot/parsers'

const parser = NETRIS2Parser()
```

## Decoding uplinks

Decoding behaviour matches the prebuilt LoRaWAN script but without global state. Supply the uplink payload as an object with `bytes`, `fPort`, and optional `recvTime`.

```typescript
const result = parser.decodeUplink({
  bytes: [2, 0, 3, 8, 211, 31, 144],
  fPort: 1,
  recvTime: '1992-12-22T17:00:00+01:00',
})

if ('errors' in result) {
  console.error(result.errors)
}
else {
  console.log(result.data)
}
```

Place the decode step after you receive the raw frame but before persistence or further business logic. This keeps your storage schema independent of binary protocol details and makes it trivial to roll out parser updates.

## Encoding downlinks

Unlike the prebuilt scripts, the library parsers are not constrained by the LoRaWAN codec requirement of returning a single byte array. Each wrapper provides its own downlink encoder shape. For `NETRIS2` (the only device offering encoding today) the wrapper accepts two input styles:

- **Simple actions** (`resetToFactory`, `resetBatteryIndicator`): pass the original parser input and receive `{ success: true, data: { frames: number[][] } }` or `{ success: false, errors: string[] }`.
- **Configuration batches** (`deviceAction: 'downlinkConfiguration'`): pass a composite payload describing main configuration, process alarms, start-up times, etc. The wrapper splits or merges frames automatically and respects spreading-factor limits.

Structure your integration to:

1. Call `parser.encodeDownlink(...)` with either a simple action or a configuration batch.
2. Check the `success` flag. On success, iterate over `data.frames` (each entry is an array of bytes already ordered for transmission). On failure, surface `errors` to operators.
3. Enqueue frames on your network server sequentially when only one frame per session is allowed.

```typescript
const result = parser.encodeDownlink({
  deviceAction: 'downlinkConfiguration',
  spreadingFactor: 'SF10',
  configuration: {
    mainConfiguration: {
      measuringRateWhenAlarm: 300,
      measuringRateWhenNoAlarm: 3600,
      publicationFactorWhenAlarm: 1,
      publicationFactorWhenNoAlarm: 1,
    },
  },
})

if (result.success) {
  result.data.frames.forEach(frame => enqueue(frame))
}
else {
  log.warn('Encoding failed', result.errors)
}
```

When targeting a LoRaWAN network server that only accepts one frame at a time, send the frames sequentially within the same session. For direct device integrations (non-LoRaWAN), you can deliver the entire batch to your transport of choice.

The [server example](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples/server) mirrors this flow by exposing a REST endpoint that returns frames when encoding succeeds and responds with a 400 status when validation fails.

> **Heads-up:** Downlink encoding is currently available only for the `NETRIS2` wrapper inherited from the 3.x.x generation. As additional devices move to the modular architecture, and to support protocols beyond LoRaWAN, the encoding API may evolve. Review the release notes before upgrading.

## Adjusting measuring ranges and formatting

All measurement-range and rounding helpers exposed by the prebuilt scripts are available on the parser instance if the parser supports it:

```typescript
parser.adjustMeasuringRange(channelName, { start: 0, end: 20 })
parser.adjustRoundingDecimals(2)
```

Apply these immediately after instantiation so every decode or encode call uses the correct scaling.

## Reference use cases

| Scenario | Suggested setup |
| --- | --- |
| **REST API / server-side decoding** | Follow the [examples/server](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples/server) project. Instantiate the parser, decode incoming requests, and return JSON to clients. Ideal for integrating with webhooks or message queues. |
| **Browser diagnostics tool** | Mirror the [examples/web](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples/web) sample. Bundle the parser with your frontend build, decode payloads supplied by your backend, and display structured measurements for troubleshooting. |
| **Edge or worker runtime** | Use the same server pattern but deploy to a platform such as Cloudflare Workers, Deno Deploy, or Vercel Edge. Ensure you respect the platform’s module format (ESM is supported). |

## Best practices

- Centralize decoder usage on the network server or backend whenever possible to simplify updates and protect device credentials.
- Log both the raw payload and the decoded output during integration to aid troubleshooting and regression testing.
- When generating downlinks, validate user input before calling `encodeDownlink` and surface the parser’s validation errors to operators.
- Keep parsers up to date by monitoring the [release notes](https://github.com/WIKA-Group/javascript_parsers?tab=readme-ov-file#release-notes) and refreshing your deployment when new device support or fixes ship.

With these patterns in place, you can reuse the same parser logic across server, edge, and browser environments while benefiting from the richer downlink API exposed by the runtime-agnostic package.
