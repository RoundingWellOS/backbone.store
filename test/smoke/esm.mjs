import Backbone from 'backbone';
import Store from 'backbone.store';

const StoredModel = Store(Backbone.Model, 'esm-smoke');
const first = new StoredModel({ id: 1, name: 'first' });
const second = new StoredModel({ id: '1', name: 'second' });

if (first !== second) {
  throw new Error('ESM smoke failed to preserve unique instances');
}

if (first.get('name') !== 'second') {
  throw new Error('ESM smoke failed to update duplicate attrs');
}

if (Backbone.Store !== Store) {
  throw new Error('ESM smoke failed to assign Backbone.Store');
}
