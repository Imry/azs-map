const CSV_MAP = 'data/dispenser_list_web.csv';
const CSV_PRICE = 'data/dispenser_list_price.csv';
const NEAREST_COUNT = 5;

var myMap;
var position = null;
var csv = [];
var nearest_mode = true;
var skip_activeroutechange = false;

function getVisible(zoom) {
  if (position == null) return;
  if (csv.length == 0) return;

  function getCoords(point) {
    return [point["lat"], point["lon"]]
  }

  var data = applyFilters(csv);
  var coordSystem = myMap.options.get('projection').getCoordSystem();
  myDistancePanel.hide();

  if (nearest_mode) {
    showData(data.map(el => ({data: el, dst: coordSystem.getDistance(position, getCoords(el))}))
      .sort((a, b) => a.dst - b.dst)
      .slice(0, NEAREST_COUNT)
      .map(el => el.data), zoom);
  } else {
    var route = myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
      .then(function(multiRoute) {
        route = multiRoute.getActiveRoute();
        if (route !== null) {
          myDistancePanel.show((route.properties.get('distance').value / 1000).toFixed(1));
          data = Array.from(new Set(
              route.getPaths().get(0).getSegments().toArray().map(segment =>
                data.map(el => ({point: el, dst: coordSystem.getDistance(segment.geometry.getBounds()[0], getCoords(el))}))
                  .reduce((acc, val) => val.dst < acc.dst ? val : acc).point
          )));
        }
        showData(data, zoom);
      });
  }
}

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

function applyFilters(data) {
  return applyPartial(applyPartial(csv,
      'services__list', 'services'),
      'fuel-types__list', 'fuel');
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
  });

  myClusterer = new Clusterer(myMap);
  myDistancePanel = new DistancePanel(myMap);

  myMap.controls.get('routeButtonControl').routePanel.enable();
  myMap.controls.get('routeButtonControl').routePanel.options.set({
        types: { driving: true }
    });
  myMap.controls.get('routeButtonControl').routePanel.getRouteAsync()
    .then(function(multiRoute) {
      multiRoute.options.set({routeActiveStrokeColor: "#0070ea"});
      multiRoute.events.add("activeroutechange", function () {
        if (!skip_activeroutechange) {
          setMode(false);
        }
        skip_activeroutechange = false;
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
    if (!nearest_mode) {
    skip_activeroutechange = true;
    myMap.controls.get('routeButtonControl').routePanel.state.set({
      expanded: false,
      from: '',
      to: ''
    });
    setMode(true);
    getVisible(true);

    }
  });

  $("#filter_all").click(function(e){
    if (nearest_mode) {
      setMode(false);
      $('#filter').find('input').prop("checked", false);
      getVisible(true);
    }
  });

  $('.js-dropdown-btn').click(filterPanelToggle);
});
