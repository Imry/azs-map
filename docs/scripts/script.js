const CSV_MAP = 'data/dispenser_list_web.csv';
const CSV_PRICE = 'data/dispenser_list_price.csv';
const NEAREST_COUNT = 5;
const NEAR_ROUTE_MAX_DISTANCE = 100;
const NEAR_ROUTE_MAX_DISTANCE_RATIO = 0.25;

var myMap;
var position = null;
var csv = [];
var nearest_mode = true;

function getVisible(zoom) {
  if (position == null) return;
  if (csv.length == 0) return;

  function getCoords(point) {
    return [point["lat"], point["lon"]]
  }

  var data = applyFilters(csv);

  if (nearest_mode) {
    var distance = [];
    var coordSystem = myMap.options.get('projection').getCoordSystem();
    for (var i = 0, l = data.length; i < l; ++i) {
      distance.push([data[i], coordSystem.getDistance(position, getCoords(data[i]))]);
    }
    nearest = distance.sort(function(a, b) {return (a[1] - b[1]);}).slice(0, NEAREST_COUNT);
    data = [];
    for (var i = 0; i < nearest.length; ++i) {
      data.push(nearest[i][0]);
    }

    showData(data, zoom);
  } else {
    var route = myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
      .then(function(multiRoute) {
        route = multiRoute.getActiveRoute();
        if (route !== null) {

          myMap.controls.remove(myDistancePanel);
          myDistancePanel._dist = (route.properties.get('distance').value / 1000).toFixed(1);
          myMap.controls.add(myDistancePanel, {
            float: 'none',
            position: {
              bottom: 40,
              left: 10
            }
          });

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
            selNearest.push(nearest(geometry, data));
          }
          data = Array.from(new Set(selNearest));

        } else {
          myMap.controls.remove(myDistancePanel);
        }

        showData(data, zoom);
      });
    }

}

function applyFilters(data) {
  function applyPartial(data, filter_block, data_field) {
    filter = $('#filter .' + filter_block + ' input:checked').map(function() {return $(this).attr('name');}).toArray();
    if (filter.length !== 0) {
      data = data.filter(function(it) {
        return (
          filter.every(function(its) {
            return (it[data_field].indexOf(its) !== -1);
          }))
      });
    }
    return data;
  }
  return applyPartial(applyPartial(csv, 'services__list', 'services'), 'fuel-types__list', 'fuel');
}

function showData(data, zoom) {
  if (data.length > 0) {
    myClusterer.show(data, zoom);
  } else {
    myClusterer.clear();
  }
}


function routeTo(lat, lon) {
  setMode(false);
  var state = myMap.controls.get('routeButtonControl').routePanel.state;
  state.set('expanded', true);
  state.set('from', position);
  state.set('to', [lat, lon]);
}

ymaps.ready(function () {
  myMap = new ymaps.Map('YMapsID', {
    center: [55, 37],
    zoom: 6,
    behaviors: ['drag', 'scrollZoom'],
    controls: ['routeButtonControl', 'geolocationControl', 'searchControl', 'zoomControl', 'rulerControl']
  });

  ymaps.geolocation.get({
    provider: 'auto',
    // mapStateAutoApply: true
  }).then(function (result) {
    position = result.geoObjects.position;
    myMap.setCenter(position, 12, {
      checkZoomRange: true
    });
    myMap.geoObjects.add(result.geoObjects);

    myContextMenu = new ContextMenu(myMap, position);
  }).then(function (result) {
    loadCSV(CSV_MAP, CSV_PRICE);
    nearest_mode = true;
    getVisible(true);
  });

  myClusterer = new Clusterer(myMap);
  augmentDistancePanleClass();
  myDistancePanel = new DistancePanelClass();

  myMap.controls.get('routeButtonControl').routePanel.enable();
  myMap.controls.get('routeButtonControl').routePanel.options.set({
        types: { driving: true }
    });
  myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
    .then(function(multiRoute) {
      multiRoute.options._cache.routeActiveStrokeColor = "#0070ea";
    });
  myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
    .then(function(multiRoute) {
      multiRoute.events.add("activeroutechange", function () {
        getVisible();
      }).add("update", function () {
        getVisible();
      });
    });

  myMap.controls.get('geolocationControl').events.add("locationchange", function (event) {
    position = event.get('geoObjects').position;
  })
});

function setMode(mode) {
  nearest_mode = mode;
  $('.buttons .pushed').removeClass('pushed');
  if (mode) {
    $('#filter_nearest').addClass('pushed');
  } else {
    $('#filter_all').addClass('pushed');

  }
}

function filterPanelToggle() {
  $('.js-filter-panel').toggle('fast');
  $('.js-dropdown-btn').toggleClass('m-raised');
  $('#YMapsID').toggleClass('m-raised');
  myMap.container.fitToViewport();
}

$(document).ready(function(){
  $("#filter_nearest").click(function(e){
    // $('.buttons .pushed').removeClass('pushed');
    // $(e.target).addClass('pushed');
    if (!nearest_mode) {
      myMap.controls.get('routeButtonControl').routePanel.state.set({
        expanded: false,
        from: '',
        to: ''
      });
      setMode(true);
      // nearest_mode = true;
      getVisible(true);
    }
  });

  $("#filter_all").click(function(e){
    // $('.buttons .pushed').removeClass('pushed');
    // $(e.target).addClass('pushed');
    if (nearest_mode) {
      setMode(false);
      // nearest_mode = false;
      $('#filter').find('input').prop("checked", false);
      getVisible(true);
    }
  });

  $('.js-dropdown-btn').click(filterPanelToggle);
});
