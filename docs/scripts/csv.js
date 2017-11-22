Papa.parsePromise = function(file) {
  return new Promise(function(complete, error) {
    Papa.parse(file, {
      download: true,
      delimiter: ";",
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: complete,
      error: error});
  });
};

function filterEmpty(data) {
  return data.filter(el => {
    return !Object.keys(el).every(k => {
      return el[k].toString().trim() == '';
    });
  });
}

function prepareWeb(web, name) {
  data = filterEmpty(web);
  if (data.length < web.length) {
    console.log('In %s empty lines: %s', name, web.length - data.length);
  }
  data.map(el => {
    el.services = el.services.split(',').map(s => {
      s = s.trim();
      if (s != 'shower') {
        return s.trim();
      }
    }).sort();
  });
  data.map(el => {
    el.fuel = el.fuel.split(',').map(s => {
      s = s.trim();
      if (s != 'dtW') {
        return s.trim();
      }
    }).sort();
  });
  console.log('Load from %s: %s', name,  data.length);
  return data;
}

function preparePrice(data, name) {
  data.map(el => {
    var nfuel = [];
    el.fuel.split(',').map(s => {
      s = s.trim();
      if (s != 'dtW') {
        return s.trim();
      }
    }).sort().forEach(f => {
      if (f != '') {
        nfuel.push(f);
      }
    });
    el.fuel = nfuel;
  });

  var error = [];
  data.map(el => {
    price = [];
    var price_fuel = []
    for (key in el) {
      if (!['type', 'lat', 'lon', 'address', 'n', 'fuel', 'region'].includes(key) && el[key] != '') {
        var nkey = key;
        if (key == 'dtW') {
          nkey = 'dt';
        }
        price.push([nkey, el[key]]);
        price_fuel.push(nkey);
      }
    }
    price_fuel.sort();
    var is_same = (price_fuel.length == el.fuel.length) && price_fuel.every(function(element, index) {
        return element === el.fuel[index];
    });
    if (!is_same) {
      error.push(el);
    }
    el.price = price;
    el.price_fuel = price_fuel;
  });
  if (error.length > 0) {
    console.log('Difference in fuel and prices: %s', error.length);
    console.log(error);
  }
  console.log('Load from %s: %s', name, data.length);
  return data; 
}

function loadCSV(web_name, price_name) {
  Promise.all([Papa.parsePromise(web_name), Papa.parsePromise(price_name)])
    .then(function(allData) {
      // All web available here in the order it was called.
      var web = prepareWeb(allData[0].data, web_name);
      var price = preparePrice(allData[1].data, price_name);

      var result = [];
      var not_equal = [];
      var corrupted_coords = [];
      web.forEach(el => {
        r = price.filter(function(it) {
          return el.n == it.n;
        });
        if (r.length > 0) {
          if (el.lat != r[0].lat || el.lon != r[0].lon) {
            not_equal.push([el, r[0]]);
          }
          if (parseFloat(el.lat) != el.lat || parseFloat(el.lon) != el.lon) {
            corrupted_coords.push(el);
          } else {
            el.price = r[0].price;
            el.fuel = r[0].price_fuel;
            result.push(el);
          }
        } else {
          console.log(el);
        }
      });
      // console.log(result);
      if (corrupted_coords.length > 0) {
        console.log('Corrupted coordinates for %s lines', corrupted_coords.length);
        console.log(corrupted_coords);
      }
      if (not_equal.length > 0) {
        console.log('Not equal coordinates for %s lines', not_equal.length);
        console.log(not_equal);
      }
      csv = result;
      console.log('Total load: %s', csv.length);

      setMode(true);
      getVisible(true);
    });
};
