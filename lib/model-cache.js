import _ from 'underscore';

import Store from './index';

/*
 * Encapsulates a cache for a single model.
 */
function ModelCache(Model, modelName) {
  this.instances = {};
  this.Model = Model;
  this.modelName = modelName;
  this.modelConstructor = this._getConstructor(Model);
}

_.extend(ModelCache.prototype, {

  _getConstructor(Model) {
    const cache = this;

    const modelConstructor = function(attrs, options) {
      return cache.get(attrs, options);
    };

    // Extend Model's static properties onto new
    _.extend(modelConstructor, Model);

    // Backbone collections need prototype of wrapped class
    modelConstructor.prototype = this.Model.prototype;

    return modelConstructor;
  },

  // Override to provide a different instance index
  // ie: return id && String(id);
  getIndex(id) {
    return id;
  },

  get(attrs, options) {
    const index = this.getIndex(attrs && attrs[this.Model.prototype.idAttribute]);

    // Attempt to restore a locally cached instance
    const instance = this.instances[index];

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this.new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs, options);

    Store.trigger('update', instance, this);

    return instance;
  },

  new(attrs, options) {
    const instance = new this.Model(attrs, options);

    if (instance.isNew()) {
      // Store the instance if we get an id after instantation
      instance.once(`change:${ instance.idAttribute }`, this.add, this);
    } else {
      this.add(instance);
    }

    instance.on('destroy', this.remove, this);

    return instance;
  },

  add(instance) {
    const index = this.getIndex(instance.id)

    // If the instance is not already stored, store it
    if (!this.instances[index]) this.instances[index] = instance;

    Store.trigger('add', instance, this);

    return instance;
  },

  remove(instance) {
    const index = this.getIndex(instance.id);

    if (this.instances[index]) delete this.instances[index];

    Store.trigger('remove', instance, this);

    return instance;
  }
});

export default ModelCache;
