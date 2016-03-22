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
    var syncer = this;

    var localStore   = Ember.getOwner(this).lookup('store:local');
    var localAdapter = localStore.get('adapter');

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
   * @param {String|DS.Model|Array} typeName, record, records
   * @return {Promie}
   */
  syncDown: function(descriptor) {
    var syncer = this;

    if(typeof descriptor === 'string') {
      return reloadLocalRecords(descriptor);

    } else if(isModelInstance(descriptor)) {
      return syncer.syncDownRecord(descriptor);

    } else if(Ember.isArray(descriptor)) {
      var updatedRecords = descriptor.map(function(record) {
        return syncer.syncDownRecord(record);
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
   * This method does not talk to remote store, it only need to get serializer
   * from a store.
   *
   * @method
   * @private
   */
  syncDownRecord: function(record) {
    var localStore = this.get('localStore');
    var localAdapter = this.get('localAdapter');
    var snapshot = record._createSnapshot();

    if(record.get('isDeleted')) {
      return localAdapter.deleteRecord(localStore, snapshot.type, snapshot);
    } else {
      return localAdapter.createRecord(localStore, snapshot.type, snapshot);
    }
  }
});
