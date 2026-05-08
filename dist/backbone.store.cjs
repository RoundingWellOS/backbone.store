Object.defineProperties(exports, {
	__esModule: { value: true },
	[Symbol.toStringTag]: { value: "Module" }
});
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let underscore = require("underscore");
let backbone = require("backbone");
backbone = __toESM(backbone, 1);
//#region lib/model-cache.js
function createCache() {
	return Object.create(null);
}
function ModelCache(Model, modelName) {
	this.instances = createCache();
	this.pending = [];
	this.Model = Model;
	this.modelName = modelName;
	this.ModelConstructor = this._getConstructor(Model);
}
(0, underscore.extend)(ModelCache.prototype, {
	_getConstructor(Model) {
		const cache = this;
		const ModelConstructor = function(attrs, options) {
			return cache.get(attrs, options);
		};
		(0, underscore.extend)(ModelConstructor, Model);
		ModelConstructor.prototype = this.Model.prototype;
		return ModelConstructor;
	},
	get(attrs, options) {
		const instanceKey = this._getKey(attrs);
		const instance = this.find(instanceKey);
		if (!instance) return this._new(attrs, options);
		instance.set(attrs);
		Store.trigger("update", instance, this);
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
		Store.trigger("update", instance, this);
		return instance;
	},
	evict(id) {
		return this._removeKey(this._key(id));
	},
	inspect(id) {
		const key = this._key(id);
		const model = key == null ? void 0 : this.instances[key];
		return {
			modelName: this.modelName,
			id,
			key,
			cached: !!model,
			model
		};
	},
	reset() {
		Object.keys(this.instances).forEach((key) => {
			this._detachCached(this.instances[key]);
		});
		this.pending.slice().forEach((instance) => {
			this._detachPending(instance);
		});
		this.instances = createCache();
		this.pending = [];
	},
	_new(attrs, options) {
		const instance = new this.Model(attrs, options);
		if (instance.isNew()) this._trackPending(instance);
		else this._add(instance);
		return instance;
	},
	_add(instance) {
		const key = this._getModelKey(instance);
		this._detachPending(instance);
		if (key == null) return;
		if (this.instances[key]) return;
		this.instances[key] = instance;
		this._attachCached(instance);
		Store.trigger("add", instance, this);
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
		instance.once(`change:${instance.idAttribute}`, this._add, this);
		instance.on("destroy", this._removePending, this);
	},
	_removePending(instance) {
		this._detachPending(instance);
	},
	_detachPending(instance) {
		const index = this.pending.indexOf(instance);
		if (index > -1) this.pending.splice(index, 1);
		instance.off(`change:${instance.idAttribute}`, this._add, this);
		instance.off("destroy", this._removePending, this);
	},
	_attachCached(instance) {
		instance.on("destroy", this.remove, this);
	},
	_detachCached(instance) {
		instance.off("destroy", this.remove, this);
	},
	_removeKey(key, eventInstance) {
		if (key == null) return;
		const instance = this.instances[key];
		if (!instance) return;
		delete this.instances[key];
		this._detachCached(instance);
		Store.trigger("remove", eventInstance || instance, this);
		return instance;
	}
});
//#endregion
//#region lib/index.js
let ModelCaches = {};
const STORE_INSPECT_LABEL = "[Backbone.Store]";
const nodeInspectSymbol = typeof Symbol === "function" && Symbol.for && Symbol.for("nodejs.util.inspect.custom");
function isCustomInspectCall(modelName, id) {
	return typeof modelName === "number" && (id == null || typeof id === "object");
}
/**
* Store wrapper converts regular Backbone models into unique ones.
*
* Example:
*   const StoredUser = Store(User);
*/
function Store(Model, modelName = (0, underscore.uniqueId)("Store_")) {
	return Store.add(Model, modelName).ModelConstructor;
}
(0, underscore.extend)(Store, backbone.default.Events, {
	ModelCache,
	add(Model, modelName) {
		if (!modelName) throw "Model name required";
		if (ModelCaches[modelName]) return ModelCaches[modelName];
		return ModelCaches[modelName] = new Store.ModelCache(Model, modelName);
	},
	getCache(modelName) {
		if (!ModelCaches[modelName]) throw `Unrecognized Model: "${modelName}"`;
		return ModelCaches[modelName];
	},
	getAllCache() {
		return (0, underscore.clone)(ModelCaches);
	},
	get(modelName) {
		return Store.getCache(modelName).ModelConstructor;
	},
	find(modelName, id) {
		return Store.getCache(modelName).find(id);
	},
	has(modelName, id) {
		return Store.getCache(modelName).has(id);
	},
	patch(modelName, id, attrs, options) {
		return Store.getCache(modelName).patch(id, attrs, options);
	},
	evict(modelName, id) {
		return Store.getCache(modelName).evict(id);
	},
	inspect(modelName, id) {
		if (isCustomInspectCall(modelName, id)) return STORE_INSPECT_LABEL;
		return Store.getCache(modelName).inspect(id);
	},
	getAll() {
		return (0, underscore.reduce)(ModelCaches, (all, cache, modelName) => {
			all[modelName] = cache.ModelConstructor;
			return all;
		}, {});
	},
	reset(modelName) {
		Store.getCache(modelName).reset();
	},
	resetAll() {
		(0, underscore.each)(ModelCaches, (cache) => {
			cache.reset();
		});
	},
	remove(modelName) {
		if (!ModelCaches[modelName]) return;
		ModelCaches[modelName].reset();
		delete ModelCaches[modelName];
	},
	removeAll() {
		Store.resetAll();
		ModelCaches = {};
	}
});
if (nodeInspectSymbol) Store[nodeInspectSymbol] = () => STORE_INSPECT_LABEL;
backbone.default.Store = Store;
//#endregion
exports.ModelCache = ModelCache;
exports.default = Store;

//# sourceMappingURL=backbone.store.cjs.map