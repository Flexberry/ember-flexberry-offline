import Ember from 'ember';
import generateUniqueId           from './utils/generate-unique-id';
import reloadLocalRecords         from './utils/reload-local-records';
import isModelInstance            from './utils/is-model-instance';

var RSVP = Ember.RSVP;

/**
  We save offline jobs to localforage and run them one at a time when online

  Job schema:
  ```
  {
    id:        { String },
    operation: { 'createRecord'|'updateRecord'|'deleteRecord' },
    typeName:  { String },
    record:    { Object },
    createdAt: { Date },
  }
  ```

  We save remoteIdRecords to localforage. They are used to lookup remoteIds
  from localIds.

  RecordId schema:
  ```
  {
    typeName: { String },
    localId:  { String },
    remoteId: { String }
  }
 ```

 @class Syncer
 @extends Ember.Object
 */
export default Ember.Object.extend({
  db: null,
  // initialize jobs since jobs may be used before we fetch from localforage
  jobs: [],
  remoteIdRecords: [],

  /**
   * Initialize db.
   *
   * Initialize jobs, remoteIdRecords.
   *
   * @method init
   * @private
   */
  init: function() {
    let syncer = this;

    let localStore = Ember.getOwner(this).lookup('store:local');
    let localAdapter = localStore.get('adapter');

    syncer.set('db', window.localforage);
    syncer.set('localStore', localStore);
    syncer.set('localAdapter', localAdapter);

    // NOTE: get remoteIdRecords first then get jobs,
    // since jobs depend on remoteIdRecords
    /*
    syncer.getAll('remoteIdRecord').then(
      syncer.getAll.bind(syncer, 'job')
    );
    */
  },

  /**
   * TODO:
   * Save all records in the store into localforage.
   *
   * @method syncDown
   * @public
   * @param {String|DS.Model|Array} typeName, record, records.
   * @param {Boolean} [reload] If set to true then syncer perform remote reload for data, otherwise data will get from the store.
   * @param {String} [projectionName] Name of projection for remote reload of data. If not set then all properties of record, except navigation properties, will be read.
   * @return {Promie}
   */
  syncDown: function(descriptor, reload, projectionName) {
    let syncer = this;

    if(typeof descriptor === 'string') {
      return reloadLocalRecords.call(this, descriptor, reload, projectionName);

    } else if(isModelInstance(descriptor)) {
      return syncer._syncDownRecord(descriptor, reload, projectionName);

    } else if(Ember.isArray(descriptor)) {
      let updatedRecords = descriptor.map(function(record) {
        return syncer._syncDownRecord(record, reload, projectionName);
      });
      return RSVP.all(updatedRecords);

    } else {
      throw new Error('Input can only be a string, a DS.Model or an array of DS.Model, but is ' + descriptor);
    }
  },

  /**
   * Reset syncer and localforage records.
   * Remove all jobs and remoteIdRecords.
   * Remove all records in localforage.
   *
   * @method
   * @public
   */
  reset: function() {
    return RSVP.all([
      this.deleteAll('job'),
      this.deleteAll('remoteIdRecord'),
      this.get('localAdapter').clear()
    ]);
  },

  /**
   * Saves data to local store.
   *
   * @method _syncDownRecord
   * @param {DS.Model} record Record to save in local store.
   * @param {Boolean} [reload] If set to true then syncer perform remote reload for data, otherwise data will get from the store.
   * @param {String} [projectionName] Name of projection for remote reload of data. If not set then all properties of record, except navigation properties, will be read.
   * @private
   */
  _syncDownRecord: function(record, reload, projectionName) {
    function saveRecordToLocalStore(record) {
      let localStore = this.get('localStore');
      let localAdapter = this.get('localAdapter');
      let snapshot = record._createSnapshot();

      if(record.get('isDeleted')) {
        return localAdapter.deleteRecord(localStore, snapshot.type, snapshot);
      } else {
        return localAdapter.createRecord(localStore, snapshot.type, snapshot);
      }
    }

    if (reload) {
      let store = Ember.getOwner(this).lookup('service:store');
      let modelName = record.get('modelName');
      let options = { reload: true };
      options = Ember.isNone(projectionName) ? options : Ember.$.extend(true, options, { projection: projectionName });
      return store.findRecord(modelName, record.id, options).then(function(reloadedRecord) {
        return saveRecordToLocalStore(reloadedRecord);
	  });
    }
	else {
      return saveRecordToLocalStore(record);
	}
  },

  deleteAll: function(typeName) {
    return this.saveAll(typeName, []);
  },

  saveAll: function(typeName, records) {
    this.set(pluralize(typeName), records);

    var namespace = getNamespace(typeName);
    return this.get('db').setItem(namespace, records);
  }
});

function pluralize(typeName) {
  return typeName + 's';
}

function getNamespace(typeName) {
  var LocalForageKeyHash = {
    'job':            'EmberFryctoriaJobs',
    'remoteIdRecord': 'EmberFryctoriaRemoteIdRecords',
  };
  return LocalForageKeyHash[typeName];
}
