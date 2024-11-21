import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
	{
		files: ['**/*.js', '**/*.ts'],
		languageOptions: {
			sourceType: 'commonjs',
			ecmaVersion: 5, // Specify ECMAScript version to 5
		},
		env: {
			es5: true, // Ensure the environment is set for ES5
		},
	},
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
]
