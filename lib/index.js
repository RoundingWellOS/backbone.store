import _ from 'underscore';
import Backbone from 'backbone';

import ModelCache from './model-cache';

let ModelCaches = {};

/**
 * Store wrapper converts regular Backbone models into unique ones.
 *
 * Example:
 *   const StoredUser = Store(User);
 */
function Store(Model, modelName = _.uniqueId('Store_')) {
  const cache = Store.add(Model, modelName);

  return cache.ModelConstructor;
}

// Static functions
_.extend(Store, Backbone.Events, {

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
    return _.clone(ModelCaches);
  },

  get(modelName) {
    return Store.getCache(modelName).ModelConstructor;
  },

  getAll() {
    return _.reduce(ModelCaches, (all, cache, modelName) => {
      all[modelName] = cache.ModelConstructor;
      return all;
    }, {});
  },

  remove(modelName) {
    delete ModelCaches[modelName];
  },

  removeAll() {
    ModelCaches = {};
  }
});

Backbone.Store = Store;

export default Store;
