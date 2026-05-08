# Changelog

## 2.0.0

- Add synchronous cache primitives: `find`, `has`, `patch`, `evict`, `inspect`, `reset`, and `resetAll`.
- Ship TypeScript declarations for the public Store and ModelCache APIs.
- Modernize package output to ESM (`dist/backbone.store.mjs`), CJS (`dist/backbone.store.cjs`), and UMD (`dist/backbone.store.js`) through an `exports` map.
- Add `"type": "module"` for native ESM source and tooling.
- Change raw CommonJS consumption to use the default export: `require('backbone.store').default`.
- Remove the old `dist/backbone.store.esm.js` filename; use `dist/backbone.store.mjs` or the package root import instead.
- Keep UMD assignment on `Backbone.Store` without adding a `window.Store` global.
- Upgrade the test/build stack for Node 24 and replace Babel/Rollup/nyc with native ESM, tsdown, ESLint flat config, and c8.

### Fixes

- Prevent id-key collisions for ids such as `"toString"` and `"__proto__"` by using null-prototype cache storage.
- Track pending no-id models so Store-owned listeners are cleaned up if the model is reset, removed, or destroyed before receiving an id.
- Detach Store-owned `destroy` listeners when `Store.remove(modelName)`, `Store.removeAll()`, `Store.reset(modelName)`, or `Store.resetAll()` clears cached instances.
- Avoid object-inspection conflicts when assertion/debug tools call `Store.inspect(depth, options)` while formatting Store references.
