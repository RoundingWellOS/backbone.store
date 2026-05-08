import { extend } from 'underscore';

import Store from './index.js';

function createCache() {
  return Object.create(null);
}

/*
 * Encapsulates a cache for a single model.
 */
function ModelCache(Model, modelName) {
  this.instances = createCache();
  this.pending = [];
  this.Model = Model;
  this.modelName = modelName;
  this.ModelConstructor = this._getConstructor(Model);
}

extend(ModelCache.prototype, {

  _getConstructor(Model) {
    const cache = this;

    const ModelConstructor = function(attrs, options) {
      return cache.get(attrs, options);
    };

    // Extend Model's static properties onto new
    extend(ModelConstructor, Model);

    // Backbone collections need prototype of wrapped class
    ModelConstructor.prototype = this.Model.prototype;

    return ModelConstructor;
  },

  get(attrs, options) {
    const instanceKey = this._getKey(attrs);

    // Attempt to restore a locally cached instance
    const instance = this.find(instanceKey);

    if (!instance) {
      // If we haven't seen this instance before, start caching it
      return this._new(attrs, options);
    }

    // Otherwise update the attributes of the cached instance
    instance.set(attrs);

    Store.trigger('update', instance, this);

    return instance;
  },

  find(id) {
    const key = this._key(id);

    if (key == null) return;

    return this.instances[key];
  },

  has(id) {
    return !!this.find(id);
  },

  patch(id, attrs, options) {
    const instance = this.find(id);

    if (!instance) return;

    instance.set(attrs, options);

    Store.trigger('update', instance, this);

    return instance;
  },

  evict(id) {
    return this._removeKey(this._key(id));
  },

  inspect(id) {
    const key = this._key(id);
    const model = key == null ? undefined : this.instances[key];

    return {
      modelName: this.modelName,
      id,
      key,
      cached: !!model,
      model
    };
  },

  reset() {
    Object.keys(this.instances).forEach(key => {
      this._detachCached(this.instances[key]);
    });

    this.pending.slice().forEach(instance => {
      this._detachPending(instance);
    });

    this.instances = createCache();
    this.pending = [];
  },

  _new(attrs, options) {
    const instance = new this.Model(attrs, options);

    if (instance.isNew()) {
      // Store the instance if we get an id after instantation
      this._trackPending(instance);
    } else {
      this._add(instance);
    }

    return instance;
  },

  _add(instance) {
    const key = this._getModelKey(instance);

    this._detachPending(instance);

    if (key == null) return;

    // If the id is already stored do not add it.
    if (this.instances[key]) return;

    this.instances[key] = instance;
    this._attachCached(instance);

    Store.trigger('add', instance, this);
  },

  remove(instance) {
    this._removeKey(this._getModelKey(instance), instance);

    return instance;
  },

  _getKey(attrs) {
    return attrs && this._key(attrs[this.Model.prototype.idAttribute]);
  },

  _getModelKey(instance) {
    if (!instance) return;

    return this._key(instance.id);
  },

  _key(id) {
    if (id == null) return;

    return String(id);
  },

  _trackPending(instance) {
    this.pending.push(instance);
    instance.once(`change:${ instance.idAttribute }`, this._add, this);
    instance.on('destroy', this._removePending, this);
  },

  _removePending(instance) {
    this._detachPending(instance);
  },

  _detachPending(instance) {
    const index = this.pending.indexOf(instance);

    if (index > -1) this.pending.splice(index, 1);

    instance.off(`change:${ instance.idAttribute }`, this._add, this);
    instance.off('destroy', this._removePending, this);
  },

  _attachCached(instance) {
    instance.on('destroy', this.remove, this);
  },

  _detachCached(instance) {
    instance.off('destroy', this.remove, this);
  },

  _removeKey(key, eventInstance) {
    if (key == null) return;

    const instance = this.instances[key];

    if (!instance) return;

    delete this.instances[key];
    this._detachCached(instance);

    // Preserve ModelCache#remove(instance) payload semantics even when an equal id is cached.
    Store.trigger('remove', eventInstance || instance, this);

    return instance;
  }
});

export default ModelCache;
