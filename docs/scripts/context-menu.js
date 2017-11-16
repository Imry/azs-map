function ContextMenu(map) {
    this._coordinates = null;
    this._waypoints = [];
    this._route = null;
    this._model = new ContextMenu.Model(map);
    this._view = new ContextMenu.View();

    this.setMap(map);
}

ContextMenu.WAYPOINTS_LABELS = 'АБ';

ContextMenu.prototype = {
    constructor: ContextMenu,
    _attachHandlers: function () {
        this._model.events
            .add('openmenu', this._onOpenMenu, this)
            .add('closemenu', this._onCloseMenu, this)
            .add('infoloaded', this._onInfoLoaded, this)
            .add('routeloaded', this._onRouteLoaded, this);

        this._view.events
            .on('selectaction', ymaps.util.bind(this._onSelectAction, this));
    },
    _detachHandlers: function () {
        this._model.events
            .remove('openmenu', this._onOpenMenu, this)
            .remove('closemenu', this._onCloseMenu, this)
            .remove('infoloaded', this._onInfoLoaded, this)
            .remove('routeloaded', this._onRouteLoaded, this);

        this._view.events
            .off('selectaction');
    },
    _onOpenMenu: function (e) {
        this._view.clear();
        this._view.render(e.get('position'));
        this._coordinates = e.get('coordinates');
        // console.log(e);
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
        // this._getRoute();
    },
    routeTo: function () {
        this._addWayPoint(1);
        // this._getRoute();
    },
    _getRoute: function () {
        var state = this._model._map.controls.get('routeButtonControl').routePanel.state,
            origin = state.get('from'),
            destination = state.get('to');

        // console.log(origin);
        // console.log(destination);

        // if(origin && destination) {
        //     this._model.getRoute([origin, destination]);

        // }
    },
    _addWayPoint: function (index) {
        var state = this._model._map.controls.get('routeButtonControl').routePanel.state;
        // console.log(state);

        if (index == 0) {
            state.set('from', this._coordinates);
            state.set('expanded', true);
        } else {
            state.set('to', this._coordinates);
            state.set('expanded', true);
        }

        // var waypoints = this._waypoints,
        //     label = ContextMenu.WAYPOINTS_LABELS.charAt(index),
        //     marker = this.addMarker(label);

        // if(waypoints[index]) {
        //     this._map.geoObjects
        //         .remove(waypoints[index]);
        // }

        // if(this._route) {
        //     this._map.geoObjects
        //         .remove(this._route);
        // }

        // this._map.geoObjects
        //     .add(waypoints[index] = marker);
    },
    _onRouteLoaded: function (e) {
        // this._route = e.get('result');
        // this._map.geoObjects
        //     .add(this._route = e.get('result'));

        // this._route.options.set('preset', 'router#route');

        // console.log(this._map.geoObjects);

        // $('#route').html("");
        // moveList = 'Трогаемся,</br>',
        // way = e.get('result');
        // // console.log(way);
        // segments = way.getSegments();
        // for (var j = 0; j < segments.length; j++) {
        //     var street = segments[j].getStreet();
        //     moveList += ('Едем ' + segments[j].getHumanAction() + (street ? ' на ' + street : '') + ', проезжаем ' + segments[j].getLength() + ' м.,');
        //     moveList += '</br>'
        // }

        // moveList += 'Останавливаемся.';
        // // Выводим маршрутный лист.
        // $('#route').append(moveList);

        find_nearest();
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
            // var behavior = this._map.behaviors.get('routeEditor');
            // behavior.events.add('routechange', function (e) {
            //    var newRoute = e.get('newRoute');
            //    console.log(newRoute.getLength()); // длина нового маршрута
            // });
            // this._map.controls.get('routeButtonControl').routePanel.events.add('optionschange', console.log('Options change'), this);
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
    },
    getRoute: function (waypoints) {
        this._route = this._map.controls.get('routeButtonControl').routePanel.getRoute().getActiveRoute();
        // console.log(this._map.controls.get('routeButtonControl').routePanel.getRoute().getActiveRoute());
        // console.log('in context: ' + this._route);
        this._onRouteLoaded(this._route);
        // route = ymaps.route(waypoints)
        //     .then(
        //         ymaps.util.bind(this._onRouteLoaded, this)
        //     );
    },
    _onRouteLoaded: function (route) {
        this.events.fire('routeloaded', {
            result: route.getPaths().get(0)
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