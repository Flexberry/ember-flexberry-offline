/**
  @module ember-flexberry-offline
*/

import FlexberryDS from 'ember-flexberry-data';
import OfflineModel from '../mixins/offline-model';

/**
  Model with projections and additional metadata for offline support.

  @class Model
  @namespace Offline
  @extends <a href="http://flexberry.github.io/Documentation/develop/classes/Projection.Model.html">DS.Projection.Model</a>
  @uses DS.Offline.OfflineModel
  @public
*/
export default FlexberryDS.Model.extend(OfflineModel, {
});
