# Downloads

::: danger DO NOT DOWNLOAD THE SOURCE CODE
If you clicked "Code" → "Download ZIP" on GitHub, **STOP**. That is the source code and will not work in your gateway or network server.

Use one of the options below instead.
:::

Prebuilt parser bundles are available in two locations:

## WIKA IIoT Toolbox

Configure and generate tailored parser bundles online at the [WIKA IIoT Toolbox](https://wika-group.github.io/iiot_toolbox/). This is the recommended way to get parsers configured for your specific devices.

Note that not all devices are available in the Toolbox yet. If your device is not listed, use GitHub Releases below.

## GitHub Releases

Go to the [GitHub Releases](https://github.com/WIKA-Group/javascript_parsers/releases) page and download the **latest release**.

::: warning IMPORTANT: Download the Correct File
In the release assets, look for a file named:

**`wika_javascript_parsers_<version>.zip`**

This ZIP file contains all the prebuilt JavaScript parsers ready to use. Each device has its own JavaScript file inside.

**Do NOT download:**
- Source code (zip)
- Source code (tar.gz)

These are for developers only and will not work in your gateway.
:::

### What's inside the ZIP file

After downloading `wika_javascript_parsers.zip`, extract it. You will find folders for each device (e.g., `NETRIS2/`, `PEW/`, `A2G/`). Inside each folder is an `index.js` file. This is the parser you upload to your gateway or network server.

### Next steps

After downloading your parser, continue with:
- [Quick Start](/users/quick-start) - Step-by-step setup guide
- [Integration](/users/integration) - How to upload the parser to your platform
