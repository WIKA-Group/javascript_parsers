# Troubleshooting

Common symptoms and practical fixes when working with the WIKA parsers.

## Common Issues

### 1. Outdated Parser Build

Running an older bundle or package version can leave out critical fixes, device definitions, or helper utilities that newer integrations rely on. This often shows up as missing configuration keys, unexpected validation behavior, or decode results that differ from the documented schemas.

**How to fix it**

- Verify the version in your deployment (`version` in the script file, npm package version, or toolbox export timestamp) and compare it with the latest release.
- Walk through the [Migration Guide](/users/migration-guide) to understand breaking changes and recommended upgrade paths.
- If you maintain custom patches, reapply them on top of the current source so you inherit recent bug fixes and feature additions.

### 2. Parser Configured Incorrectly

Each parser expects device-specific configuration, such as measurement ranges, rounding behavior, or feature flags. A configuration meant for another firmware revision, or left at defaults, can cause fields to decode incorrectly or downlink frames to be rejected by the device.

**How to fix it**

- Cross-check your configuration against the device profile in the [API Description](/users/api-description) for the parser version you are using.
- Confirm whether your bundle follows the legacy or current configuration style; adapt the payload accordingly or migrate as outlined in the [Migration Guide](/users/migration-guide).
- When in doubt, regenerate the parser via the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox) with the correct options and redeploy.

### 3. Network Server Incompatibility

Some network servers diverge from the LoRaWAN Payload Codec API or use different function signatures. If the parser entry points are not invoked, you may see empty payloads or “function not defined” errors even though the code itself is valid.

**How to fix it**

- Confirm the expected codec interface in your network server’s documentation and ensure `decodeUplink` / `encodeDownlink` (or your chosen wrapper) match those names.
- For servers with custom hooks, wrap the parser in a thin adapter that translates between the server-specific signature and the standard API.
- Consult the network server’s documentation, community forums, or support channels for known issues and recommended practices.

### 4. Incorrect Parser Selected

Many devices share similar payload layouts but differ in sensor availability, firmware features, or scaling factors. Using the wrong parser may decode without throwing errors yet produce data that is nonsensical.

**How to fix it**

- Match the exact device name and firmware family with the parser listed in the [Overview](/devices/).
- Double-check the configured profile (e.g., probe type, number of channels) against the hardware label and commissioning sheet.
- If readings still diverge, capture a raw uplink alongside the expected values and compare them using the correct device documentation to validate the parser selection.

## Still stuck?

If none of the above resolves the issue, capture the raw payload, parser version, and configuration, then compare the output against the [schemas](/contributors/schemas). Sharing this bundle of information with support or the community speeds up diagnosis and helps spot edge cases faster.
