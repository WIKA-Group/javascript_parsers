import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WIKA parsers',
  description: 'Parsers for WIKA devices',
  appearance: false,
  base: '/javascript_parsers/',
  themeConfig: {

    search: {
      provider: 'local',
    },

    logo: '/wika.png',

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/introduction/' },
      { text: 'Users', link: '/users/how-it-works' },
      { text: 'Devices', link: '/devices/' },
      { text: 'Contributors', link: '/contributors/' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'What are WIKA parsers', link: '/introduction/' },
          { text: 'Getting started', link: '/introduction/getting-started' },
        ],
      },
      {
        text: 'For Users',
        collapsed: false,
        items: [
          { text: 'How It Works', link: '/users/how-it-works' },
          { text: 'LoRaWAN Compatibility', link: '/users/lorawan-compatibility' },
          { text: 'Quick Start', link: '/users/quick-start' },
          { text: 'Integration', link: '/users/integration' },
          { text: 'Troubleshooting', link: '/users/troubleshooting' },
          {
            text: 'Custom Integration',
            link: '/users/custom-integration',
          },
          { text: 'Node-RED Integration', link: '/users/node-red' },
          { text: 'API Description', link: '/users/api-description' },
          { text: 'Migration Guide', link: '/users/migration-guide' },
        ],
      },
      {
        text: 'Supported Devices',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/devices/' },
          { text: 'A2G', link: '/devices/a2g' },
          { text: 'F98W6', link: '/devices/f98w6' },
          { text: 'GD20W', link: '/devices/gd20w' },
          { text: 'NETRIS1', link: '/devices/netris1' },
          { text: 'NETRIS2', link: '/devices/netris2' },
          {
            text: 'NETRIS3 Devices',
            collapsed: true,
            items: [
              { text: 'FLRU+NETRIS3', link: '/devices/netris3/flru' },
              { text: 'PEU+NETRIS3', link: '/devices/netris3/peu' },
              { text: 'PGU+NETRIS3', link: '/devices/netris3/pgu' },
              { text: 'TGU+NETRIS3', link: '/devices/netris3/tgu' },
              { text: 'TRU+NETRIS3', link: '/devices/netris3/tru' },
            ],
          },
          { text: 'PEW', link: '/devices/pew' },
          { text: 'PGW23', link: '/devices/pgw23' },
          { text: 'TRW', link: '/devices/trw' },
        ],
      },
      {
        text: 'For Contributors',
        collapsed: true,
        items: [
          { text: 'Developer Guide', link: '/contributors/' },
          { text: 'Repository Setup', link: '/contributors/repo-setup' },
          { text: 'Architecture', link: '/contributors/architecture' },
          { text: 'Parser Development', link: '/contributors/parser-development' },
          { text: 'Codec Development', link: '/contributors/codec-development' },
          { text: 'Schemas', link: '/contributors/schemas' },
          { text: 'Testing', link: '/contributors/testing' },
          { text: 'Contributing', link: '/contributors/contributing' },
          {
            text: 'Codecs',
            collapsed: true,
            items: [
              {
                text: 'TULIP3',
                link: '/contributors/codecs/TULIP3',
              },
              { text: 'TULIP2', link: '/contributors/codecs/TULIP2' },
            ],
          },
          {
            text: 'Legacy TULIP2',
            link: '/contributors/legacy-tulip2',
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/WIKA-Group/javascript_parsers' },
    ],
  },
})
