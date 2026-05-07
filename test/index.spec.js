import _ from 'underscore';
import Backbone from 'backbone';
import sinonCreate from 'sinon';
import { expect } from './setup.js';

import Store from '../lib/index.js';

describe('Backbone.Store', () => {
  let sinon;
  const Model1 = Backbone.Model.extend();
  const Model2 = Backbone.Model.extend();

  beforeEach(() => {
    sinon = sinonCreate.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    Store.off();
    Store.removeAll();
  });

  describe('Store', () => {
    beforeEach(() => {
      sinon.spy(Store, 'add');
    });

    it('should call "add" passing the arguments', () => {
      Store(Model1, 'name');
      expect(Store.add).to.have.been.calledOnce.and.calledWith(Model1, 'name');
    });

    it('should create a unique name if one is not given', () => {
      Store(Model1);
      expect(Store.add).to.have.been.calledOnce.and.calledWith(Model1, sinon.match('Store_'));
    });

    it('should return a constructor of type Model', () => {
      const StoredModel = Store(Model1);
      expect(new StoredModel).to.be.instanceof(Model1);
    });
  });

  describe('add', () => {
    beforeEach(() => {
      Store(Model1, 'foo');
    });

    describe('when the Model is not cached', () => {
      it('should return the ModelCache', () => {
        expect(Store.add(Model2, 'bar').Model).to.equal(Model2);
      });

      it('should instantiate a new ModelCache', () => {
        sinon.spy(Store, 'ModelCache');
        Store.add(Model2, 'bar');
        expect(Store.ModelCache).to.have.be.calledOnce.and.calledWith(Model2, 'bar');
      });
    });

    describe('when the Model is cached', () => {
      it('should return the ModelCache', () => {
        expect(Store.add(Model1, 'foo').Model).to.equal(Model1);
      });

      it('should not instantiate a new ModelCache', () => {
        sinon.spy(Store, 'ModelCache');
        Store.add(Model1, 'foo');
        expect(Store.ModelCache).to.not.be.called;
      });
    });

    describe('when a modelName is not passed', () => {
      it('should throw an error', () => {
        expect(_.partial(Store.add, Model1)).to.throw('Model name required');
      });
    });
  });

  describe('getCache', () => {
    beforeEach(() => {
      Store(Model1, 'foo');
    });

    describe('when the Model is cached', () => {
      it('shoudl return a ModelCache for the Model', () => {
        expect(Store.getCache('foo').Model).to.equal(Model1);
      });
    });

    describe('when a modelName is not recognized', () => {
      it('should throw an error', () => {
        expect(_.partial(Store.getCache, 'bar')).to.throw('Unrecognized Model: "bar"');
      });
    });
  });

  describe('getAllCache', () => {
    beforeEach(() => {
      Store(Model1, 'foo');
      Store(Model2, 'bar');
    });

    it('should return an object of all ModelCaches', () => {
      const cache = Store.getAllCache();
      expect(cache).to.contain.all.keys('foo','bar');
      expect(cache['foo'].Model).to.equal(Model1);
      expect(cache['bar'].Model).to.equal(Model2);
    });

    it('should return a clone of the ModelsCaches', () => {
      const cache = Store.getAllCache();
      delete cache['foo'];
      expect(Store.getAllCache()['foo'].Model).to.equal(Model1);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      Store(Model1, 'foo');
    });

    describe('when the Model is cached', () => {
      it('should return the unique constructor', () => {
        const StoredModel = Store.get('foo');
        expect(new StoredModel).to.be.instanceof(Model1);
      });
    });

    describe('when a modelName is not recognized', () => {
      it('should throw an error', () => {
        expect(_.partial(Store.get, 'bar')).to.throw('Unrecognized Model: "bar"');
      });
    });
  });

  describe('find', () => {
    let instance;

    beforeEach(() => {
      const StoredModel = Store(Model1, 'foo');
      instance = new StoredModel({ id: 1 });
    });

    it('should return a cached model by name and id', () => {
      expect(Store.find('foo', '1')).to.equal(instance);
    });

    it('should return undefined for a missing model', () => {
      expect(Store.find('foo', 2)).to.be.undefined;
    });

    it('should return undefined for a nullish id', () => {
      expect(Store.find('foo')).to.be.undefined;
      expect(Store.find('foo', null)).to.be.undefined;
    });

    it('should throw when a modelName is not recognized', () => {
      expect(_.partial(Store.find, 'bar', 1)).to.throw('Unrecognized Model: "bar"');
    });
  });

  describe('has', () => {
    beforeEach(() => {
      const StoredModel = Store(Model1, 'foo');
      new StoredModel({ id: 1 });
    });

    it('should return true for a cached model', () => {
      expect(Store.has('foo', '1')).to.be.true;
    });

    it('should return false for a missing model', () => {
      expect(Store.has('foo', 2)).to.be.false;
    });

    it('should return false for a nullish id', () => {
      expect(Store.has('foo')).to.be.false;
      expect(Store.has('foo', null)).to.be.false;
    });

    it('should throw when a modelName is not recognized', () => {
      expect(_.partial(Store.has, 'bar', 1)).to.throw('Unrecognized Model: "bar"');
    });
  });

  describe('patch', () => {
    let instance;

    beforeEach(() => {
      const StoredModel = Store(Model1, 'foo');
      instance = new StoredModel({ id: 1 });
    });

    it('should patch a cached model by name and id', () => {
      expect(Store.patch('foo', '1', { foo: 'bar' })).to.equal(instance);
      expect(instance.get('foo')).to.equal('bar');
    });

    it('should pass options to set', () => {
      sinon.spy(instance, 'set');
      const attrs = { foo: 'bar' };
      const options = { silent: true };

      Store.patch('foo', 1, attrs, options);

      expect(instance.set).to.have.been.calledOnce.and.calledWithExactly(attrs, options);
    });

    it('should return undefined for a missing model', () => {
      expect(Store.patch('foo', 2, { foo: 'bar' })).to.be.undefined;
    });

    it('should return undefined for a nullish id', () => {
      expect(Store.patch('foo', null, { foo: 'bar' })).to.be.undefined;
    });

    it('should throw when a modelName is not recognized', () => {
      expect(_.partial(Store.patch, 'bar', 1, {})).to.throw('Unrecognized Model: "bar"');
    });
  });

  describe('evict', () => {
    let instance;

    beforeEach(() => {
      const StoredModel = Store(Model1, 'foo');
      instance = new StoredModel({ id: 1 });
    });

    it('should remove and return a cached model by name and id', () => {
      expect(Store.evict('foo', '1')).to.equal(instance);
      expect(Store.find('foo', 1)).to.be.undefined;
    });

    it('should return undefined for a missing model', () => {
      expect(Store.evict('foo', 2)).to.be.undefined;
    });

    it('should return undefined for a nullish id', () => {
      expect(Store.evict('foo', null)).to.be.undefined;
    });

    it('should throw when a modelName is not recognized', () => {
      expect(_.partial(Store.evict, 'bar', 1)).to.throw('Unrecognized Model: "bar"');
    });
  });

  describe('inspect', () => {
    let instance;

    beforeEach(() => {
      const StoredModel = Store(Model1, 'foo');
      instance = new StoredModel({ id: 1 });
    });

    it('should describe a cached model by name and id', () => {
      expect(Store.inspect('foo', 1)).to.eql({
        modelName: 'foo',
        id: 1,
        key: '1',
        cached: true,
        model: instance
      });
    });

    it('should describe a missing model', () => {
      expect(Store.inspect('foo', 2)).to.eql({
        modelName: 'foo',
        id: 2,
        key: '2',
        cached: false,
        model: undefined
      });
    });

    it('should describe a nullish id', () => {
      expect(Store.inspect('foo', null)).to.eql({
        modelName: 'foo',
        id: null,
        key: undefined,
        cached: false,
        model: undefined
      });
    });

    it('should throw when a modelName is not recognized', () => {
      expect(_.partial(Store.inspect, 'bar', 1)).to.throw('Unrecognized Model: "bar"');
    });
  });

  describe('getAll', () => {
    it('should return an object of each model contructor', () => {
      Store(Model1, 'foo');
      Store(Model2, 'bar');
      const constructors = Store.getAll();
      expect(constructors).to.contain.all.keys('foo','bar');
      expect(new constructors['foo']).to.be.instanceof(Model1);
      expect(new constructors['bar']).to.be.instanceof(Model2);
    });
  });

  describe('remove', () => {
    it('should clear a cache by name', () => {
      Store(Model1, 'foo');
      Store(Model2, 'bar');
      Store.remove('foo');
      const cache = Store.getAllCache();
      expect(cache).to.not.contain.keys('foo');
      expect(cache).to.contain.keys('bar');
    });

    it('should detach listeners from cached instances', () => {
      const onRemove = sinon.stub();
      Store.on('remove', onRemove);
      const StoredModel = Store(Model1, 'foo');
      const instance = new StoredModel({ id: 1 });

      Store.remove('foo');
      instance.trigger('destroy', instance, instance.collection, {});

      expect(onRemove).to.not.have.been.called;
    });

    it('should not throw when a modelName is not recognized', () => {
      expect(Store.remove('bar')).to.be.undefined;
    });
  });

  describe('reset', () => {
    it('should clear a cache by name without removing the ModelCache', () => {
      const StoredModel = Store(Model1, 'foo');
      new StoredModel({ id: 1 });

      Store.reset('foo');

      expect(Store.find('foo', 1)).to.be.undefined;
      expect(Store.get('foo')).to.equal(StoredModel);
    });

    it('should not trigger a "remove" event', () => {
      const onRemove = sinon.stub();
      Store.on('remove', onRemove);
      const StoredModel = Store(Model1, 'foo');
      new StoredModel({ id: 1 });

      Store.reset('foo');

      expect(onRemove).to.not.have.been.called;
    });

    it('should throw when a modelName is not recognized', () => {
      expect(_.partial(Store.reset, 'bar')).to.throw('Unrecognized Model: "bar"');
    });
  });

  describe('resetAll', () => {
    it('should clear all caches without removing ModelCaches', () => {
      const StoredModel1 = Store(Model1, 'foo');
      const StoredModel2 = Store(Model2, 'bar');
      new StoredModel1({ id: 1 });
      new StoredModel2({ id: 2 });

      Store.resetAll();

      expect(Store.find('foo', 1)).to.be.undefined;
      expect(Store.find('bar', 2)).to.be.undefined;
      expect(Store.get('foo')).to.equal(StoredModel1);
      expect(Store.get('bar')).to.equal(StoredModel2);
    });

    it('should not trigger a "remove" event', () => {
      const onRemove = sinon.stub();
      Store.on('remove', onRemove);
      const StoredModel = Store(Model1, 'foo');
      new StoredModel({ id: 1 });

      Store.resetAll();

      expect(onRemove).to.not.have.been.called;
    });
  });

  describe('removeAll', () => {
    it('should clear the Store cache', () => {
      Store(Model1, 'foo');
      Store(Model2, 'bar');
      const cache = Store.getAllCache();
      Store.removeAll();
      const clearedCache = Store.getAllCache();
      expect(clearedCache).to.not.eql(cache);
      expect(clearedCache).to.be.empty;
    });
  });
});
