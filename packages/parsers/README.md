# Javascript parsers

This package contains the javascript parsers for the WIKA devices. The parsers are being rewritten in typescript.

This package is not released and only used in this monorepo.

## Build

The parsers will be built into 3 separate packages:
1. Workspace package to be used in the library packages. There they will be wrapped and later released to the npm registry.
2. A zip package for the github release. As the parsers may be used in a network server or gateway they will be transformed to be self-contained.
3. For the web Toolbox, the parser will also be needed to be available as a single file. This will be release as an internal package so that the parser can be imported raw in the toolbox and adjusted for the users needs. Only rewritten parsers will be included in this package.

To build all 3 packages, run the following command in the root directory of the repository:

```bash
pnpm build:parsers
```
