import { clone, each, extend, reduce, uniqueId } from 'underscore';
import Backbone from 'backbone';

import ModelCache from './model-cache.js';

let ModelCaches = {};

const STORE_INSPECT_LABEL = '[Backbone.Store]';
const nodeInspectSymbol = typeof Symbol === 'function' && Symbol.for && Symbol.for('nodejs.util.inspect.custom');

function isCustomInspectCall(modelName, id) {
  return typeof modelName === 'number' && (id == null || typeof id === 'object');
}

/**
 * Store wrapper converts regular Backbone models into unique ones.
 *
 * Example:
 *   const StoredUser = Store(User);
 */
function Store(Model, modelName = uniqueId('Store_')) {
  const cache = Store.add(Model, modelName);

  return cache.ModelConstructor;
}

// Static functions
extend(Store, Backbone.Events, {

  ModelCache,

  add(Model, modelName) {
    if (!modelName) throw 'Model name required';

    if (ModelCaches[modelName]) return ModelCaches[modelName];

    return ModelCaches[modelName] = new Store.ModelCache(Model, modelName);
  },

  getCache(modelName) {
    if (!ModelCaches[modelName]) throw `Unrecognized Model: "${ modelName }"`;

    return ModelCaches[modelName];
  },

  getAllCache() {
    return clone(ModelCaches);
  },

  get(modelName) {
    return Store.getCache(modelName).ModelConstructor;
  },

  find(modelName, id) {
    return Store.getCache(modelName).find(id);
  },

  has(modelName, id) {
    return Store.getCache(modelName).has(id);
  },

  patch(modelName, id, attrs, options) {
    return Store.getCache(modelName).patch(id, attrs, options);
  },

  evict(modelName, id) {
    return Store.getCache(modelName).evict(id);
  },

  inspect(modelName, id) {
    // Chai/loupe and Node inspect call `.inspect(depth, options)` while formatting objects.
    if (isCustomInspectCall(modelName, id)) return STORE_INSPECT_LABEL;

    return Store.getCache(modelName).inspect(id);
  },

  getAll() {
    return reduce(ModelCaches, (all, cache, modelName) => {
      all[modelName] = cache.ModelConstructor;
      return all;
    }, {});
  },

  reset(modelName) {
    Store.getCache(modelName).reset();
  },

  resetAll() {
    each(ModelCaches, cache => {
      cache.reset();
    });
  },

  remove(modelName) {
    if (!ModelCaches[modelName]) return;

    ModelCaches[modelName].reset();

    delete ModelCaches[modelName];
  },

  removeAll() {
    Store.resetAll();

    ModelCaches = {};
  }
});

if (nodeInspectSymbol) Store[nodeInspectSymbol] = () => STORE_INSPECT_LABEL;

Backbone.Store = Store;

export {
  ModelCache,
};

export default Store;
