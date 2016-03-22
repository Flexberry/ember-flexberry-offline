import Syncer from '../syncer';

export function initialize(application) {
  application.register('syncer:main', Syncer);
}

export default {
  name: 'syncer',
  before: 'store',
  initialize
};
