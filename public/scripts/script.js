var myMap;
var ncsv;
var position_obj;

function find_nearest(is_nearest) {
  function getCoords(point) {
    return [point["lat"], point["lon"]]
  }
  ncsv = [];

  if (is_nearest) {
    $('#filter').find('input').attr("disabled", true);
    var distance = [];
    var coordSystem = myMap.options.get('projection').getCoordSystem();
    for (var i = 0, l = csv.length; i < l; ++i) {
      distance.push([i, coordSystem.getDistance(position_obj.position, getCoords(csv[i]))]);
    }
    var d = distance.sort(function(a, b) {return (a[1] - b[1]);}).slice(0, 5);
    ncsv = [];
    for (var i = 0, l = d.length; i < l; ++i) {
      ncsv.push(csv[d[i][0]]);
    }
  } else {
    $('#filter').find('input').removeAttr("disabled");
    sel = get_selected();
    ncsv = applyFilters(sel);
  }

  var route = myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
    .then(function(multiRoute) {
      route = multiRoute.getActiveRoute();
      if (route !== null) {
        // console.log(route.properties.get('distance'));
        myMap.controls.remove(customControl);
        customControl._dist = (route.properties.get('distance').value / 1000).toFixed(1);
        myMap.controls.add(customControl, {
          float: 'none',
          position: {
            bottom: 40,
            left: 10
          }
        });

        /* $('#route').html("");
        moveList = 'Трогаемся,</br>';
        segments = route.getPaths().get(0).getSegments().toArray();
        for (var j = 0; j < segments.length; j++) {
          prop = segments[j].properties;

          var street = prop.get('street');
          moveList += ('Едем ' + prop.get('action').text + (street ? ' на ' + street : '') + ', проезжаем ' + prop.get('distance').text + ' м.,');
          moveList += '</br>'
        }
        moveList += 'Останавливаемся.';
        $('#route').append(moveList); */

        function nearest(givenPoint, points) {
          var coordSystem = myMap.options.get('projection').getCoordSystem();

          var minDist = coordSystem.getDistance(givenPoint, getCoords(points[0]));
          var closestPointIdx = 0;
          for (var i = 1, l = points.length; i < l; ++i) {
            var dist = coordSystem.getDistance(givenPoint, getCoords(points[i]));
            if (minDist > dist) {
              minDist = dist;
              closestPointIdx = i;
            }
          }
          return points[closestPointIdx];
        }

        var selNearest = [];
        var segments = route.getPaths().get(0).getSegments().toArray();
        for (var j = 0; j < segments.length; j++) {
          var geometry = segments[j].geometry._bounds[0];
          selNearest.push(nearest(geometry, ncsv));
        }
        ncsv = Array.from(new Set(selNearest));
      } else {
        myMap.controls.remove(customControl);
      }

      if (ncsv.length > 0) {
        myClusterer.show(ncsv, is_nearest);
      } else {
        myClusterer.clear();
      }
    });
}

function applyFilters(sel) {
  ncsv = csv;
  if (sel["service"].length !== 0) {
    ncsv = csv.filter(function(it) {
      return (
        sel["service"].every(function(its) {
          return (it["services"].indexOf(its) !== -1);
        }))
    });
  }
  if (sel["fuel"].length !== 0) {
    ncsv = ncsv.filter(function(it) {
      return (
        sel["fuel"].every(function(its) {
          return (it["fuel"].indexOf(its) !== -1);
        }))
    });
  }
  return ncsv;
}

function get_selected() {
  var selected = [];
  $('#filter input:checked').each(function() {selected.push(this.name)});

  var sel = {service:[], fuel:[]};
  selected.forEach(function(e){
    if (['cls', 'shower', 'glass', 'cafe', 'wc', 'pum', 'mag'].indexOf(e) !== -1) {
      sel['service'].push(e);
    } else {
      sel['fuel'].push(e);
    }
  });
  return sel;
}

function route_to(lat, lon) {
  var state = myMap.controls.get('routeButtonControl').routePanel.state;
  state.set('expanded', true);
  state.set('from', position_obj.position);
  state.set('to', [lat, lon]);
}

ymaps.ready(function () {
  myMap = new ymaps.Map('YMapsID', {
    center: [47, 39],
    zoom: 6,
    behaviors: ['drag', 'scrollZoom'],
    controls: ['routeButtonControl', 'geolocationControl', 'searchControl', 'zoomControl', 'rulerControl']
  });

  CustomControlClass = function (options) {
    CustomControlClass.superclass.constructor.call(this, options);
    this._$content = null;
    this._dist = '';
  };
  // И наследуем его от collection.Item.
  ymaps.util.augment(CustomControlClass, ymaps.collection.Item, {
    onAddToMap: function (map) {
      CustomControlClass.superclass.onAddToMap.call(this, map);
      this.getParent().getChildElement(this).then(this._onGetChildElement, this);
    },
    onRemoveFromMap: function (oldMap) {
      if (this._$content) {
        this._$content.remove();
      }
      CustomControlClass.superclass.onRemoveFromMap.call(this, oldMap);
    },
    _onGetChildElement: function (parentDomContainer) {
      // Создаем HTML-элемент с текстом.
      this._$content = $('<div class="customControl"><b>Расстояние ' + this._dist + ' км</b><div>').appendTo(parentDomContainer);
    }
  });

  customControl = new CustomControlClass();

  ymaps.geolocation.get({
    // Выставляем опцию для определения положения по ip
    provider: 'yandex',
    // Карта автоматически отцентрируется по положению пользователя.
    mapStateAutoApply: true
  }).then(function (result) {
    position_obj = result.geoObjects;
    myMap.geoObjects.add(result.geoObjects);
  });

  myContextMenu = new ContextMenu(myMap);
  myClusterer = new Clusterer(myMap);

  myMap.controls.get('routeButtonControl').routePanel.enable();
  myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
    .then(function(multiRoute) {
      multiRoute.options._cache.routeActiveStrokeColor = "#0070ea";
    });
  myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
    .then(function(multiRoute) {
      multiRoute.events.add("activeroutechange", function () {
        find_nearest();
      }).add("update", function () {
        find_nearest();
      });
    });

  find_nearest();
});

$(document).ready(function(){
  $("#filter_nearest").click(function(){
    find_nearest(true);
    myMap.geoObjects.add(position_obj);
  });

  $("#filter_all").click(function(){
    find_nearest();
  });
});
