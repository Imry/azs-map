//  function Clusterer(map) {
//     this._clusterer = null;
//     this._objects = [];
//     this._map = null;

//     this.setMap(map);
// }

class Clusterer {
    constructor(map) {
        this._clusterer = null;
        this._objects = [];
        this._map = null;

        this.setMap(map);
    }

    setMap (map) {
        if(map == this._map) {
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
        // this._clusterer.options.set({
        //     clusterDisableClickZoom: true
        // });

    }

    show(data, zoom = false) {
        function getPointData(address, n, services, fuel, lat, lon) {
            return {
                balloonContentHeader: '<font size=3><b><a target="_blank" href="https://yandex.ru">Здесь может быть ссылка на инфу</a></b></font>',
                balloonContentBody: '<p>Адрес: ' + address + '</p><p>Сервисы: ' + services + '</p><p>Тип толпива: ' + fuel + '</p><p>Широта: ' + lat + ', Долгота: ' + lon
                 + '<p><button type="button" class="btn" onclick=route_to(' + lat + ',' + lon + ')>Маршрут</button></p>',
                balloonContentFooter: '<font size=1>Информация предоставлена: ...',
                clusterCaption: 'Заправка <strong>' + n + '</strong>'
            };
        };

        this._clusterer.removeAll();
        var obj = [];
        for(var i = 0, len = data.length; i < len; i++) {
            var item = data[i];
            obj[i] = new ymaps.GeoObject({
                geometry: {
                    type: "Point",
                    coordinates: [item["lat"], item["lon"]],
                },
                properties: getPointData(
                    item["address"],
                    item["n"],
                    item["services"],
                    item["fuel"],
                    item["lat"],
                    item["lon"])
            },
            // {
            //     iconLayout: 'default#image',
            //     iconImageHref: 'icon.png',
            //     iconImageSize: [20, 40],
            //     iconImageOffset: [-10, -20]
            // }
            )
        }
        this._clusterer.add(obj);
        if (zoom) {
            this._map.setBounds(this._clusterer.getBounds(), {
                checkZoomRange: true
            });
        }
        this._map.geoObjects.add(this._clusterer);
        // console.log(this._map.geoObjects.getBounds());
        // console.log(this._clusterer.getBounds());
        // this._map.setBounds(this._map.geoObjects.getBounds());
    }

    clear() { this._clusterer.removeAll();}
};
