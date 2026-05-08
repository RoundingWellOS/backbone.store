import * as Backbone from 'backbone';
import Store, { ModelCache } from 'backbone.store';

const StoredModel = Store(Backbone.Model, 'types-smoke');
const model = new StoredModel({ id: 1 });
const found = Store.find('types-smoke', 1);
const cache = Store.getCache('types-smoke');
const inspection = Store.inspect('types-smoke', 1);
const CacheConstructor = ModelCache;

model.get('id');
found?.get('id');
cache.has(1);
inspection.model?.get('id');
Store.patch('types-smoke', 1, { name: 'ok' }, { silent: true });
Store.evict('types-smoke', 1);
new CacheConstructor(Backbone.Model, 'manual-cache');

// @ts-expect-error Store requires a Model constructor when called.
Store();

// @ts-expect-error modelName must be a string.
Store.find(1, 1);

// @ts-expect-error patch requires attributes.
Store.patch('types-smoke', 1);
