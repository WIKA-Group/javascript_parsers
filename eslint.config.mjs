import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  stylistic: {
    indent: 2,
  },
  markdown: true,
  typescript: true,
}, {
  ignores: [
    '**/*.js',
    '**/*.(spec|test).ts',
    '**/*.schema.json',
    '**/.nitro/**',
  ],
}, {
  // Off because the JSDOC files are put together with other markdown content and are not standalone documentation files
  files: ['packages/parsers/src/devices/**/JSDOC.md'],
  rules: {
    'markdown/heading-increment': 'off',
  },
})
