import Ember from 'ember';

/**
 * @module ember-flexberry-offline
 */

/**
 * Service for operate with global online and offline properties and events.
 *
 * @class OfflineGlobals
 * @extends Ember.Service
 * @public
 */
export default Ember.Service.extend(Ember.Evented, {
  /**
  * Availability of the backend.
  * @property isOnline
  * @type Boolean
  * @default false
  * @readOnly
  **/
  isOnline: false,

  /**
  * Possibility of using offline storage.
  * Gets from application config.
  * @property isOfflineEnabled
  * @type Boolean
  * @default true
  * @readOnly
  **/
  isOfflineEnabled: true,

  /**
   * Trigger for "online is available" or "online is unavailable" event.
   * Event name: online/offline.
   *
   * @method setOnlineAvailable
   *
   * @param {Boolean} isOnline Availability of online to set.
   */
  setOnlineAvailable(isOnline) {
    this.set('isOnline', isOnline);
    let eventName = isOnline ? 'online' : 'offline';
    this.trigger(eventName);
  },

  /**
   * Get online status.
   * Always returns 'true' by default.
   * Needs for overload when using on mobile devices.
   *
   * @method checkOnlineAvailable
   *
   * @return {Boolean} Returns online status on current device.
   */
  checkOnlineAvailable() {
    return true;
  },

  init() {
    this._super(...arguments);
    let app = Ember.getOwner(this).application;
	let isOfflineEnabled = app.offline.offlineEnabled;
	if (!Ember.isNone(isOfflineEnabled)) {
      this.set('isOfflineEnabled', isOfflineEnabled);
    }

    let isOnlineAvailable = this.checkOnlineAvailable();
    this.setOnlineAvailable(isOnlineAvailable);
  }
});
