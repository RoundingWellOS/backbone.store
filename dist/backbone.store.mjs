import _ from 'underscore';
import Backbone from 'backbone';

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
  _getConstructor: function _getConstructor(Model) {
    var cache = this;

    var ModelConstructor = function ModelConstructor(attrs, options) {
      return cache.get(attrs, options);
    };

    // Extend Model's static properties onto new
    _.extend(ModelConstructor, Model);

    // Backbone collections need prototype of wrapped class
    ModelConstructor.prototype = this.Model.prototype;

    return ModelConstructor;
  },
  get: function get(attrs, options) {
    var instanceId = attrs && attrs[this.Model.prototype.idAttribute];

    // Attempt to restore a locally cached instance
    var instance = this.instances[instanceId];

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this._new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs, options);

    Store.trigger('update', instance, this);

    return instance;
  },
  _new: function _new(attrs, options) {
    var instance = new this.Model(attrs, options);

    if (instance.isNew()) {
      // Store the instance if we get an id after instantation
      instance.once('change:' + instance.idAttribute, this._add, this);
    } else {
      this._add(instance);
    }

    instance.on('destroy', this.remove, this);

    return instance;
  },
  _add: function _add(instance) {
    // If the id is already stored do not add it.
    if (this.instances[instance.id]) return;

    this.instances[instance.id] = instance;

    Store.trigger('add', instance, this);
  },
  remove: function remove(instance) {
    if (!this.instances[instance.id]) return instance;

    delete this.instances[instance.id];

    Store.trigger('remove', instance, this);

    return instance;
  }
});

var ModelCaches = {};

/**
 * Store wrapper converts regular Backbone models into unique ones.
 *
 * Example:
 *   const StoredUser = Store(User);
 */
function Store(Model) {
  var modelName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _.uniqueId('Store_');

  var cache = Store.add(Model, modelName);

  return cache.ModelConstructor;
}

// Static functions
_.extend(Store, Backbone.Events, {

  ModelCache: ModelCache,

  add: function add(Model, modelName) {
    if (!modelName) throw 'Model name required';

    if (ModelCaches[modelName]) return ModelCaches[modelName];

    return ModelCaches[modelName] = new Store.ModelCache(Model, modelName);
  },
  getCache: function getCache(modelName) {
    if (!ModelCaches[modelName]) throw 'Unrecognized Model: "' + modelName + '"';

    return ModelCaches[modelName];
  },
  getAllCache: function getAllCache() {
    return _.clone(ModelCaches);
  },
  get: function get(modelName) {
    return Store.getCache(modelName).ModelConstructor;
  },
  getAll: function getAll() {
    return _.reduce(ModelCaches, function (all, cache, modelName) {
      all[modelName] = cache.ModelConstructor;
      return all;
    }, {});
  },
  remove: function remove(modelName) {
    delete ModelCaches[modelName];
  },
  removeAll: function removeAll() {
    ModelCaches = {};
  }
});

Backbone.Store = Store;

export default Store;
//# sourceMappingURL=backbone.store.mjs.map
