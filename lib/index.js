import _ from 'underscore';
import Backbone from 'backbone';

import ModelCache from './model-cache';

const Models = {};

/**
 * Store wrapper converts regular Backbone models into unique ones.
 *
 * Example:
 *   const UniqueUser = Store(User);
 */
function Store(Model, modelName = _.uniqueId('Store_')) {
  const cache = Store.add(Model, modelName);

  return cache.modelConstructor;
}

// Static functions
_.extend(Store, Backbone.Events, {

  ModelCache,

  get(modelName) {
    if (!Models[modelName]) throw `Unrecognized Model: ${ modelName }`;

    return Models[modelName];
  },

  add(Model, modelName) {
    if (!modelName) throw 'Model name required!';

    if (Models[modelName]) return Models[modelName];

    return Models[modelName] = new Store.ModelCache(Model, modelName);
  },

  remove(modelName) {
    delete Models[modelName];
  },

  getAll() {
    return _.clone(Models);
  },

  removeAll() {
    for (let modelName in Models) Store.remove(modelName);
  }
});

Backbone.Store = Store;

export default Store;
