function Clusterer(map) {
  this._clusterer = null;
  this._objects = [];
  this._map = null;

  this.show = function(data, zoom) {
    function getPointData(address, n, services, fuel, lat, lon) {
      var formattedServices = services.map(function(service) {
        return '<span class="icon-in-map-baloon m-' + service + '"></span>'
      });
      var formattedFuel = fuel.map(function(fuel) {
        return '<p><span class="icon-in-map-baloon m-' + fuel[0] + '"></span> ' +  fuel[1] + 'р.<p>'
      });

      return {
        balloonContentHeader: '<span class="c-blue">АЗС №' + n + '</span>',
        balloonContentBody:
          '<p><span class="c-blue">Адрес:</span> ' + address + '</p>'
          + '<p><span class="c-blue">Сервисы:</span> ' + formattedServices.join(' ') + '</p>'
          + '<p><span class="c-blue">Тип толпива:</span> ' + formattedFuel.join(' ') + '</p>'
          + '<p><span class="c-blue">Широта:</span> ' + lat
          + ', <span class="c-blue">Долгота:</span> ' + lon + '</p>'
          + '<p><button type="button" class="btn" onclick=route_to(' + lat + ',' + lon + ')>Построить маршрут</button></p>',
        clusterCaption: '<span class="c-blue"><strong>АЗС №' + n + '</strong></span>'
      };
    }

    this._clusterer.removeAll();
    var obj = [];
    for(var i = 0, len = data.length; i < len; i++) {
      var item = data[i];
      obj[i] = new ymaps.GeoObject({
        geometry: {
          type: "Point",
          coordinates: [item["lat"], item["lon"]]
        },
        properties: getPointData(
          item["address"],
          item["n"],
          item["services"],
          item["price"],
          item["lat"],
          item["lon"]
        )
      },
      {
        iconLayout: 'default#image',
        iconImageHref: 'images/icon-location.svg',
        iconImageSize: [25, 32]
      });
    }
    this._clusterer.add(obj);
    if (zoom) {
      this._map.setBounds(this._clusterer.getBounds(), {
        checkZoomRange: true
      });
    }
    this._map.geoObjects.add(this._clusterer);
  };

  this.setMap = function(map) {
    if(map === this._map) {
      return;
    }
    this._map = map;

    this._clusterer = new ymaps.Clusterer({
      gridSize: 80,
      preset: 'islands#BlueClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: true,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false
    });
  };

  this.clear = function() {
    this._clusterer.removeAll();
  };

  this.setMap(map);
}


