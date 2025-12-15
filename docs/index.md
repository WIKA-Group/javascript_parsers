---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "WIKA parsers"
  text: "Parsers for WIKA devices"
  tagline: Convert raw byte payloads into structured data with our comprehensive parser library
  image:
    src: /wika.png
    alt: WIKA
  actions:
    - theme: brand
      text: Get Started
      link: /introduction/
    - theme: alt
      text: View Devices
      link: /devices/
    - theme: alt
      text: View on GitHub
      link: https://github.com/WIKA-Group/javascript_parsers
    - theme: alt
      text: Download Parsers
      link: /users/downloads

features:
  - icon: 🚀
    title: Easy Integration
    details: Simple installation via npm with TypeScript support. Works in Node.js, browsers, and serverless environments.
  - icon: 📡
    title: 13+ Supported Devices
    details: Comprehensive support for A2G, F98W6, GD20W, NETRIS1/2/3, PEU, PGU, TGU, TRU, PEW, PGW23, and TRW devices.
  - icon: 🔧
    title: Modern & Legacy Support
    details: Both modern TULIP3 protocol implementation and backward compatibility with legacy parsers.
  - icon: 📊
    title: Structured Data Output
    details: Convert raw (LoRaWAN) payloads into well-defined JavaScript objects with full schema validation.
  - icon: 🛠️
    title: Gateway Ready
    details: Pre-built for popular gateways and network servers with Node-RED integration examples.
  - icon: 📈
    title: Production Tested
    details: Battle-tested parsers used in industrial IoT deployments worldwide with comprehensive test coverage.
---
