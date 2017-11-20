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

function loadCSV(map, price) {
  Promise.all([Papa.parsePromise(map), Papa.parsePromise(price)])
    .then(function(allData) {
      // All data available here in the order it was called.
      var data = allData[0].data;
      var price = allData[1].data;
      var result = data.reduce(function(acc, el) {
        p = price.filter(function(it) {
          return el.n == it.n;
        });
        if (p.length > 0) {
          el.services = el.services.split(',').map(function(s) {
            s = s.trim();
            if (s != 'shower') {
              return s.trim();
            }
          });
          el.price = [];
          el.fuel = [];
           for (key in p[0]) {
            if (!['type', 'lat', 'lon', 'address', 'n', 'fuel', 'region', 'dtW'].includes(key) && p[0][key] != '') {
              el.price.push([key, p[0][key]]);
              el.fuel.push(key);
            }
          }
          acc.push(el);
          return acc;
        }
      }, []);
      csv = result;
      setMode(true);
      getVisible(true);
    });
};
