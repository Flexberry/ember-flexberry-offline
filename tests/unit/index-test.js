import { module, test } from 'qunit';
import Offline from 'ember-flexberry-offline';

module('index tests');

test('offline namesapce classes exports', function(assert) {
  assert.ok(Offline.Model);
  assert.ok(Offline.Store);
  assert.ok(Offline.OfflineModel);
  assert.ok(Offline.Serializer);
});
