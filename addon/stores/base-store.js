import Ember from 'ember';
import DS from 'ember-data';
import decorateAdapter from './base-store/decorate-adapter';
import decorateSerializer from './base-store/decorate-serializer';
import decorateAPICall from './base-store/decorate-api-call';

/**
 * This should be used as store:main
 *
 * @class BaseStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  onlineStore: null,
  offlineGlobals: Ember.inject.service('offline-globals'),

  /**
   * Global instance of Syncer that contains methods to sync model.
   *
   * @property syncer
   * @type Syncer
   * @readOnly
   */
  syncer: null,

  init() {
    this._super(...arguments);
    let owner = Ember.getOwner(this);
    if (Ember.isNone(this.get('onlineStore'))) {
      let onlineStore = DS.Store.create(owner.ownerInjection());
      this.set('onlineStore', onlineStore);
    }

    let syncer = owner.lookup('syncer:main');
    this.set('syncer', syncer);
  },

  /**
    This method returns a fresh collection from the server, regardless of if there is already records
    in the store or not.
    @method findAll
    @param {String} modelName
    @param {Object} options
    @return {Promise} promise
  */
  findAll: function (modelName, options) {
	return this._decorateMethodAndCall('all', 'findAll', arguments, 1);
  },

  /**
   * This method returns a record for a given type and id combination.
   * NOTE: this will trigger syncUp twice, this is OK. And since this is
   *  a public method, we probably want to preserve this.
    @method findRecord
    @param {String} modelName
    @param {String|Integer} id
    @param {Object} options
    @return {Promise} promise
   */
  findRecord: function(modelName, id, options) {
	return this._decorateMethodAndCall('single', 'findRecord', arguments, 2);
  },

  /**
    This method is called by the record's `reload` method.
    This method calls the adapter's `find` method, which returns a promise. When
    **that** promise resolves, `reloadRecord` will resolve the promise returned
    by the record's `reload`.
    @method reloadRecord
    @private
    @param {DS.Model} internalModel
    @return {Promise} promise
  */
  reloadRecord: function (internalModel) {
	return this._decorateMethodAndCall('single', 'reloadRecord', arguments, -1);
  },

  /**
    Query for records that meet certain criteria. Resolves with DS.RecordArray.
    @method query
    @param {String} modelName
    @param {Object} query
    @return {Promise} promise
  */
  query: function (modelName, query) {
    return this._decorateMethodAndCall('multiple', 'query', arguments, -1);
  },

  /**
    Query for record that meet certain criteria. Resolves with single record.
    @method query
    @param {String} modelName
    @param {Object} query
    @return {Promise} promise
  */
  queryRecord: function (modelName, query) {
    return this._decorateMethodAndCall('single', 'queryRecord', arguments, -1);
  },

  adapterFor: function(type) {
    let onlineStore = this.get('onlineStore');
    let adapter = onlineStore.adapterFor(type);
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      return decorateAdapter.call(this, adapter);
	}
    else {
      return adapter;
    }
  },

  serializerFor: function(type) {
    let onlineStore = this.get('onlineStore');
    let serializer = onlineStore.serializerFor(type);
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      return decorateSerializer.call(this, serializer);
	}
    else {
      return serializer;
    }
  },

  _decorateMethodAndCall(finderType, originMethodName, originMethodArguments, optionsIndex) {
    let onlineStore = this.get('onlineStore');
    let originMethod = onlineStore[originMethodName];
    let decoratedMethod = decorateAPICall(finderType, originMethod);
	if (optionsIndex > -1) {
      let options = originMethodArguments[optionsIndex];
	  options = this.get('offlineGlobals').get('isOfflineEnabled') ? options : Ember.$.extend(true, { bypass: true }, options);
      originMethodArguments[optionsIndex] = options;
    }

    return decoratedMethod.apply(onlineStore, originMethodArguments);
  }
});
