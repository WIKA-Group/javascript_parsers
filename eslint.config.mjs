import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  stylistic: {
    indent: 2,
  },
  markdown: true,
  typescript: true,
}, {
  ignores: ['**/*.js', '**/*.(spec|test).ts', '**/*.schema.json', '**/.nitro/**'],
})
