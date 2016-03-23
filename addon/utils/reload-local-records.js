import Ember from 'ember';

var RSVP = Ember.RSVP;

/*
 * This method does not change store, only change localforage
 *
 * @method reloadLocalRecords
 * @param {String|DS.Model} type
 */
export default function reloadLocalRecords(type, reload, projectionName) {
  var store = Ember.getOwner(this).lookup('service:store');
  var modelType = store.modelFor(type);

  var localStore = Ember.getOwner(this).lookup('store:local');
  var localAdapter = localStore.get('adapter');

  var reloadedRecords = localAdapter.findAll(localStore, modelType)
    .then(deleteAll)
    .then(createAll);

  return reloadedRecords;

  function deleteAll(localRecords) {
    var deletedRecords = localRecords.map(function(record) {
      return localAdapter.deleteRecord(localStore, modelType, {id: record.id});
    });

    return RSVP.all(deletedRecords);
  }

  function createAll() {
    if (reload) {
      let options = { reload: true };
      options = Ember.isNone(projectionName) ? options : Ember.$.extend(true, options, { projection: projectionName });
      return store.findAll(type, options).then(function(records) {
        return createLocalRecords(localAdapter, localStore, modelType, records);
      });
    }
    else {
      var records = store.peekAll(type);
	  return createLocalRecords(localAdapter, localStore, modelType, records);
    }
  }
}

function createLocalRecord(localAdapter, localStore, modelType, record) {
  if(record.get('id')) {
    var snapshot = record._createSnapshot();
    return localAdapter.createRecord(localStore, modelType, snapshot);
  } 
  else {
    var recordName = record.constructor && record.constructor.modelName;
    var warnMessage = 'Record ' + recordName + ' does not have an id, therefor we can not create it locally: ';

    var recordData = record.toJSON && record.toJSON();

    Ember.Logger.warn(warnMessage, recordData);

    return RSVP.resolve();
  }
}

function createLocalRecords(localAdapter, localStore, modelType, records) {
  var createdRecords = records.map(function(record) {
    return createLocalRecord(localAdapter, localStore, modelType, record);
  });
  return RSVP.all(createdRecords);
}