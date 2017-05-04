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
  _getConstructor: function _getConstructor(Model) {
    var cache = this;

    var modelConstructor = function modelConstructor(attrs, options) {
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
  getIndex: function getIndex(id) {
    return id;
  },
  get: function get(attrs, options) {
    var index = this.getIndex(attrs && attrs[this.Model.prototype.idAttribute]);

    // Attempt to restore a locally cached instance
    var instance = this.instances[index];

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this.new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs, options);

    Store.trigger('update', instance, this);

    return instance;
  },
  new: function _new(attrs, options) {
    var instance = new this.Model(attrs, options);

    if (instance.isNew()) {
      // Store the instance if we get an id after instantation
      instance.once('change:' + instance.idAttribute, this.add, this);
    } else {
      this.add(instance);
    }

    instance.on('destroy', this.remove, this);

    return instance;
  },
  add: function add(instance) {
    var index = this.getIndex(instance.id);

    // If the instance is not already stored, store it
    if (!this.instances[index]) this.instances[index] = instance;

    Store.trigger('add', instance, this);

    return instance;
  },
  remove: function remove(instance) {
    var index = this.getIndex(instance.id);

    if (this.instances[index]) delete this.instances[index];

    Store.trigger('remove', instance, this);

    return instance;
  }
});

var Models = {};

/**
 * Store wrapper converts regular Backbone models into unique ones.
 *
 * Example:
 *   const UniqueUser = Store(User);
 */
function Store(Model) {
  var modelName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _.uniqueId('Store_');

  var cache = Store.add(Model, modelName);

  return cache.modelConstructor;
}

// Static functions
_.extend(Store, Backbone.Events, {

  ModelCache: ModelCache,

  get: function get(modelName) {
    if (!Models[modelName]) throw 'Unrecognized Model: ' + modelName;

    return Models[modelName];
  },
  add: function add(Model, modelName) {
    if (!modelName) throw 'Model name required!';

    if (Models[modelName]) return Models[modelName];

    return Models[modelName] = new Store.ModelCache(Model, modelName);
  },
  remove: function remove(modelName) {
    delete Models[modelName];
  },
  getAll: function getAll() {
    return _.clone(Models);
  },
  removeAll: function removeAll() {
    for (var modelName in Models) {
      Store.remove(modelName);
    }
  }
});

Backbone.Store = Store;

export default Store;
//# sourceMappingURL=backbone.store.mjs.map
