# Backbone.Store

A store for keeping unique instances of Backbone models with ease.

## Usage

### Instantiating models

When creating a new model, if that model is already being tracked, you will be returned the original model instance.

```javascript
var StoredUser = Backbone.Store(User);

var first  = new StoredUser({ id: 1, name: 'Jean Grey' });
var second = new StoredUser({ id: 1, name: 'Jean Summers' });

first === second; // true
first.get('name') === 'Jean Summers'; // true
```

`Store` will also update the attributes of the instance to reflect the latest state.

### Working with collections

`Backbone.Store` also guarantees that instances created through a collection (e.g. via fetch) are also unique.

```javascript
var UserCollection = Backbone.Collection.extend({
  model: StoredUser
});

var users = new UserCollection([
  { id: 2, name: 'Henry McCoy' },
  { id: 3, name: 'Bobby Drake' }
]);

var user = new StoredUser({ id: 2, name: 'Henry McCoy' });
user === users.get(2); // true
```
## API

If you need additional control, `Store` exposes additional API and events.

### Store
`Store` contains only static methods as has no instance methods or constructor.

#### `Store(Model, [modelName])`
Returns a Stored Model defintion.
If `modelName` is not given a unique generate name will be used.

#### `Store.ModelCache`
`ModelCache` definition used internally.
Useful for overriding and extending.

#### `Store.add(Model, modelName)`
Adds a `ModelCache` for the `Model` definition by `modelName` to the store.
Returns the `ModelCache` for the `Model` definition.

#### `Store.getCache(modelName)`
Returns a `ModelCache` by name.

#### `Store.getAllCache()`
Returns all `ModelCache` instances by name.

#### `Store.get(modelName)`
Returns a Model definition by name.

#### `Store.getAll()`
Returns all Model definitions by name.

#### `Store.remove(modelName)`
Removes a `ModelCache` from `Store` by name.

#### `Store.removeAll()`
Removes the entire cache.

#### `Store` examples
```javscript
import Store from `backbone.store`;

const StoredModel = Store(Backbone.Model, 'myModel');

const StoredMyModel = Store.get('myModel');

console.log(StoredModel === StoredMyModel); // true

const MyModelCache = Store.getCache('myModel');

console.log(StoredModel ===  MyModelCache.ModelConstructor); // true

const Models = Store.getAll();

console.log(StoredModel === Models.myModel.modelConstructor);
```

### Store Events

#### `add`
Triggered when a new instance is added to a `ModelCache`
This event gets the instance and the `ModelCache` instance passed to it.

```javascript
// Clean cache
Store.removeAll();

Store.on('add', function(instance, ModelCache) {
  console.log('model added');
});

// logs "model added"
new StoredUser({ id: 1 });

const newUser = new StoredUser();

// logs "model added"
newUser.set({ id: 5 });
```

#### `update`
Triggered when a cached instance is returned. Any data instantiated updates the cached instance.
This event gets the instance and the `ModelCache` instance passed to it.

```javascript
// Clean cache
Store.removeAll();

Store.on('update', function(instance, ModelCache) {
  console.log('model updated: ' + instance.get('name'));
});

const user = new StoredUser({ id: 1 });

// logs "model updated: bob"
const user2 = new StoredUser({ id: 1, name: 'bob' });
```

#### `remove`
Triggered when an instance is removed from a `ModelCache`.
This event gets the instance and the `ModelCache` instance passed to it.

```javascript
// Clean cache
Store.removeAll();

Store.on('remove', function(instance, ModelCache) {
  console.log('model removed');
});

const user = new StoredUser({ id: 1 });

// logs "model removed"
user.destroy();
```

### ModelCache
`ModelCache` instances will be created for each `Model` added to the `Store`.
When a model instance is destroyed it will be removed automatically.

Instances will have four properties:
- `instances` - an object with each instance of the cache's `Model`
- `Model` - the original model defintion of the cache.
- `modelName` - the name the cache is stored as on the `Store`.
- `ModelConstructor` - the unique model definition return by the store.

#### `get(attrs, options)`
If the instance by index is not cached it is instantiated, cached, and returned.
Otherwise it returns the cached instance and sets the `attrs` on the model.
The `options` passed to this method will pass through to the `new` or the `set`.

#### `remove(instance)`
Removes the model instance from the cache.

## Acknowledgments

Backbone.Store is heavily inspired by [Backbone.UniqueModel](https://github.com/disqus/backbone.uniquemodel) written by [Ben Vinegar](http://github.com/benvinegar)

===

This library is © 2020 RoundingWell. Distributed under MIT license.
