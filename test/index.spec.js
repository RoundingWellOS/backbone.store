import _ from 'underscore';
import Backbone from 'backbone';
import { expect, sandbox } from './setup';

import Store from '../dist/backbone.store';

describe('Backbone.Store', () => {
  let sinon;
  const Model1 = Backbone.Model.extend();
  const Model2 = Backbone.Model.extend();

  beforeEach(() => {
    sinon = sandbox.create();
  });

  afterEach(() => {
    sinon.restore();
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
