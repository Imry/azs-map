function ContextMenu(map, position) {
    this._coordinates = null;
    this._model = new ContextMenu.Model(map);
    this._view = new ContextMenu.View();
    this._position = position;

    this.setMap(map);
}

ContextMenu.prototype = {
    constructor: ContextMenu,
    _attachHandlers: function () {
        this._model.events
            .add('openmenu', this._onOpenMenu, this)
            .add('closemenu', this._onCloseMenu, this)
            .add('infoloaded', this._onInfoLoaded, this)

        this._view.events
            .on('selectaction', ymaps.util.bind(this._onSelectAction, this));
    },
    _detachHandlers: function () {
        this._model.events
            .remove('openmenu', this._onOpenMenu, this)
            .remove('closemenu', this._onCloseMenu, this)
            .remove('infoloaded', this._onInfoLoaded, this)

        this._view.events
            .off('selectaction');
    },
    _onOpenMenu: function (e) {
        this._view.clear();
        this._view.render(e.get('position'));
        this._coordinates = e.get('coordinates');
    },
    _onCloseMenu: function (e) {
        this._view.clear();
    },
    _onInfoLoaded: function (e) {
        var result = e.get('result');

        if(result) {
            this._map.balloon
                .open(result.geometry.getCoordinates(), {
                    content: result.properties.get('balloonContentBody')
                });
        }
    },
    _onSelectAction: function (e) {
        this[e.action]();
        this._view.clear();
    },
    setMap: function (map, lb) {
        if(map == this._map) {
            return;
        }


        this._detachHandlers();
        this._map = map;
        this._attachHandlers();
    },
    getInfo: function () {
        this._model.getInfo(this._coordinates);
    },
    addMarker: function (label) {
        var marker = new ymaps.Placemark(this._coordinates, {
            iconContent: label
        });

        this._map.geoObjects
            .add(marker);

        return marker;
    },
    routeFrom: function () {
        this._addWayPoint(0);
    },
    routeTo: function () {
        this._addWayPoint(1);
    },
    _addWayPoint: function (index) {
        var state = this._model._map.controls.get('routeButtonControl').routePanel.state;
        var from = state.get('from'), to = state.get('to');
        if (index == 0) {
            from = this._coordinates;
            if (to == null || to == '') {
                to = this._position;
            }
        } else {
            to = this._coordinates;
            if (from == null || from == '') {
                from = this._position;
            }
        }
        state.set({
            from: from,
            to: to,
            expanded: true
        });
    }
};

ContextMenu.Model = function (map) {
    this.events = new ymaps.event.Manager();
    this.setMap(map);
};

ContextMenu.Model.prototype = {
    constructor: ContextMenu.Model,
    setMap: function (map) {
        if(map == this._map) {
            return;
        }

        this._detachHandlers();
        this._map = map;
        this._attachHandlers();
    },
    _attachHandlers: function () {
        if(this._map) {
            this._map.events
                .add('contextmenu', this._onRightClick, this)
                .add(['click', 'actiontick'], this._onMapAction, this);
        }
    },
    _detachHandlers: function () {
        if(this._map) {
            this._map.events
                .remove('contextmenu', this._onRightClick, this)
                .remove(['click', 'actiontick'], this._onMapAction, this);
        }
    },
    _onRightClick: function (e) {
        var position = e.get('position');

        this.events.fire('openmenu', {
            position: {
                left: position[0],
                top: position[1]
            },
            coordinates: e.get('coords')
        });
    },
    _onMapAction: function (e) {
        this.events.fire('closemenu', {});
    },
    getInfo: function (coordinates) {
        ymaps.geocode(coordinates)
            .then(
                ymaps.util.bind(this._onInfoLoaded, this)
            );
    },
    _onInfoLoaded: function (res) {
        this.events.fire('infoloaded', {
            result: res.geoObjects.get(0)
        });
    }
};

ContextMenu.View = function () {
    this.events = $({});
    this._container = $('body');
    this._menu = $(
        '<div class="contextmenu clearfix">' +
            '<ul class="contextmenu-list">' +
                '<li><a data-action="getInfo" href="#">Что здесь?</a></li>' +
                '<li><a data-action="routeTo" href="#">Проехать сюда</a></li>' +
                '<li><a data-action="routeFrom" href="#">Проехать отсюда</a></li>' +
            '</ul>' +
        '</div>'
    );
};

ContextMenu.View.prototype = {
    constructor: ContextMenu.View,
    render: function (position) {
        this._menu
            .css(position)
            .appendTo(this._container);

        this._attachHandlers();
    },
    clear: function () {
        this._detachHandlers();
        this._menu.remove();
    },
    _attachHandlers: function () {
        this._menu
            .on('click', 'a', $.proxy(this._onSelectAction, this));
    },
    _detachHandlers: function () {
        this._menu
            .off('click', 'a');
    },
    _onSelectAction: function (e) {
        e.preventDefault();

        this.events.trigger($.Event('selectaction', {
            action: $(e.target).attr('data-action')
        }));
    }
};
