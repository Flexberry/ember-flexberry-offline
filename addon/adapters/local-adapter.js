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
    var modelName = type.modelName;
    var proj = this._extractProjectionFromQuery(modelName, type, query);
    var _this = this;
/*    return this._super(...arguments).then(function(record) {
      return _this._completeLoadRecord(store, type, record, proj);
    }).then(function(completeRecord) {
      return completeRecord;
    }); */
    return this._super(...arguments);
  },

  query: function(store, type, query) {
    var modelName = type.modelName;
    var proj = this._extractProjectionFromQuery(modelName, type, query);
    var _this = this;
/*    return this._super(...arguments).then(function(recordArray) {
      let promises = Ember.A();
      for (let i = 0; i < recordArray.length; i++) {
        let record = recordArray[i];
        promises.pushObject(_this._completeLoadRecord(store, type, record, proj));
      }

      return Ember.RSVP.all(promises).then(() => {
        return recordArray;
      });
    }).then(function(completeRecordArray) {
      return completeRecordArray;
    }); */
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
  },

  /**
   * Retrieves projection from query and returns it.
   * Retrieved projection removes from the query.
   *
   * @method _extractProjectionFromQuery
   * @private
   *
   * @param {String} modelName The name of the model type.
   * @param {subclass of DS.Model} typeClass Model type.
   * @param {Object} [query] Query parameters.
   * @param {String} query.projection Projection name.
   * @return {Object} Extracted projection from query or null
   *                  if projection is not set in query.
   */
  _extractProjectionFromQuery: function(modelName, typeClass, query) {
    if (query && query.projection) {
      let proj = query.projection;
      if (typeof query.projection === 'string') {
        let projName = query.projection;
        proj = typeClass.projections.get(projName);
      }

      delete query.projection;
      return proj;
    }

    return null;
  },

  /**
   * Completes loading record for given projection.
   *
   * @method _completeLoadingRecord
   * @private
   *
   * @param {subclass of DS.Store} store Store to use for complete loading record.
   * @param {subclass of DS.Model} type Model type.
   * @param {Object} record Main record loaded by adapter.
   * @param {Object} projection Projection for complete loading of record.
   * @return {Object} Completely loaded record with all properties
   *                  include relationships corresponds to given projection
   */
  _completeLoadRecord: function(store, type, record, projection) {
    function loadRelatedRecord(store, type, id, proj) {
      let relatedRecord = store.peekRecord(proj.modelName, id);
      if (Ember.isNone(relatedRecord)) {
        let options = { 
          id: id,
          projection: proj 
        };
        return this.queryRecord(store, type, options);
      }
      else {
        let relatedRecordObject = relatedRecord.serialize({includeId: true});
        return this._completeLoadRecord(store, type, relatedRecordObject, proj);
      }
    }

    function isAsync(type, attrName) {
      let relationshipMeta = Ember.get(type, 'relationshipsByName').get(attrName);
    }

    let promises = Ember.A();
    let attributes = projection.attributes;
    for (var attrName in attributes) {
      if (attributes.hasOwnProperty(attrName)) {
        let attr = attributes[attrName];
        let relatedModelType = (attr.kind === 'belongsTo' || attr.kind === 'hasMany') ? store.modelFor(attr.modelName) : null;
        switch (attr.kind) {
          case 'attr':
            break;
          case 'belongsTo':
            // let primaryKeyName = this.serializer.get('primaryKey');
            isAsync(type, attrName);
            let id = record[attrName];
            if (!Ember.isNone(id)) {
              promises.pushObject(loadRelatedRecord.call(this, store, relatedModelType, id, attr).then((relatedRecord) => {
                delete record[attrName];
                record[attrName] = relatedRecord;
              }));
            }

            break;
          case 'hasMany':
            let ids = Ember.copy(record[attrName]);
            delete record[attrName];
            record[attrName] = [];
            for (var i = 0; i < ids.length; i++) {
              let id = ids[i];
              promises.pushObject(loadRelatedRecord.call(this, store, relatedModelType, id, attr).then((relatedRecord) => {
                record[attrName].push(relatedRecord);
              }));
            }

            break;
          default:
            throw new Error(`Unknown kind of projection attribute: ${attr.kind}`);
        }
      }
    }

    return Ember.RSVP.all(promises).then(() => {
      return record;
    });
  }
});
	
export default LocalAdapter;