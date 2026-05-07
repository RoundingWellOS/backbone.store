import { defineConfig } from 'tsdown';

// npm scripts use --config-loader native so CI does not depend on tsdown's optional unrun loader.
const globals = {
  backbone: 'Backbone',
  underscore: '_',
};

export default defineConfig({
  entry: {
    'backbone.store': './lib/index.js',
  },
  format: ['esm', 'cjs', 'umd'],
  globalName: 'Backbone.Store',
  deps: {
    neverBundle: ['backbone', 'underscore'],
  },
  sourcemap: true,
  dts: false,
  hash: false,
  copy: [
    {
      from: 'index.d.ts',
      to: 'dist',
    },
  ],
  outputOptions(options, format) {
    const output = {
      ...options,
      exports: 'named',
    };

    if (format === 'esm' || format === 'es') {
      return {
        ...output,
        entryFileNames: 'backbone.store.mjs',
      };
    }

    if (format === 'cjs') {
      return {
        ...output,
        entryFileNames: 'backbone.store.cjs',
      };
    }

    return {
      ...output,
      entryFileNames: 'backbone.store.js',
      extend: true,
      globals,
      name: 'Backbone.Store',
    };
  },
});
