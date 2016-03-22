import Ember from 'ember';

/*
 * syncUp   before finder
 * syncDown after  finder
 * @param {String} finderType {'single'|'multiple'|'all'}
 * @param {Function} decoratable method of online store
 */
export default function decorateAPICall(finderType, superFunc) {
  return function apiCall() {
    var store = this;
    var args = arguments;
    var syncer = store.get('syncer');
    var _superFinder = superFunc;

    if (args.length > 0) {
      var options = args[args.length - 1];
      var bypass = (typeof options === 'object') && options.bypass;
      if (bypass) {
        return _superFinder.apply(store, args);
      }
    }

    return syncUp()
      .then(function() { return _superFinder.apply(store, args); })
      .then(syncDown);

    function syncUp() {
      return syncer.syncUp().catch(function(error) {
        Ember.Logger.warn('Syncing Error:');
        Ember.Logger.error(error && error.stack);
      });
    }

    function syncDown(result) {
      if (finderType === 'all') {
        var modelName = result.get('type.modelName');
        syncer.syncDown(modelName);

      }
	  else if(finderType === 'single'){
        syncer.syncDown(result);

      }
	  else if(finderType === 'multiple'){
        syncer.syncDown(result);

      }
	  else {
        throw new Error('finderType must be one of single, multiple or all, but got ' + finderType);
      }

      return result;
    }
  };
}
