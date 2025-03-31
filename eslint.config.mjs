import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  stylistic: {
    indent: 2,
  },
}, {
  ignores: ['**/*.js', '**/*.(spec|test).ts', '**/*.schema.json', '**/.nitro/**'],
})
