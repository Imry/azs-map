Papa.parsePromise = function(file) {
  return new Promise(function(complete, error) {
    Papa.parse(file, {
      download: true,
      delimiter: ";",
      skipEmptyLines: true,
      // dynamicTyping: true,
      complete: complete,
      error: error});
  });
};

function filterEmpty(data) {
  return data.filter((el, idx) => {
    var empty = el.every(k => k.toString().trim() == '');
    if (empty) {
      console.log(`Empty line ${idx}`);
    }
    return !empty;
  });
}

function splitAndGetUnique(data, field) {
  var unique = new Set();
  var errors = [];
  data.forEach((el, idx) => {
    if (el[field].trim() != '') {
      el[field] = el[field].split(',').reduce((acc, val) => {
        val = val.trim();
        if (val == '') {
          errors.push(idx + 1);
        } else {
          unique.add(val);
          acc.push(val);
        }
        return acc;
      }, []).sort();
    } else {
      el[field] = [];
    }
  });
  console.log(`Unique "${field}" types: ${Array.from(unique).join(', ')}`);
  if (errors.length > 0) {
    console.log(`Lines with inaccurate ${field} field: ${errors.length}, line indices: ${errors.join(', ')}`);
  }
};

function printErrors(errors, type) {
  if (errors.length > 0) {
    console.log(`Lines with incorrect ${type}: ${errors.length}`);
    console.log(errors);
  }
}

function loadCSV(price_name) {
  Papa.parsePromise(price_name)
    .then(function(result) {

      // lines to objects
      var errors = [];
      var HEADER = 'type;n;lat;lon;address;services;fuel;region;dt;ai80;ai92;ai95;ai98;sg'.split(';');
      data = filterEmpty(result.data)
        .reduce((acc, val) => {
        if (val.length == HEADER.length) {
          acc.push(val.reduce((a, v, i) => {
            a[HEADER[i]] = v;
            return a;
          }, {}));
          return acc;
        } else {
          errors.push(val);
        }
      }, []);
      printErrors(errors, 'data');

      // fuel to list
      splitAndGetUnique(data, 'fuel');
      // services to list
      splitAndGetUnique(data, 'services');

      // coordinates to number
      var errors = [];
      data = data.reduce((acc, val) => {
        lat = parseFloat(val.lat.replace(',', '.'));
        lon = parseFloat(val.lon.replace(',', '.'));
        if (isFinite(lat) && isFinite(lon)) {
          val.lat = lat;
          val.lon = lon;
          acc.push(val);
          return acc;
        } else {
          errors.push(val);
        }
      }, []);
      printErrors(errors, 'coordinates');

      // prices to number
      var errors = [];
      var fuel = 'dt;ai80;ai92;ai95;ai98;sg'.split(';');
      data = data.map(el => {
        var price = [];
        var price_fuel = [];
        for (key in el) {
          if (!fuel.includes(key)) { continue; }
          var val = el[key];
          if (val == '')  { 
            delete el[key];
            continue;
          }
          val = parseFloat(val.replace(',', '.'));
          if (isFinite(val)) {
            price.push([key, val]);
            price_fuel.push(key);
            delete el[key];
          }
        }
        price_fuel.sort();
        var is_same = (price_fuel.length == el.fuel.length) && price_fuel.every(function(element, index) {
            return element === el.fuel[index];
        });
        if (!is_same) {
          errors.push(el);
        }
        el.price = price;
        el.price_fuel = price_fuel;
        return el;
      });
      printErrors(errors, 'fuel types');

      console.log(data);

      csv = data;

      setMode(true);
      getVisible(true);
    });
};
