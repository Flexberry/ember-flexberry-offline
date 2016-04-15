import Ember from 'ember';
import DS from 'ember-data';
import LocalAdapter from '../adapters/local-adapter';

/**
 * @module ember-flexberry-offline
 */

/**
 * Store that used in offline mode.
 *
 *
 * @class LocalStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  init: function() {
    let owner = Ember.getOwner(this);
    let adapter = LocalAdapter.create(owner.ownerInjection(), {
      caching: 'none',
      namespace: 'ember-flexberry-offline:store',
    });

    this.set('adapter', adapter);

    this._super(...arguments);
  },

  /**
   * Serializer is fetched via this method or adapter.serializer
   *
   * @method serializerFor
   * @public
   */
  serializerFor: function(modelName) {
    let owner = Ember.getOwner(this);
    let serializer = owner.lookup(`serializer:${modelName}-offline`);
    return serializer;
  },

  /**
   * Adapter is fetched via this method or adapter property
   *
   * @method adapterFor
   * @public
   */
  adapterFor: function() {
    return this.get('adapter');
  },

  /**
   * Finds the records for the given model type.
   *
   * See {{#crossLink "DS.Store/findAll:method"}}{{/crossLink}} for details.
   *
   * @method findAll
   * @public
   *
   * @param {String} modelName The name of the model type.
   * @param {Object} [options] Options.
   * @param {String} options.projection Projection name.
   * @return {DS.AdapterPopulatedRecordArray} Records promise.
   */
  findAll: function(modelName, options) {
    if (options && options.projection) {
      return this.query(modelName, {
        projection: options.projection
      });
    }

    return this._super(...arguments);
  },

  /**
   * Returns a record for a given type and id combination.
   *
   * See {{#crossLink "DS.Store/findRecord:method"}}{{/crossLink}} for details.
   *
   * @method findRecord
   * @public
   *
   * @param {String} modelName The name of the model type.
   * @param {String|Integer} id Record ID.
   * @param {Object} [options] Options.
   * @param {String} options.projection Projection name.
   * @return {Promise} Record promise.
   */
  findRecord: function(modelName, id, options) {
    if (options && options.projection) {
      // TODO: case of options.reload === false.
      return this.queryRecord(modelName, {
        id: id,
        projection: options.projection
      });
    }

    return this._super(...arguments);
  },

  /**
   * This method delegates a query to the adapter.
   *
   * See {{#crossLink "DS.Store/query:method"}}{{/crossLink}} for details.
   *
   * @method query
   * @public
   *
   * @param {String} modelName The name of the model type.
   * @param {Object} query An opaque query to be used by the adapter.
   * @param {String} [query.projection] Projection name.
   * @return {Promise} A promise, which is resolved with a
   *                   {{#crossLink "DS.RecordArray"}}RecordArray{{/crossLink}}
   *                   once the server returns.
   */
  query: function(modelName, query) {
    return this._super(modelName, query);
  },

  /**
   * This method delegates a query to the adapter.
   *
   * See {{#crossLink "DS.Store/queryRecord:method"}}{{/crossLink}} for details.
   *
   * @method queryRecord
   * @public
   *
   * @param {String} modelName The name of the model type.
   * @param {Object} query An opaque query to be used by the adapter.
   * @param {String} [query.projection] Projection name.
   * @return {Promise} A promise, which is resolved with a
   *                   {{#crossLink "DS.RecordObject"}}RecordObject{{/crossLink}}
   *                   once the server returns.
   */
  queryRecord: function(modelName, query) {
    return this._super(modelName, query);
  }
});
