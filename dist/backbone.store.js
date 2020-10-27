(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('backbone')) :
  typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'backbone'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Store = {}, global._, global.Backbone));
}(this, (function (exports, _, Backbone) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var ___default = /*#__PURE__*/_interopDefaultLegacy(_);
  var Backbone__default = /*#__PURE__*/_interopDefaultLegacy(Backbone);

  /*
   * Encapsulates a cache for a single model.
   */

  function ModelCache(Model, modelName) {
    this.instances = {};
    this.Model = Model;
    this.modelName = modelName;
    this.ModelConstructor = this._getConstructor(Model);
  }

  ___default['default'].extend(ModelCache.prototype, {
    _getConstructor: function _getConstructor(Model) {
      var cache = this;

      var ModelConstructor = function ModelConstructor(attrs, options) {
        return cache.get(attrs, options);
      }; // Extend Model's static properties onto new


      ___default['default'].extend(ModelConstructor, Model); // Backbone collections need prototype of wrapped class


      ModelConstructor.prototype = this.Model.prototype;
      return ModelConstructor;
    },
    get: function get(attrs, options) {
      var instanceId = attrs && attrs[this.Model.prototype.idAttribute]; // Attempt to restore a locally cached instance

      var instance = this.instances[instanceId];

      if (!instance) {
        // If we haven't seen this instance before, start caching it
        return this._new(attrs, options);
      } // Otherwise update the attributes of the cached instance


      instance.set(attrs);
      Store.trigger('update', instance, this);
      return instance;
    },
    _new: function _new(attrs, options) {
      var instance = new this.Model(attrs, options);

      if (instance.isNew()) {
        // Store the instance if we get an id after instantation
        instance.once("change:".concat(instance.idAttribute), this._add, this);
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
    var modelName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ___default['default'].uniqueId('Store_');
    var cache = Store.add(Model, modelName);
    return cache.ModelConstructor;
  } // Static functions


  ___default['default'].extend(Store, Backbone__default['default'].Events, {
    ModelCache: ModelCache,
    add: function add(Model, modelName) {
      if (!modelName) throw 'Model name required';
      if (ModelCaches[modelName]) return ModelCaches[modelName];
      return ModelCaches[modelName] = new Store.ModelCache(Model, modelName);
    },
    getCache: function getCache(modelName) {
      if (!ModelCaches[modelName]) throw "Unrecognized Model: \"".concat(modelName, "\"");
      return ModelCaches[modelName];
    },
    getAllCache: function getAllCache() {
      return ___default['default'].clone(ModelCaches);
    },
    get: function get(modelName) {
      return Store.getCache(modelName).ModelConstructor;
    },
    getAll: function getAll() {
      return ___default['default'].reduce(ModelCaches, function (all, cache, modelName) {
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

  Backbone__default['default'].Store = Store;

  exports.ModelCache = ModelCache;
  exports.default = Store;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=backbone.store.js.map
