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
  offlineStore: null,
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

    let offlineStore = owner.lookup('store:local');
    this.set('offlineStore', offlineStore);
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
    let offlineStore = this.get('offlineStore');
    return this._isOnline() ? this._decorateMethodAndCall('all', 'findAll', arguments, 1) : offlineStore.findAll.apply(offlineStore, arguments);
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
    let offlineStore = this.get('offlineStore');
    return this._isOnline() ? this._decorateMethodAndCall('single', 'findRecord', arguments, 2) : offlineStore.findRecord.apply(offlineStore, arguments);
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
    let offlineStore = this.get('offlineStore');
    return this._isOnline() ? this._decorateMethodAndCall('single', 'reloadRecord', arguments, -1) : offlineStore.reloadRecord.apply(offlineStore, arguments);
  },

  /**
    Query for records that meet certain criteria. Resolves with DS.RecordArray.
    @method query
    @param {String} modelName
    @param {Object} query
    @return {Promise} promise
  */
  query: function (modelName, query) {
    let offlineStore = this.get('offlineStore');
    return this._isOnline() ? this._decorateMethodAndCall('multiple', 'query', arguments, -1) : offlineStore.query.apply(offlineStore, arguments);
  },

  /**
    Query for record that meet certain criteria. Resolves with single record.
    @method query
    @param {String} modelName
    @param {Object} query
    @return {Promise} promise
  */
  queryRecord: function (modelName, query) {
    let offlineStore = this.get('offlineStore');
    return this._isOnline() ? this._decorateMethodAndCall('single', 'queryRecord', arguments, -1) : offlineStore.queryRecord.apply(offlineStore, arguments);
  },

  adapterFor: function(type) {
    let onlineStore = this.get('onlineStore');
    let offlineStore = this.get('offlineStore');
    let adapter = onlineStore.adapterFor(type);
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      return this._isOnline() ? decorateAdapter.call(this, adapter) : offlineStore.adapterFor(type);
	}
    else {
      return adapter;
    }
  },

  serializerFor: function(type) {
    let onlineStore = this.get('onlineStore');
    let offlineStore = this.get('offlineStore');
    let serializer = onlineStore.serializerFor(type);
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      return this._isOnline() ? decorateSerializer.call(this, serializer) : offlineStore.serializerFor(type);
	}
    else {
      return serializer;
    }
  },

  _decorateMethodAndCall: function(finderType, originMethodName, originMethodArguments, optionsIndex) {
    let onlineStore = this.get('onlineStore');
    let originMethod = onlineStore[originMethodName];
    let decoratedMethod = decorateAPICall(finderType, originMethod);
	if (optionsIndex > -1) {
      let options = originMethodArguments[optionsIndex];
	  options = this.get('offlineGlobals').get('isOfflineEnabled') ? options : Ember.$.extend(true, { bypass: true }, options);
      originMethodArguments[optionsIndex] = options;
    }

    return decoratedMethod.apply(onlineStore, originMethodArguments);
  },

  _isOnline: function() {
    return this.get('offlineGlobals.isOnline');
  }
});
