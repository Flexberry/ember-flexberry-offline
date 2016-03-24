import Ember from 'ember';
import backup from '../../utils/backup';
import isObject from '../../utils/is-object';
import generateUniqueId from '../../utils/generate-unique-id';

/*
 * Extend adapter so that we can use local adapter when offline
 */
export default function decorateAdapter(adapter) {
  if(adapter.get('flexberry')) {
    return adapter;
  }

  adapter.set('flexberry', {});

  var localAdapter = Ember.getOwner(this).lookup('store:local').get('adapter');

  // find()
  // findAll()
  // findQuery()
  // findMany()
  // createRecord()
  // updateRecord()
  // deleteRecord()
  var methods = [
    'find', 'findAll', 'findQuery', 'findMany',
    'createRecord', 'updateRecord', 'deleteRecord'
  ];

  var _this = this;
  methods.forEach(function(methodName) {
    decorateAdapterMethod.call(_this, adapter, localAdapter, methodName);
  });

  return adapter;
}

function decorateAdapterMethod(adapter, localAdapter, methodName) {
  var originMethod = adapter[methodName];
  var backupMethod = createBackupMethod(localAdapter, methodName);
  var isOnline = Ember.getOwner(this).lookup('service:offline-globals').get('isOnline');

  adapter[methodName] = function() {
    if (isOnline) {
      return originMethod.apply(adapter, arguments)
        .catch(backup(isOnline, backupMethod, arguments));
    }
	else {
      backupMethod.apply(null, arguments);
    }
  };

  adapter.flexberry[methodName] = originMethod;
}

function createBackupMethod(localAdapter, methodName) {
  var container = localAdapter.container;
  var crudMethods = ['createRecord', 'updateRecord', 'deleteRecord'];
  var isCRUD = crudMethods.indexOf(methodName) !== -1;
  var isCreate = methodName === 'createRecord';

  return function backupMethod() {
    var args = Array.prototype.slice.call(arguments);

    // ---------- CRUD specific
    if(isCRUD) {
      var snapshot = args[2];

      if(isCreate) {
        snapshot = addIdToSnapshot(snapshot);
      }

      // createJobInSyncer(container, methodName, snapshot);

      // decorate snapshot for serializer#serialize, this should be after
      // createJob in syncer
      snapshot.flexberry = true;
      args[2] = snapshot;
    }
    // ---------- CRUD specific END

    return localAdapter[methodName].apply(localAdapter, args)
      .then(function(payload) {
        // decorate payload for serializer#extract
        if(isObject(payload)) {
          payload.flexberry = true;
        }
        return payload;
      });
  };
}

// Add an id to record before create in local
function addIdToSnapshot(snapshot) {
  var record = snapshot.record;
  record.get('store').updateId(record, {id: generateUniqueId()});
  return record._createSnapshot();
}

function createJobInSyncer(container, methodName, snapshot) {
  var syncer = Ember.getOwner(this).lookup('syncer:main');
  syncer.createJob(methodName, snapshot);
}
