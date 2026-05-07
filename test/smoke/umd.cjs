const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
  Backbone: require('backbone'),
  console,
  _: require('underscore'),
};
context.window = context;
context.globalThis = context;
context.self = context;

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../../dist/backbone.store.js'), 'utf8'),
  context,
  { filename: 'backbone.store.js' }
);

if (typeof context.Backbone.Store !== 'function') {
  throw new Error('UMD smoke failed to assign Backbone.Store');
}

if (context.Store) {
  throw new Error('UMD smoke leaked a Store global');
}

const StoredModel = context.Backbone.Store(context.Backbone.Model, 'umd-smoke');
const first = new StoredModel({ id: 1, name: 'first' });
const second = new StoredModel({ id: '1', name: 'second' });

if (first !== second) {
  throw new Error('UMD smoke failed to preserve unique instances');
}

if (first.get('name') !== 'second') {
  throw new Error('UMD smoke failed to update duplicate attrs');
}
