import Proj from 'ember-flexberry-data';
import OfflineModel from '../mixins/offline-model';

/**
 * @module ember-flexberry-offline
 */

/**
 * Model with projections and additional metadata for sync with online storage.
 *
 * @class Model
 * @namespace Offline
 * @extends Projection.Model
 * @public
 */
export default Proj.Model.extend(OfflineModel, {
});
