import Ember from 'ember';
import Proj from 'ember-flexberry-data';

export default Ember.Mixin.create({
  init() {
    this._super(...arguments);
    var originDefineProjection = this.constructor.defineProjection;
    var defineProjection = function(projectionName, modelName, attributes) {
      let proj = originDefineProjection(projectionName, modelName, attributes);
      let attrs = proj.attributes;

      function addSycPropertiesToProjection(proj, attrs) {
        attrs['createTime'] = Proj.attr('Creation Time', { hidden: true });
        attrs['creator'] = Proj.attr('Creator', { hidden: true });
        attrs['editTime'] = Proj.attr('Edit Time', { hidden: true });
        attrs['editor'] = Proj.attr('Editor', { hidden: true });
        attrs['syncDownTime'] = Proj.attr('SyncDown Time', { hidden: true });
        attrs['readOnly'] = Proj.attr('Read Only', { hidden: true });
        proj.attributes = attrs;

        /* Add meta properties to all relationships in projection so they can
		   be serialized and deserialized in embedded records.*/
        for (let key in attrs) {
          if (attrs.hasOwnProperty(key) && !Ember.isNone(key.kind) &&
		  (key.kind === 'belongsTo' || key.kind === 'hasMany')) {
            addSycPropertiesToProjection(key, key.attributes)
          }
        }
	  }

      addSycPropertiesToProjection(proj, attrs);
      this.projections.set(projectionName, proj);
	};

    this.constructor.defineProjection = defineProjection;

    let syncer = Ember.getOwner(this).lookup('syncer:main');
    this.set('syncer', syncer);
  },

  /**
   * Creation date and time of model.
   * Updates on server side by Flexberry Audit subsystem.
   *
   * @property createTime
   * @type Date
   */
  createTime: DS.attr('date'),
  /**
   * Name of user who created model.
   * Updates on server side by Flexberry Audit subsystem.
   *
   * @property creator
   * @type String
   */
  creator: DS.attr('string'),
  /**
   * Date and time of last changes in model.
   * Updates on server side by Flexberry Audit subsystem.
   *
   * @property editTime
   * @type Date
   */
  editTime: DS.attr('date'),
  /**
   * Name of user who changed model last time.
   * Updates on server side by Flexberry Audit subsystem.
   *
   * @property editor
   * @type String
   */
  editor: DS.attr('string'),
  /**
   * Date and time of last sync down of model.
   *
   * @property editTime
   * @type Date
   */
  syncDownTime: DS.attr('date'),
  /**
   * Flag to indicate that model synchronized in readonly mode.
   * Readonly mode allows to prevent any modifications of model on client side or server side.
   *
   * @property readOnly
   * @type Boolean
   * @readOnly
   */
  readOnly: DS.attr('boolean'),

  /**
   * Global instance of Syncer that contains methods to sync model.
   *
   * @property syncer
   * @type Syncer
   * @readOnly
   */
  syncer: null,

  /**
   * Extends saving method of model to set metadata properties.
   *
   * @method save
   */
  save: function() {
    if (Ember.isNone(this.get('readOnly')) || !this.get('readOnly')) {
      if (this.get('hasDirtyAttributes') && !this.get('isDeleted')) {
        let modifiedTime = new Date();
        if (Ember.isNone(this.get('readOnly'))) {
          this.set('readOnly', false);
        }

        if (this.get('isNew')) {
          this.set('createTime', modifiedTime);
        }

        this.set('editTime', modifiedTime);

        this._super(...arguments);
      }
    }
    else {
      throw new Error('Attempt to save readonly model \'' + this.get('modelName') + '\'');
    }
  }
});
