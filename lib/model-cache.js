import _ from 'underscore';
import Backbone from 'backbone';

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
    _.extend(modelConstructor, Model, Backbone.Events);

    // Backbone collections need prototype of wrapped class
    modelConstructor.prototype = this.Model.prototype;

    return modelConstructor;
  },

  // Override for different casting options
  getId(id) {
    // Return a string id
    return id && String(id);
  },

  get(attrs, options) {
    const id = this.getId(attrs && attrs[this.Model.prototype.idAttribute]);

    // Attempt to restore a locally cached instance
    const instance = this.instances[id];

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this.new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs, options);

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
    const id = this.getId(instance.id)

    // If the instance is not already stored, store it
    if (!this.instances[id]) this.instances[id] = instance;

    return instance;
  },

  remove(instance) {
    const id = this.getId(instance.id);

    // Stop tracking this model; otherwise mem leak (there are other
    // sources of memory leaks we need to address, but hey, here's one)
    if (this.instances[id]) delete this.instances[id];

    return instance;
  }
});

export default ModelCache;
