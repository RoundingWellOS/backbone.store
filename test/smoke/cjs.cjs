const Backbone = require('backbone');
const StoreModule = require('../../dist/backbone.store.cjs');

if (typeof StoreModule.default !== 'function') {
  throw new Error('CJS smoke failed to expose default Store export');
}

if (typeof StoreModule.ModelCache !== 'function') {
  throw new Error('CJS smoke failed to expose ModelCache export');
}

const Store = StoreModule.default;

const StoredModel = Store(Backbone.Model, 'cjs-smoke');
const first = new StoredModel({ id: 1, name: 'first' });
const second = new StoredModel({ id: '1', name: 'second' });

if (first !== second) {
  throw new Error('CJS smoke failed to preserve unique instances');
}

if (first.get('name') !== 'second') {
  throw new Error('CJS smoke failed to update duplicate attrs');
}

if (Backbone.Store !== Store) {
  throw new Error('CJS smoke failed to assign Backbone.Store');
}
