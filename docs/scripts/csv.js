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

function preparePrice(price, name) {
  data = filterEmpty(price);
  if (data.length < price.length) {
    console.log('In %s empty lines: %s', name, price.length - data.length);
  }
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
      var not_in_price = [];
      web.forEach(w => {
        var el = Object.assign({}, w);
        r = price.filter(p => {
          return el.n == p.n;
        });
        if (r.length > 0) {
          if (el.lat != r[0].lat || el.lon != r[0].lon) {
            not_equal.push([w, r[0]]);
          }
          if (parseFloat(el.lat) != el.lat || parseFloat(el.lon) != el.lon) {
            if (parseFloat(r[0].lat) != r[0].lat || parseFloat(r[0].lon) != r[0].lon) {
              corrupted_coords.push([w, r[0]]);
            } else {
              corrupted_coords.push(w);
              el.lat = r[0].lat;
              el.lon = r[0].lon;
              el.price = r[0].price;
              el.fuel = r[0].price_fuel;
              result.push(el);
            }
          } else {
            el.price = r[0].price;
            el.fuel = r[0].price_fuel;
            result.push(el);
          }
        } else {
          not_in_price.push(el);
        }
      });

      var not_in_web = [];
      price.forEach(p => {
        var el = Object.assign({}, p);
        r = result.filter(r => {
          return el.n == r.n;
        });
        if (r.length == 0) {
          not_in_price.push(p);
          if (parseFloat(p.lat) != p.lat || parseFloat(p.lon) != p.lon) {
            corrupted_coords.push(p);
          } else {
            el.fuel = el.price_fuel;
            el.services = [];
            result.push(el);
          }
        }
      });

      if (corrupted_coords.length > 0) {
        console.log('Corrupted coordinates for %s lines', corrupted_coords.length);
        console.log(corrupted_coords);
      }
      if (not_equal.length > 0) {
        console.log('Not equal coordinates for %s lines', not_equal.length);
        console.log(not_equal);
      }
      if (not_in_web.length > 0) {
        console.log('Not in %s: %s', web_name, not_in_web.length);
        console.log(not_in_web);
      }
      if (not_in_price.length > 0) {
        console.log('Not in %s: %s', price_name, not_in_price.length);
        console.log(not_in_price);
      }
      console.log('Total load: %s', result.length);

      // return result;

      csv = result;

      setMode(true);
      getVisible(true);
    });
};
