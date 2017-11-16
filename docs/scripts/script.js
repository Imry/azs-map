const AZS_CSV_FILE_MAP = 'data/dispenser_list_web.csv';
const AZS_CSV_FILE_PRICE = 'data/dispenser_list_price.csv';
const NEAREST_COUNT = 5;
const NEAR_ROUTE_MAX_DISTANCE = 200;
const NEAR_ROUTE_MAX_DISTANCE_RATIO = 0.1;

var myMap;
var position;
var csv;
var nearest = false;

var ncsv;


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
      distance.push([i, coordSystem.getDistance(position, getCoords(csv[i]))]);
    }
    var d = distance.sort(function(a, b) {return (a[1] - b[1]);}).slice(0, NEAREST_COUNT);
    ncsv = [];
    for (var i = 0, l = d.length; i < l; ++i) {
      ncsv.push(csv[d[i][0]]);
    }
  } else {
    $('#filter').find('input').removeAttr("disabled");
    ncsv = applyFilters(csv);
  }

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
          selNearest.push(nearest(geometry, ncsv));
        }
        ncsv = Array.from(new Set(selNearest));
      } else {
        myMap.controls.remove(myDistancePanel);
      }

      if (ncsv.length > 0) {
        // myClusterer.show(ncsv, is_nearest);
        myClusterer.show(ncsv, true);
      } else {
        myClusterer.clear();
      }
    });
}

function applyFilters(data) {
  var result = data;
  services = $('#filter .services__list input:checked').map(function() {return $(this).attr('name');}).toArray();
  if (services.length !== 0) {
    result = data.filter(function(it) {
      return (
        services.every(function(its) {
          return (it["services"].indexOf(its) !== -1);
        }))
    });
  }
  fuel = $('#filter .fuel-types__list input:checked').map(function() {return $(this).attr('name');}).toArray();
  if (fuel.length !== 0) {
    result = result.filter(function(it) {
      return (
        fuel.every(function(its) {
          return (it["fuel"].indexOf(its) !== -1);
        }))
    });
  }
  return result;
}

function routeTo(lat, lon) {
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
  });

  myContextMenu = new ContextMenu(myMap);
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
        find_nearest();
      }).add("update", function () {
        find_nearest();
      });
    });

  myMap.controls.get('geolocationControl').events.add("locationchange", function (event) {
    position = event.get('geoObjects').position;
  })

  loadCSV(AZS_CSV_FILE_MAP, AZS_CSV_FILE_PRICE);

  find_nearest();
});

function filterPanelToggle() {
  $('.js-filter-panel').toggle('fast');
  $('.js-dropdown-btn').toggleClass('m-raised');
}

$(document).ready(function(){
  $("#filter_nearest").click(function(){
    find_nearest(true);
  });

  $("#filter_all").click(function(){
    find_nearest();
  });

  $('.js-dropdown-btn').click(filterPanelToggle);
});