function DistancePanel(map) {
  this.show = function (distance) {
    this._panel._dist = distance;
    this._map.controls.add(this._panel, {
      float: 'none',
      position: {
        bottom: 40,
        left: 10
      }
    });
  };

  this.hide = function () {
    this._map.controls.remove(this._panel);
  };

  DistancePanelClass = function (options) {
    DistancePanelClass.superclass.constructor.call(this, options);
    this._$content = null;
    this._dist = '';
  };

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

  this._map = map;
  this._panel = new DistancePanelClass();
};
