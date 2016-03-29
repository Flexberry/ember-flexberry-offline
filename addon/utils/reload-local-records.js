import Ember from 'ember';

var RSVP = Ember.RSVP;

/*
 * This method does not change store, only change localforage
 *
 * @method reloadLocalRecords
 * @param {String|DS.Model} type
 */
export function reloadLocalRecords(type, reload, projectionName) {
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
    var projection = modelType.projections[projectionName];
    if (reload) {
      let options = { reload: true };
      options = Ember.isNone(projectionName) ? options : Ember.$.extend(true, options, { projection: projectionName });
      return store.findAll(type, options).then(function(records) {
        return createLocalRecords(store, localAdapter, localStore, modelType, records, projection);
      });
    }
    else {
      var records = store.peekAll(type);
	  return createLocalRecords(store, localAdapter, localStore, modelType, records, projection);
    }
  }
}

function createLocalRecord(store, localAdapter, localStore, modelType, record, projection) {
  if(record.get('id')) {
    var snapshot = record._createSnapshot();
    return localAdapter.createRecord(localStore, modelType, snapshot).then(function() {
      return syncDownRelatedRecords(store, record, localAdapter, localStore, projection);
    });
  } 
  else {
    var recordName = record.constructor && record.constructor.modelName;
    var warnMessage = 'Record ' + recordName + ' does not have an id, therefor we can not create it locally: ';

    var recordData = record.toJSON && record.toJSON();

    Ember.Logger.warn(warnMessage, recordData);

    return RSVP.resolve();
  }
}

function createLocalRecords(store, localAdapter, localStore, modelType, records, projection) {
  var createdRecords = records.map(function(record) {
    return createLocalRecord(store, localAdapter, localStore, modelType, record, projection);
  });
  return RSVP.all(createdRecords);
}

export function syncDownRelatedRecords(store, mainRecord, localAdapter, localStore, projection) {
  function isEmbedded(store, modelType, relationshipName) {
    var serializerAttrs = store.serializerFor(modelType.modelName).get('attrs');
    return serializerAttrs[relationshipName] && 
    ((serializerAttrs[relationshipName].deserialize && serializerAttrs[relationshipName].deserialize === 'records') || 
    (serializerAttrs[relationshipName].embedded && serializerAttrs[relationshipName].embedded === 'always'));
  }

  function isAsync(modelType, relationshipName) {
    return Ember.get(modelType, 'relationshipsByName').get(relationshipName).options.async;
  }

  function createRelatedBelongsToRecord(store, modelType, relatedRecord, localAdapter, localStore, projection) {
    return createLocalRecord(store, localAdapter, localStore, modelType, relatedRecord, projection);
  }

  function createRelatedHasManyRecords(store, modelType, relatedRecords, localAdapter, localStore, projection) {
    let promises = Ember.A();
    for (let i = 0; i < relatedRecords.get('length'); i++) {
      let relatedRecord = relatedRecords.objectAt(i);
      promises.pushObject(createLocalRecord(store, localAdapter, localStore, modelType, relatedRecord, projection));
    }
    return promises;
  }

  function createRelatedRecords(store, mainRecord, localAdapter, localStore, projection) {
    var promises = Ember.A();
    var modelType = store.modelFor(mainRecord.constructor.modelName);
    var attrs = projection.attributes;
    var relationshipNames = Ember.get(modelType, 'relationshipNames');

    for (let belongToName in relationshipNames.belongsTo) {
      // Save related record into local store only if relationship included into projection.
      if (attrs.hasOwnProperty(belongToName)) {
        var async = isAsync(modelType, belongToName);
        if (async) {
          return mainRecord.get(belongToName).then(function(relatedRecord) {
            promises.pushObject(createRelatedBelongsToRecord(store, modelType, relatedRecord, localAdapter, localStore, attrs[belongToName]));
          });
        }
        else {
          if (isEmbedded(store, modelType, belongToName)) {
            var relatedRecord = mainRecord.get(belongToName);
            promises.pushObject(createRelatedBelongsToRecord(store, modelType, relatedRecord, localAdapter, localStore, attrs[belongToName]));
          }
        }
      }
    }

    for (let hasManyName in relationshipNames.hasMany) {
      // Save related records into local store only if relationship included into projection.
      if (attrs.hasOwnProperty(hasManyName)) {
        var async = isAsync(modelType, belongToName);
        if (async) {
          return mainRecord.get(hasManyName).then(function(relatedRecords) {
            return promises.pushObjects(createRelatedHasManyRecords(store, modelType, relatedRecords, localAdapter, localStore, attrs[hasManyName]));
          });
        }
        else {
          if (isEmbedded(store, modelType, hasManyName)) {
            var relatedRecords = mainRecord.get(hasManyName);
            return promises.pushObjects(createRelatedHasManyRecords(store, modelType, relatedRecords, localAdapter, localStore, attrs[hasManyName]));
          }
        }
      }
    }

    return RSVP.all(promises);
  }

  return createRelatedRecords(store, mainRecord, localAdapter, localStore, projection);
}