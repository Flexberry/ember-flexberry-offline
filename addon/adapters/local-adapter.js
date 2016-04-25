import Ember from 'ember';
import DS from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';
import generateUniqueId from '../utils/generate-unique-id';

var LocalAdapter = LFAdapter.extend({
  init() {
    this._super(...arguments);
    window.localforage.setDriver(window.localforage.INDEXEDDB);
  },
  generateIdForRecord: generateUniqueId,
  getPaginationQuery: function(page, perPage) {
    let query = {};
    return query;
  },

  getSortingQuery: function(sortingInfo, serializer) {
    let query = {};

    return query;
  },

  getLimitFunctionQuery: function(limitFunction, projectionName) {
    let query = {};

    if (projectionName && typeof (projectionName) === 'string' && projectionName.length > 0) {
      Ember.merge(query, { projection: projectionName });
    }

    return query;
  }
});

LocalAdapter.reopen({
  findRecord: function(store, type, id) {
    return this._super(...arguments);
  },

  findAll: function(store, type) {
    return this._super(...arguments);
  },

  findMany: function(store, type, ids) {
    return this._super(...arguments);
  },

  queryRecord: function(store, type, query) {
    return this._super(...arguments);
  },

  query: function(store, type, query) {
    return this._super(...arguments);
  },

  clear: function () {
    // clear cache
    var cache = this.get('cache');
    if (cache) {
      cache.clear();
    }

    // clear data in localforage
    return window.localforage.setItem(this._adapterNamespace(), []);
  }
});
	
export default LocalAdapter;