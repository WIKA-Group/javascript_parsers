# Contributor Guide

Welcome to the contributor hub for the WIKA parser monorepo. This page orients you across the documentation set and clarifies the naming conventions you will encounter while working on the project. This guide is intended for engineers and technical writers who are contributing to the codebase or its documentation, whether as WIKA employees or external collaborators.

## What “TULIP” means at WIKA

**WIKA TULIP** is the name of our proprietary application-layer protocol used to encode and decode device data across wireless transports such as LoRa® and LoRaWAN®. The term is a codename for the communication format only, it is **not** the name of a product line. In code and documentation you may see variants like `TULIP`, `TULIP2`, or `TULIP3`; they always refer to the protocol generation.

## How the developer docs are organized

- **Repository setup** → [Repository Setup](/contributors/repo-setup) explains how to clone the public mirror, install dependencies, and run workspace scripts.
- **Architecture overview** → [Architecture](/contributors/architecture) maps the high-level components, packages, and data flow through the 4.x.x parser stack.
- **Parser development workflow** → [Parser Development](/contributors/parser-development) walks through adding or evolving codecs, device profiles, and schemas.
- **Schemas** → [Schemas](/contributors/schemas) details the JSON schema artifacts and generation tooling.
- **Testing** → [Testing](/contributors/testing) covers unit tests, fixtures, and benchmarks for validating changes.
- **Contributing** → [Contributing](/contributors/contributing) clarifies how to interact with the GitHub mirror, including expectations for issues and pull requests.

## First steps for new contributors

1. Review [Repository Setup](/contributors/repo-setup) to prepare your local environment and understand the pnpm workspace layout.
2. Skim [Architecture](/contributors/architecture) for a mental model of how codecs, device profiles, and shared utilities connect.
3. Follow [Parser Development](/contributors/parser-development) when implementing or updating parsers in the 4.x.x stack, and reference [Schemas](/contributors/schemas) whenever schema changes are involved.

## Reporting issues and collaborating

This repository is a read-only mirror. See [Contributing](/contributors/contributing) for guidance on filing issues and PRs.
