import _ from 'underscore';

import Store from './index';

/*
 * Encapsulates a cache for a single model.
 */
function ModelCache(Model, modelName) {
  this.instances = {};
  this.Model = Model;
  this.modelName = modelName;
  this.ModelConstructor = this._getConstructor(Model);
}

_.extend(ModelCache.prototype, {

  _getConstructor(Model) {
    const cache = this;

    const ModelConstructor = function(attrs, options) {
      return cache.get(attrs, options);
    };

    // Extend Model's static properties onto new
    _.extend(ModelConstructor, Model);

    // Backbone collections need prototype of wrapped class
    ModelConstructor.prototype = this.Model.prototype;

    return ModelConstructor;
  },

  get(attrs, options) {
    const instanceId = attrs && attrs[this.Model.prototype.idAttribute];

    // Attempt to restore a locally cached instance
    const instance = this.instances[instanceId];

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this._new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs, options);

    Store.trigger('update', instance, this);

    return instance;
  },

  _new(attrs, options) {
    const instance = new this.Model(attrs, options);

    if (instance.isNew()) {
      // Store the instance if we get an id after instantation
      instance.once(`change:${ instance.idAttribute }`, this._add, this);
    } else {
      this._add(instance);
    }

    instance.on('destroy', this.remove, this);

    return instance;
  },

  _add(instance) {
    // If the id is already stored do not add it.
    if (this.instances[instance.id]) return;

    this.instances[instance.id] = instance;

    Store.trigger('add', instance, this);
  },

  remove(instance) {
    if (!this.instances[instance.id]) return instance;

    delete this.instances[instance.id];

    Store.trigger('remove', instance, this);

    return instance;
  }
});

export default ModelCache;
