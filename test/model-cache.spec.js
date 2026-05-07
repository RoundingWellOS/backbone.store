import Backbone from 'backbone';
import sinonCreate from 'sinon';
import { expect } from './setup.js';

import Store, { ModelCache } from '../lib/index.js';

describe('ModelCache', () => {
  let sinon;

  beforeEach(() => {
    sinon = sinonCreate.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    Store.off();
  });

  describe('ModelCache', () => {
    let modelCache;
    let Model;
    let protoFunc = () => {};
    let staticFunc = () => {};

    beforeEach(() => {
      Model = Backbone.Model.extend({
        protoFunc
      }, {
        staticFunc
      });
      modelCache = new ModelCache(Model, 'test');
    });

    it('should attach an instances object to the instance', () => {
      expect(modelCache.instances).to.be.empty;
      expect(Object.getPrototypeOf(modelCache.instances)).to.be.null;
    });

    it('should attach a pending array to the instance', () => {
      expect(modelCache.pending).to.eql([]);
    });

    it('should attach the Model to the instance', () => {
      expect(modelCache.Model).to.equal(Model);
    });

    it('should attach the modelName to the instance', () => {
      expect(modelCache.modelName).to.equal('test');
    });

    it('should attach a constructor with the original prototype properties', () => {
      expect(modelCache.ModelConstructor.prototype.protoFunc).to.equal(protoFunc);
    });

    it('should attach a constructor with the original "static" properties', () => {
      expect(modelCache.ModelConstructor.staticFunc).to.equal(staticFunc);
    });

    it('should attach a constructor with the original extend function', () => {
      const ChildModel = modelCache.ModelConstructor.extend({});

      expect(new ChildModel).to.be.instanceof(Model);
    });

    describe('when calling the modelCache.ModelConstructor', () => {
      it('should pass the arguments to the modelCache get()', () => {
        sinon.spy(modelCache, 'get');
        const attrs = { foo: 'bar' };
        const options = { merge: true }
        new modelCache.ModelConstructor(attrs, options);
        expect(modelCache.get).to.have.been.calledOnce.and.calledWith(attrs, options);
      });
    });
  });

  describe('get', () => {
    let modelCache;

    beforeEach(() => {
      const Model = Backbone.Model.extend({
        idAttribute: '_id'
      });
      modelCache = new ModelCache(Model, 'test');
    });

    describe('when getting a non-cached instance', () => {
      describe('when the instance isNew', () => {
        let instance;
        let onAdd;
        const attrs = { foo: 'bar' };
        const options = { merge: true };

        beforeEach(() => {
          onAdd = sinon.stub();
          Store.on('add', onAdd);
          sinon.spy(modelCache, 'Model');
          instance = modelCache.get(attrs, options);
        });

        it('should instantiate the Model', () => {
          expect(modelCache.Model).to.be.calledOnce.and.calledWith(attrs, options);
        });

        it('should return the instance', () => {
          expect(instance.attributes).to.eql(attrs);
        });

        it('should not add the instance to the cache', () => {
          expect(modelCache.instances).to.be.empty;
        });

        it('should add the instance to the pending cache', () => {
          expect(modelCache.pending).to.eql([instance]);
        });

        it('should not trigger the "add" event on the Store', () => {
          expect(onAdd).not.to.have.been.called;
        });

        describe('when the pending instance is destroyed before getting an id', () => {
          let onRemove;

          beforeEach(() => {
            onRemove = sinon.stub();
            Store.on('remove', onRemove);
            instance.trigger('destroy', instance, instance.collection, {});
          });

          it('should remove the instance from the pending cache', () => {
            expect(modelCache.pending).to.be.empty;
          });

          it('should not trigger the "remove" event on the Store', () => {
            expect(onRemove).to.not.have.been.called;
          });

          it('should detach the id listener', () => {
            instance.set({ _id: 1 });

            expect(modelCache.instances).to.be.empty;
            expect(onAdd).to.not.have.been.called;
          });
        });

        describe('when the instance is given an id', () => {
          beforeEach(function() {
            instance.set({ _id: 1 });
          });

          it('should add the instance to the cache', () => {
            expect(modelCache.instances[1]).to.equal(instance);
          });

          it('should trigger the "add" event on the Store', () => {
            expect(onAdd).to.have.been.calledOnce.and.calledWith(instance, modelCache);
          });

          it('should remove the instance from the pending cache', () => {
            expect(modelCache.pending).to.be.empty;
          });
        });

        describe('when the instance is given an existing id', () => {
          beforeEach(function() {
            modelCache.get({ _id: 1 });
            onAdd.reset();
            instance.set({ _id: 1 });
          });

          it('should not change the instance in the cache', () => {
            expect(modelCache.instances[1]).to.not.equal(instance);
          });

          it('should not trigger the "add" event on the Store', () => {
            expect(onAdd).not.to.have.been.called;
          });

          it('should remove the instance from the pending cache', () => {
            expect(modelCache.pending).to.be.empty;
          });
        });
      });

      describe('when the instance is not "new"', () => {
        let instance;
        let onAdd;
        const attrs = { _id: 1, foo: 'bar' };
        const options = { merge: true };

        beforeEach(() => {
          onAdd = sinon.stub();
          Store.on('add', onAdd);
          sinon.spy(modelCache, 'Model');
          instance = modelCache.get(attrs, options);
        });

        it('should instantiate the Model', () => {
          expect(modelCache.Model).to.be.calledOnce.and.calledWith(attrs, options);
        });

        it('should return the instance', () => {
          expect(instance.attributes).to.eql(attrs);
        });

        it('should add the instance to the cache', () => {
          expect(modelCache.instances[1]).to.equal(instance);
        });

        it('should trigger the "add" event on the Store', () => {
          expect(onAdd).to.have.been.calledOnce.and.calledWith(instance, modelCache);
        });
      });
    });

    describe('when getting a cached instance', () => {
      let cachedInstance;

      beforeEach(() => {
        cachedInstance = new modelCache.ModelConstructor({ _id: 1 });
      });

      it('should set the attrs and not pass the options', () => {
        sinon.spy(cachedInstance, 'set');
        const attrs = { _id: 1, foo: 'bar' };
        const options = { merge: true };
        modelCache.get(attrs, options);
        expect(cachedInstance.set).to.have.been.calledOnce.and.calledWithExactly(attrs);
      });

      it('should trigger the "update" event on Store', () => {
        const onUpdate = sinon.stub();
        Store.on('update', onUpdate);
        modelCache.get({ _id: 1 });
        expect(onUpdate).to.have.been.calledOnce.and.calledWith(cachedInstance, modelCache);
      });

      it('should return the cachedInstance', () => {
        expect(modelCache.get({ _id: 1 })).to.equal(cachedInstance);
      });

      it('should use the same cache key for numeric and string ids', () => {
        expect(modelCache.get({ _id: '1' })).to.equal(cachedInstance);
      });
    });

    describe('when getting ids matching object prototype properties', () => {
      it('should cache a toString id', () => {
        const instance = modelCache.get({ _id: 'toString' });

        expect(modelCache.get({ _id: 'toString' })).to.equal(instance);
      });

      it('should cache a __proto__ id', () => {
        const instance = modelCache.get({ _id: '__proto__' });

        expect(modelCache.get({ _id: '__proto__' })).to.equal(instance);
      });
    });
  });

  describe('find', () => {
    let modelCache;
    let instance;

    beforeEach(() => {
      const Model = Backbone.Model.extend();
      modelCache = new ModelCache(Model, 'test');
      instance = new modelCache.ModelConstructor({ id: 1 });
    });

    it('should return a cached model by id', () => {
      expect(modelCache.find(1)).to.equal(instance);
    });

    it('should return a cached model by normalized id', () => {
      expect(modelCache.find('1')).to.equal(instance);
    });

    it('should return undefined for a nullish id', () => {
      expect(modelCache.find()).to.be.undefined;
      expect(modelCache.find(null)).to.be.undefined;
    });
  });

  describe('has', () => {
    let modelCache;

    beforeEach(() => {
      const Model = Backbone.Model.extend();
      modelCache = new ModelCache(Model, 'test');
      new modelCache.ModelConstructor({ id: 1 });
    });

    it('should return true when the model is cached', () => {
      expect(modelCache.has('1')).to.be.true;
    });

    it('should return false when the model is not cached', () => {
      expect(modelCache.has(2)).to.be.false;
    });

    it('should return false for a nullish id', () => {
      expect(modelCache.has()).to.be.false;
      expect(modelCache.has(null)).to.be.false;
    });
  });

  describe('patch', () => {
    let modelCache;
    let instance;

    beforeEach(() => {
      const Model = Backbone.Model.extend();
      modelCache = new ModelCache(Model, 'test');
      instance = new modelCache.ModelConstructor({ id: 1 });
    });

    it('should set attrs and pass options', () => {
      sinon.spy(instance, 'set');
      const attrs = { id: 1, foo: 'bar' };
      const options = { silent: true };

      modelCache.patch(1, attrs, options);

      expect(instance.set).to.have.been.calledOnce.and.calledWithExactly(attrs, options);
    });

    it('should trigger the "update" event on Store', () => {
      const onUpdate = sinon.stub();
      Store.on('update', onUpdate);

      modelCache.patch(1, { foo: 'bar' });

      expect(onUpdate).to.have.been.calledOnce.and.calledWith(instance, modelCache);
    });

    it('should return the patched model', () => {
      expect(modelCache.patch(1, { foo: 'bar' })).to.equal(instance);
    });

    it('should return undefined when the model is missing', () => {
      expect(modelCache.patch(2, { foo: 'bar' })).to.be.undefined;
    });

    it('should return undefined for a nullish id', () => {
      expect(modelCache.patch(null, { foo: 'bar' })).to.be.undefined;
    });
  });

  describe('evict', () => {
    let modelCache;
    let instance;

    beforeEach(() => {
      const Model = Backbone.Model.extend();
      modelCache = new ModelCache(Model, 'test');
      instance = new modelCache.ModelConstructor({ id: 1 });
    });

    it('should remove the instance', () => {
      modelCache.evict(1);

      expect(modelCache.instances).to.be.empty;
    });

    it('should trigger the "remove" event on Store', () => {
      const onRemove = sinon.stub();
      Store.on('remove', onRemove);

      modelCache.evict(1);

      expect(onRemove).to.have.been.calledOnce.and.calledWith(instance, modelCache);
    });

    it('should return the evicted model', () => {
      expect(modelCache.evict(1)).to.equal(instance);
    });

    it('should return undefined when the model is missing', () => {
      expect(modelCache.evict(2)).to.be.undefined;
    });

    it('should return undefined for a nullish id', () => {
      expect(modelCache.evict(null)).to.be.undefined;
    });

    it('should detach the destroy listener from the evicted model', () => {
      const onRemove = sinon.stub();
      Store.on('remove', onRemove);

      modelCache.evict(1);
      instance.trigger('destroy', instance, instance.collection, {});

      expect(onRemove).to.have.been.calledOnce;
    });
  });

  describe('inspect', () => {
    let modelCache;
    let instance;

    beforeEach(() => {
      const Model = Backbone.Model.extend();
      modelCache = new ModelCache(Model, 'test');
      instance = new modelCache.ModelConstructor({ id: 1 });
    });

    it('should describe a cached model', () => {
      expect(modelCache.inspect(1)).to.eql({
        modelName: 'test',
        id: 1,
        key: '1',
        cached: true,
        model: instance
      });
    });

    it('should describe a missing model', () => {
      expect(modelCache.inspect(2)).to.eql({
        modelName: 'test',
        id: 2,
        key: '2',
        cached: false,
        model: undefined
      });
    });

    it('should describe a nullish id', () => {
      expect(modelCache.inspect(null)).to.eql({
        modelName: 'test',
        id: null,
        key: undefined,
        cached: false,
        model: undefined
      });
    });
  });

  describe('reset', () => {
    it('should clear cached instances without triggering remove', () => {
      const modelCache = new ModelCache(Backbone.Model, 'test');
      const onRemove = sinon.stub();
      Store.on('remove', onRemove);
      const instance = new modelCache.ModelConstructor({ id: 1 });

      modelCache.reset();

      expect(modelCache.instances).to.be.empty;
      expect(modelCache.pending).to.be.empty;
      expect(onRemove).to.not.have.been.called;

      instance.trigger('destroy', instance, instance.collection, {});

      expect(onRemove).to.not.have.been.called;
    });

    it('should detach listeners from pending instances without triggering remove', () => {
      const modelCache = new ModelCache(Backbone.Model, 'test');
      const onAdd = sinon.stub();
      const onRemove = sinon.stub();
      Store.on('add', onAdd);
      Store.on('remove', onRemove);
      const instance = new modelCache.ModelConstructor();
      const otherInstance = new modelCache.ModelConstructor();

      modelCache.reset();
      instance.set({ id: 1 });
      instance.trigger('destroy', instance, instance.collection, {});
      otherInstance.set({ id: 2 });
      otherInstance.trigger('destroy', otherInstance, otherInstance.collection, {});

      expect(modelCache.instances).to.be.empty;
      expect(modelCache.pending).to.be.empty;
      expect(onAdd).to.not.have.been.called;
      expect(onRemove).to.not.have.been.called;
    });
  });

  describe('remove', () => {
    let modelCache;

    beforeEach(() => {
      const Model = Backbone.Model.extend();
      modelCache = new ModelCache(Model, 'test');
    });

    describe('when removing a cached instance', () => {
      let cachedInstance;

      beforeEach(() => {
        cachedInstance = new modelCache.ModelConstructor({ id: 1 });
      });
      it('should remove the instance', () => {
        modelCache.remove(cachedInstance);
        expect(modelCache.instances).to.be.empty;
      });

      it('should trigger the "remove" event on Store', () => {
        const onRemove = sinon.stub();
        Store.on('remove', onRemove);
        modelCache.remove(cachedInstance);
        expect(onRemove).to.have.been.calledOnce.and.calledWith(cachedInstance, modelCache);
      });

      it('should return the removed instance', () => {
        expect(modelCache.remove(cachedInstance)).to.equal(cachedInstance);
      });
    })

    describe('when removing a non-cached instance', () => {
      let instance;

      beforeEach(() => {
        instance = new Backbone.Model();
      });

      it('should not trigger the "remove" event on Store', () => {
        const onRemove = sinon.stub();
        Store.on('remove', onRemove);
        modelCache.remove(instance);
        expect(onRemove).to.not.have.been.called;
      });

      it('should return the instance', () => {
        expect(modelCache.remove(instance)).to.equal(instance);
      });
    });
  });

  describe('when destroying a cached instance', () => {
    it('should remove the instance', () => {
      const modelCache = new ModelCache(Backbone.Model.extend({ url: '/' }), 'destroying test');
      sinon.spy(modelCache, 'remove');

      const instance = modelCache.ModelConstructor({ id: 1 });

      // Fake destroy to avoid setting up $.ajax :-/
      instance.trigger('destroy', instance, instance.collection, {});

      expect(modelCache.remove).to.have.been.calledOnce.and.calledWith(instance);
    });
  });
});
