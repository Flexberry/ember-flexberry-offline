import Ember from 'ember';
import DS from 'ember-data';
import decorateAdapter from './base-store/decorate-adapter';
import decorateSerializer from './base-store/decorate-serializer';
// import decorateAPICall from './base-store/decorate-api-call';

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
    var onlineStore = this.get('onlineStore');
    if (Ember.isNone(onlineStore)) {
      onlineStore = DS.Store.create();
      this.set('onlineStore', onlineStore);
    }

    let syncer = Ember.getOwner(this).lookup('syncer:main');
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
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
	  // decorateAPICall('all');
    }
    else {
      var onlineStore = this.get('onlineStore');
      return onlineStore.findAll.apply(onlineStore, arguments);
    }
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
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      // decorateAPICall('single'),
    }
    else {
      var onlineStore = this.get('onlineStore');
      return onlineStore.findRecord.apply(onlineStore, arguments);
    }
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
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      // decorateAPICall('single'),
    }
    else {
      var onlineStore = this.get('onlineStore');
      return onlineStore.reloadRecord.apply(onlineStore, arguments);
    }
  },

  adapterFor: function(type) {
    var adapter = this._super(type);
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      return decorateAdapter(adapter);
	}
    else {
      return adapter;
    }
  },

  serializerFor: function(type) {
    var serializer = this._super(type);
    if (this.get('offlineGlobals').get('isOfflineEnabled')) {
      return decorateSerializer(serializer);
	}
    else {
      return serializer;
    }
  }
});
