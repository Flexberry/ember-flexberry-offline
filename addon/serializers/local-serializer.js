import DS from 'ember-data';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';
import isObject from '../utils/is-object';

export default LFSerializer.extend(DS.EmbeddedRecordsMixin, {
  init: function() {
    this._super(...arguments);
    let owner = Ember.getOwner(this);
    let localStore = owner.lookup('store:local');
    this.set('store', localStore);
  },

  /**
   `serializeBelongsTo` can be used to customize how `DS.belongsTo` properties are serialized.
   If there is set option `odata-id` at serializer and `DS.belongsTo` property is not null,
   then property will be serialized like `ids`.

   @method serializeBelongsTo
   @param {DS.Snapshot} snapshot
   @param {Object} json
   @param {Object} relationship
  */
  serializeBelongsTo(snapshot, json, relationship) {
    var option = this.attrsOption(relationship.key);
    if (!option || option.serialize !== 'odata-id') {
      this._super(snapshot, json, relationship);
      return;
    }

    var key = relationship.key;
    var belongsToId = snapshot.belongsTo(key, { id: true });
    var payloadKey = this.keyForRelationship(key, relationship.kind, 'serialize');
    if (Ember.isNone(belongsToId)) {
      json[payloadKey] = null;
    } else {
      json[payloadKey] = belongsToId;
    }
  },

  extractRelationship (relationshipModelName, relationshipHash) {
    if (isObject(relationshipHash) && Ember.isNone(relationshipHash.type)) {
      relationshipHash.type = relationshipModelName;
    }

    return relationshipHash;
  }
});
