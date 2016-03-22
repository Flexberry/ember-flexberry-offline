import Ember from 'ember';

export default function backup(isOnline, backupFn, args) {
  return function(error) {
    if(isOnline) {
      return Ember.RSVP.reject(error);
    } else {
      return backupFn.apply(null, args);
    }
  };
}
