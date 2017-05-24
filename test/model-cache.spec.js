import Backbone from 'backbone';
import { expect, sandbox } from './setup';

import Store, { ModelCache } from '../dist/backbone.store';

describe('ModelCache', () => {
  let sinon;

  beforeEach(() => {
    sinon = sandbox.create();
  });

  afterEach(() => {
    sinon.restore();
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
      expect(modelCache.instances).to.eql({});
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

        it('should not trigger the "add" event on the Store', () => {
          expect(onAdd).not.to.have.been.called;
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
