(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('backbone')) :
  typeof define === 'function' && define.amd ? define(['underscore', 'backbone'], factory) :
  (global.Store = factory(global._,global.Backbone));
}(this, (function (_,Backbone) { 'use strict';

_ = 'default' in _ ? _['default'] : _;
Backbone = 'default' in Backbone ? Backbone['default'] : Backbone;

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
    _.extend(modelConstructor, Model, Backbone.Events);

    // Backbone collections need prototype of wrapped class
    modelConstructor.prototype = this.Model.prototype;

    return modelConstructor;
  },


  // Override for different casting options
  getId: function getId(id) {
    // Return a string id
    return id && String(id);
  },
  get: function get(attrs, options) {
    var id = this.getId(attrs && attrs[this.Model.prototype.idAttribute]);

    // Attempt to restore a locally cached instance
    var instance = this.instances[id];

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this.new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs, options);

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
    var id = this.getId(instance.id);

    // If the instance is not already stored, store it
    if (!this.instances[id]) this.instances[id] = instance;

    return instance;
  },
  remove: function remove(instance) {
    var id = this.getId(instance.id);

    // Stop tracking this model; otherwise mem leak (there are other
    // sources of memory leaks we need to address, but hey, here's one)
    if (this.instances[id]) delete this.instances[id];

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

  var ModelCache$$1 = Store.add(Model, modelName);

  return ModelCache$$1.modelConstructor;
}

// Static functions
_.extend(Store, {
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
  clear: function clear() {
    for (var modelName in Models) {
      this.remove(modelName);
    }
  }
});

Backbone.Store = Store;

return Store;

})));
//# sourceMappingURL=backbone.store.js.map
