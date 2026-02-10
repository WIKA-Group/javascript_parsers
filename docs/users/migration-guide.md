# Migration Guide

> **Note:** All devices have been migrated to the modern `4.x.x` architecture. This guide is preserved for users who are still running legacy `2.x.x` or `3.x.x` parsers and need to upgrade.

This guide walks you through upgrading the prebuilt JavaScript parsers that are typically embedded in LoRaWAN network servers. The focus is on the practical steps required when moving from the legacy `2.x.x` bundles to the modular `4.x.x` architecture, plus the smaller hop from `3.x.x` to `4.x.x`.

## Breaking Changes in 4.4.0

::: warning BREAKING CHANGE - Version 4.4.0
If you use downlink encoding (`encodeDownlink` or `encodeMultipleDownlinks`), the function signature has changed:

**Before (4.3.x and earlier):**
```javascript
encodeDownlink({ codec: 'NETRIS2TULIP2', input: {...} })
```

**After (4.4.0+):**
```javascript
encodeDownlink({ protocol: 'TULIP2', input: {...} })
```

The `codec` parameter has been replaced with `protocol` to better reflect the protocol-based encoding selection. Use protocol identifiers like `'TULIP2'` or `'TULIP3'` instead of codec names.

**This change only affects encoding.** Decoding functions (`decodeUplink`, `decodeHexUplink`) remain unchanged.
:::

## Before you start

- Download the latest parser bundle from the [Downloads](/users/downloads) page. Use either the WIKA IIoT Toolbox or GitHub Releases.
- Keep the previous parser file handy so you can copy measuring ranges and verify behavior during testing.
- Review the device-specific documentation to confirm the channel names and default measuring ranges that the `adjustMeasuringRange` helper expects.

> **Note:** The prebuilt `4.x.x` scripts still expose their helpers globally (for example `decodeUplink`, `decodeHexUplink`, `adjustMeasuringRange`). You no longer edit global measurement range variables directly; instead you call the provided adjustment helpers before decoding data.

## Migrating from 2.x.x to 4.x.x

Legacy parsers relied on top-level variables (for example `PRESSURE_RANGE_START`, `DEVICE_TEMPERATURE_RANGE_END`) that you edited directly in the script. The `4.x.x` parsers removed those globals. Instead, you apply measuring ranges by calling the global `adjustMeasuringRange` helper for each channel before decoding any messages.

1. **Download the new script.** Keep the legacy file alongside it so you can reference the configured ranges, but deploy only the freshly generated `index.js` to your network server.

2. **Reapply your configuration in the new file.** Instead of editing global variables, add calls to `adjustMeasuringRange` near the bottom of the new script (for example right before the export section). Do this once so every subsequent decode runs with the correct spans.

    ```javascript
    adjustMeasuringRange('pressure', { start: -1, end: 20 })
    adjustMeasuringRange('device temperature', { start: -40, end: 125 })
    ```

    Channel names are case-sensitive and documented in the [devices section](/devices/).

3. **Update helper usage.**

    - Continue calling the global `decodeUplink(input)` helper; no wrapper is required.
    - If you used `decodeHexString`, switch to `decodeHexUplink({ bytes: '010203', fPort: 10 })`.
    - The legacy `decodeBase64String` helper is not shipped with the modular parser. If you still receive Base64 payloads, convert them to byte arrays or hex strings before calling `decodeUplink`.

4. **Validate your integration.** Run a few known uplinks through the new parser to ensure the decoded values match expectations. Pay special attention to alarms and warning messages, as the new architecture surfaces richer validation feedback.

    > **Error and warning prefixes:** The `4.x.x` parsers automatically catch any errors or warnings thrown by a codec during decoding and prefix them with the codec identifier that was used. If your legacy codec prefixed messages manually, you can now throw or emit the raw error/warning object and let the parser annotate it for you.

5. **Retire the legacy script.** Once verification looks good, archive the old file and roll out the new parser wherever you previously deployed the `2.x.x` version.

## Migrating from 3.x.x to 4.x.x

Only `NETRIS2` shipped a `3.x.x` parser. The upgrade is straightforward because channel scaling already relied on internal validation.

1. **Download the new script.** Deploy the `4.x.x` bundle and keep the `3.x.x` file only as a reference while you verify behavior.

2. **Update channel names.** The channel names for `NETRIS2` have been updated to be unique. You will need to update your integration to use the new channel names.

3. **Update downlink encoding.** The downlink encoding for `NETRIS2` has changed. Please refer to the `4.x.x` documentation for the new downlink format.

4. **Test alarms and configuration flows.** As the `NETRIS2` only supports 4-20 mA, there is no need to adjust the measuring ranges. The `4.x.x` architecture performs stricter validation and surfaces more granular error messages. Re-run your acceptance tests to confirm alarms, configuration status messages, and downlink acknowledgements behave as expected.

    > **Error and warning prefixes:** Just like the `2.x.x` migration, the parser now prefixes decoded errors and warnings with the codec identifier automatically. Remove any manual prefixing you had in custom handlers and rely on the parser output to show which codec emitted the message.

## Troubleshooting tips

- If `adjustMeasuringRange` throws an “unknown channel” error, check the device documentation for the exact channel labels and ensure they match your case and spacing.

## NPM package users

All parsers in the npm package now use the `4.x.x` architecture. If you were previously using `3.x.x` parsers, follow the migration steps outlined above. The package is shipped with typed definitions, so you get compile-time validation when calling the helpers. Take a look at the type issues provided there if you run into problems.
