DistancePanelClass = function (options) {
  DistancePanelClass.superclass.constructor.call(this, options);
  this._$content = null;
  this._dist = '';
};

function augmentDistancePanleClass() {
  ymaps.util.augment(DistancePanelClass, ymaps.collection.Item, {
    onAddToMap: function (map) {
      DistancePanelClass.superclass.onAddToMap.call(this, map);
      this.getParent().getChildElement(this).then(this._onGetChildElement, this);
    },
    onRemoveFromMap: function (oldMap) {
      if (this._$content) {
        this._$content.remove();
      }
      DistancePanelClass.superclass.onRemoveFromMap.call(this, oldMap);
    },
    _onGetChildElement: function (parentDomContainer) {
      this._$content = $('<div class="distancePanel"><b>Расстояние ' + this._dist + ' км</b><div>').appendTo(parentDomContainer);
    }
  });
};
