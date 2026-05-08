const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
  Backbone: require('backbone'),
  console,
  _: require('underscore'),
};

context.define = function(deps, factory) {
  const exports = {};
  const modules = deps.map(dep => {
    if (dep === 'exports') return exports;
    if (dep === 'underscore') return context._;
    if (dep === 'backbone') return context.Backbone;

    throw new Error(`Unexpected AMD dependency: ${ dep }`);
  });

  factory(...modules);
  context.amdExports = exports;
};
context.define.amd = true;
context.globalThis = context;
context.self = context;
context.window = context;

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../../dist/backbone.store.js'), 'utf8'),
  context,
  { filename: 'backbone.store.js' }
);

if (typeof context.amdExports.default !== 'function') {
  throw new Error('AMD smoke failed to expose default Store export');
}

if (typeof context.amdExports.ModelCache !== 'function') {
  throw new Error('AMD smoke failed to expose ModelCache export');
}

if (context.Backbone.Store !== context.amdExports.default) {
  throw new Error('AMD smoke failed to assign Backbone.Store');
}
