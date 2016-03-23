/**
 * Addon that extends ember-data with ember-flexberry-projections to support work in offline mode.
 *
 * @module ember-flexberry-offline
 * @main ember-flexberry-offline
 */

import Model from './models/model';
import OfflineModel from './mixins/offline-model';
import BaseStore from './stores/base-store';

/**
 * This namespace contains classes and methods to support work in offline mode.
 *
 * @class Offline
 * @static
 * @public
 */
let Offline = {
  Store: BaseStore,
  Model: Model,
  OfflineModel: OfflineModel
};

export default Offline;
