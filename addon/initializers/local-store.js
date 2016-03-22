import LocalStore from '../stores/local-store';

export function initialize(application) {
  application.register('store:local', LocalStore);
}

export default {
  name: 'local-store',
  before: 'syncer',
  initialize
};
