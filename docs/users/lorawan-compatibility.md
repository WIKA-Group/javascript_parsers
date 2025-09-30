# LoRaWAN compatibility

Our parsers are designed to follow the LoRaWAN Payload Codec API Specification (TS013‑1.0.0) as closely as possible. Where applicable, they provide the standard entry points `decodeUplink` and `encodeDownlink` and adhere to the expected input and output shapes. This makes them straightforward to integrate in gateways and network servers that implement the codec API. If you’re new to the overall data flow, see [How It Works](/users/how-it-works).

While we aim to satisfy the platform constraints defined by the specification, we cannot guarantee that every device parser will remain below the mandatory 64 KB file size limit. Some devices include richer validation logic and lookups, which can increase bundle size.
To maximize runtime compatibility, we target ES3 features and avoid newer language constructs wherever feasible. When a non‑ES3 feature is genuinely required, we provide a small, guarded polyfill or an equivalent implementation within the bundle.

Beyond the base codec API, the distribution includes a few convenience functions to simplify common integration tasks. For instance, helpers like `decodeHexString` and `decodeBase64String` let you decode payloads provided as hex or Base64 instead of integer arrays. Output formatting can be tuned with `adjustRoundingDecimals`, and some parsers accept configuration input so you can tailor decoding and validation to a specific device setup. For the complete list of available methods and signatures, see [API Description](/users/api-description).

Feature availability can vary slightly between device‑specific parsers and the wrapper package. If you rely on a particular helper, consult the device README or the package‑level documentation for exact availability and examples. As always, aligning the parser’s placement with your architecture, gateway, network server, or application, will help you balance portability, upgradeability, and size constraints.
