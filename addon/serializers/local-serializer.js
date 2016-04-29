import DS from 'ember-data';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';
import isObject from '../utils/is-object';

export default LFSerializer.extend({
  init: function() {
    this._super(...arguments);
    let owner = Ember.getOwner(this);
    let localStore = owner.lookup('store:local');
    this.set('store', localStore);
  },

  extractRelationship (relationshipModelName, relationshipHash) {
    if (isObject(relationshipHash) && Ember.isNone(relationshipHash.type)) {
      relationshipHash.type = relationshipModelName;
    }
    else if (!isObject(relationshipHash) && !Ember.isNone(relationshipHash)) {
      var hash = {
        id: relationshipHash,
        type: relationshipModelName
      };

      relationshipHash = hash;
    }

    return relationshipHash;
  }
});
