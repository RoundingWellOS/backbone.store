import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['lib/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.mocha,
        console: 'readonly',
      },
      sourceType: 'module',
    },
  },
  {
    files: ['test/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        console: 'readonly',
      },
      sourceType: 'commonjs',
    },
  },
  {
    files: ['test/**/*.js'],
    rules: {
      'new-cap': 'off',
      'no-new': 'off',
      'object-shorthand': 'off',
      'one-var': ['error', 'never'],
    },
  },
];
