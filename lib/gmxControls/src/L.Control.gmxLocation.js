(function () {
var _localeJson = {
    eng: {
        gmxLocation: {
            locationChange: 'Сhange the map center:',
            locationTxt: 'Current center coordinates',
            coordFormatChange: 'Toggle coordinates format',
            scaleBarChange: 'Toggle scale bar format'
        }
    },
    rus: {
        gmxLocation: {
            locationChange: 'Переместить центр карты:',
            locationTxt: 'Текущие координаты центра карты',
            coordFormatChange: 'Сменить формат координат',
            scaleBarChange: 'Сменить формат масштаба'
        }
    }
};

var _gtxt = function (key) {
    var res = '';
    if (L.gmxLocale) { res = L.gmxLocale.getText(key); }
    else {
        var arr = key.split('.');
        res = _localeJson.eng.gmxLocation[arr[arr.length - 1]]
    }
    return res || '';
};
var _mzoom = [
    'M 1:500 000 000',  //  0   156543.03392804
    'M 1:300 000 000',  //  1   78271.51696402
    'M 1:150 000 000',  //  2   39135.75848201
    'M 1:80 000 000',   //  3   19567.879241005
    'M 1:40 000 000',   //  4   9783.9396205025
    'M 1:20 000 000',   //  5   4891.96981025125
    'M 1:10 000 000',   //  6   2445.98490512563
    'M 1:5 000 000',    //  7   1222.99245256281
    'M 1:2500 000',     //  8   611.496226281406
    'M 1:1 000 000',    //  9   305.748113140703
    'M 1:500 000',      //  10  152.874056570352
    'M 1:300 000',      //  11  76.437028285176
    'M 1:150 000',      //  12  38.218514142588
    'M 1:80 000',       //  13  19.109257071294
    'M 1:40 000',       //  14  9.554628535647
    'M 1:20 000',       //  15  4.777314267823
    'M 1:10 000',       //  16  2.388657133912
    'M 1:5 000',        //  17  1.194328566956
    'M 1:2 500',        //  18  0.597164283478
    'M 1:1 250',        //  19  0.298582141739
    'M 1:625'           //  20  0.149291070869
];
var coordFormats = [
    '',
    '',
    ' (EPSG:3395)',
    ' (EPSG:3857)'
];
L.Control.GmxLocation = L.Control.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    options: {
        position: 'gmxbottomright',
        id: 'location',
        gmxPopup: 'internal',
        notHide: true,
        coordinatesFormat: 0,
        scaleFormat: 'bar'  // or text
    },

    setScaleFormat: function (type) {
        this.options.scaleFormat = type === 'bar' ? 'bar' : 'text';
        this.scaleBar.style.visibility = type === 'bar' ? 'visible' : 'hidden';
        this._checkPositionChanged();
    },

    onAdd: function (map) {
        var className = 'leaflet-gmx-location',
            container = L.DomUtil.create('div', className),
            utils = L.Control.GmxLocation.Utils,
            my = this;

        this._container = container;
        container._id = this.options.id;
        if (this.options.notHide) {
            container._notHide = true;
        }
        if (L.gmxLocale) {
            L.gmxLocale.addText(_localeJson);
        }
        this.prevCoordinates = '';

		var corner = map._controlCorners[this.options.position];
		if (corner) {
			this._window = L.DomUtil.create('div', 'leaflet-gmx-location-window', container);
			this._window.style.display = 'none';
			var closeButton = L.DomUtil.create('div', 'closeButton', this._window);
			closeButton.innerHTML = '&#215;';
			L.DomEvent.disableClickPropagation(this._window);

			L.DomEvent.on(closeButton, 'click', function () {
				var style = my._window.style;
				style.display = style.display === 'none' ? 'block' : 'none';
			}, this);
			map.on('click', function () {
				my._window.style.display = 'none';
			}, this);
			this._windowContent = L.DomUtil.create('div', 'windowContent', this._window);
		}

        this.locationTxt = L.DomUtil.create('span', 'leaflet-gmx-locationTxt', container);
        this.locationTxt.title = _gtxt('gmxLocation.locationTxt');
        this.coordFormatChange = L.DomUtil.create('span', 'leaflet-gmx-coordFormatChange', container);
        this.coordFormatChange.title = _gtxt('gmxLocation.coordFormatChange');
        this.scaleBar = L.DomUtil.create('span', 'leaflet-gmx-scaleBar', container);
        this.scaleBarTxt = L.DomUtil.create('span', 'leaflet-gmx-scaleBarTxt', container);
        this.scaleBarTxt.title = this.scaleBar.title = _gtxt('gmxLocation.scaleBarChange');
        this._map = map;

        var util = {
            coordFormat: this.options.coordinatesFormat || 0,
            len: coordFormats.length,
            setCoordinatesFormat: function(num) {
                num = num || this.coordFormat || 0;
                if (num < 0) {
                    num = util.len - 1;
                } else if (num >= util.len) {
                    num = 0;
                }
                this.coordFormat = num;
                var res = utils.getCoordinatesString(my._map.getCenter(), this.coordFormat);
                if (res && my.prevCoordinates !== res) { my.locationTxt.innerHTML = res; }
                my.prevCoordinates = res;
                if (this._redrawTimer) { clearTimeout(this._redrawTimer); }
                this._redrawTimer = setTimeout(function() {
                    if (my._map) { my._map.fire('onChangeLocationSize', {locationSize: container.clientWidth}); }
                }, 100);
                my.fire('coordinatesformatchange', {coordinatesFormat: this.coordFormat});
            },
            goTo: function(value) {
				var coord = L.Control.gmxLocation.Utils.parseCoordinates(value);
				my._map.panTo(coord);
            },
            showCoordinates: function(ev) {        //окошко с координатами
                var oldText = utils.getCoordinatesString(my._map.getCenter(), this.coordFormat);
                if (my.options.onCoordinatesClick) {
                    my.options.onCoordinatesClick(oldText, ev);
                } else if (L.control.gmxPopup) {
                    var div = L.DomUtil.create('div', 'gmxLocation-popup'),
                        span = L.DomUtil.create('div', '', div),
                        input = L.DomUtil.create('input', 'gmxLocation-input', div),
                        button = L.DomUtil.create('button', '', div);

                    button.innerHTML = 'Ok';
                    L.DomEvent.on(button, 'click', function () {
                        util.goTo(input.value);
                    });
                    span.innerHTML = _gtxt('gmxLocation.locationChange');
                    input.value = oldText;
                    L.DomEvent.on(input, 'keydown', function (ev) {
                        if (ev.which === 13) { util.goTo(this.value); }
                    });
					if (my.options.gmxPopup === 'internal' && my._window) {
						my._windowContent.innerHTML = '';
						my._windowContent.appendChild(div);
						var style = my._window.style;
						style.display = style.display === 'none' ? 'block' : 'none';
                    } else {
						var opt = {};
						if (my.options.gmxPopup === 'tip') {
							var pos = my._map.mouseEventToContainerPoint(ev);
							opt = {
								tip: true,
								anchor: new L.Point(pos.x, pos.y - 5)
							};
						}
						L.control.gmxPopup(opt).setContent(div).openOn(my._map);
					}
                } else {
                    //if (this.coordFormat > 2) { return; } // только для стандартных форматов.
                    var text = window.prompt(my.locationTxt.title + ':', oldText);
                    if (text && text !== oldText) {
                        var point = utils.parseCoordinates(text);
                        if (point) { my._map.panTo(point); }
                    }
                }
            },
            nextCoordinatesFormat: function() {
                this.coordFormat += 1;
                this.setCoordinatesFormat(this.coordFormat || 0);
            }
        };
        this.getCoordinatesFormat = function() {
			return util.coordFormat;
		};

        this._checkPositionChanged = function () {
            var z = map.getZoom();

            if (z && !map._animatingZoom) {
                var attr = {txt: _mzoom[z], width: 0};
                if (this.options.scaleFormat === 'bar') {
                    attr = utils.getScaleBarDistance(z, map.getCenter());
                }

                if (!attr || (attr.txt === my._scaleBarText && attr.width === my._scaleBarWidth)) { return; }
                my._scaleBarText = attr.txt;
                my._scaleBarWidth = attr.width;
                if (my._scaleBarText) {
                    my.scaleBar.style.width = my._scaleBarWidth + 'px';//, 4);
                    my.scaleBarTxt.innerHTML = my._scaleBarText;
                }

                util.setCoordinatesFormat(util.coordFormat || 0);
            }
        };
        this._setCoordinatesFormat = function () {
            util.setCoordinatesFormat(util.coordFormat || 0);
        };

        this.setCoordinatesFormat = function (nm) {
            if (!map._animatingZoom) {
				if (nm === 0) { util.coordFormat = 0; }
				util.setCoordinatesFormat(nm);
			}
        };

        var toggleScaleFormat = function () {
            this.setScaleFormat(this.options.scaleFormat === 'bar' ? 'text' : 'bar');
        };
        this._toggleHandlers = function (flag) {
            var op = flag ? 'on' : 'off',
                func = L.DomEvent[op],
                stop = L.DomEvent.stopPropagation;

            func(container, 'mousemove', stop);
            func(this.coordFormatChange, 'click', stop);
            func(this.coordFormatChange, 'click', util.nextCoordinatesFormat, util);
            func(this.locationTxt, 'click', stop);
            func(this.locationTxt, 'click', util.showCoordinates, util);
            func(this.scaleBarTxt, 'click', stop);
            func(this.scaleBarTxt, 'click', toggleScaleFormat, this);
            func(this.scaleBar, 'click', stop);
            func(this.scaleBar, 'click', toggleScaleFormat, this);
            if (!L.Browser.mobile && !L.Browser.ie) {
                func(this.coordFormatChange, 'dblclick', stop);
                func(this.scaleBarTxt, 'dblclick', stop);
                func(this.scaleBar, 'dblclick', stop);
            }

            map[op]('moveend', this._checkPositionChanged, this);
            map[op]('move', this._setCoordinatesFormat, this);
        };
        this._toggleHandlers(true);
        this.setScaleFormat(this.options.scaleFormat);
        this._checkPositionChanged();
        map.fire('controladd', this);
        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        return container;
    },
    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        map.fire('controlremove', this);
        this.prevCoordinates = this._scaleBarText = null;
        this._toggleHandlers(false);
    }
});

var utils = {
    getScaleBarDistance: function(z, pos) {
        var merc = L.Projection.Mercator.project(pos),
            pos1 = L.Projection.Mercator.unproject(new L.Point(merc.x + 40, merc.y + 30)),
            metersPerPixel = Math.pow(2, -z) * 156543.033928041 * this.distVincenty(pos.lng, pos.lat, pos1.lng, pos1.lat) / 50;

        for (var i = 0; i < 30; i++) {
            var distance = [1, 2, 5][i % 3] * Math.pow(10, Math.floor(i / 3)),
                w = Math.floor(distance / metersPerPixel);
            if (w > 50) {
                return {txt: this.prettifyDistance(distance), width: w};
            }
        }
        return null;
    }
};
if (L.gmxUtil) {
    utils.getCoordinatesString = L.gmxUtil.getCoordinatesString;
    utils.prettifyDistance = L.gmxUtil.prettifyDistance;
    utils.formatDegrees = L.gmxUtil.formatDegrees;
    utils.pad2 = L.gmxUtil.pad2;
    utils.trunc = L.gmxUtil.trunc;
    utils.latLonFormatCoordinates = L.gmxUtil.latLonFormatCoordinates;
    utils.latLonFormatCoordinates2 = L.gmxUtil.latLonFormatCoordinates2;
    utils.degRad = L.gmxUtil.degRad;
    utils.distVincenty = L.gmxUtil.distVincenty;
    utils.parseCoordinates = L.gmxUtil.parseCoordinates;
} else {
    utils.prettifyDistance = function(length) {
        var type = '', //map.DistanceUnit
            txt = _gtxt('units.km') || 'km',
            km = ' ' + txt;
        if (type === 'km') {
            return (Math.round(length) / 1000) + km;
        } else if (length < 2000 || type === 'm') {
            txt = _gtxt('units.m') || 'm';
            return Math.round(length) + ' ' + txt;
        } else if (length < 200000) {
            return (Math.round(length / 10) / 100) + km;
        }
        return Math.round(length / 1000) + km;
    };
    utils.formatDegrees = function(angle) {
        angle = Math.round(10000000 * angle) / 10000000 + 0.00000001;
        var a1 = Math.floor(angle),
            a2 = Math.floor(60 * (angle - a1)),
            a3 = this.pad2(3600 * (angle - a1 - a2 / 60)).substring(0, 2);
        return this.pad2(a1) + '°' + this.pad2(a2) + '\'' + a3 + '"';
    };
    utils.pad2 = function(t) {
        return (t < 10) ? ('0' + t) : ('' + t);
    };
    utils.trunc = function(x) {
        return ('' + (Math.round(10000000 * x) / 10000000 + 0.00000001)).substring(0, 9);
    };
    utils.latLonFormatCoordinates = function(x, y) {
        return  this.formatDegrees(Math.abs(y)) + (y > 0 ? ' N, ' : ' S, ') +
            this.formatDegrees(Math.abs(x)) + (x > 0 ? ' E' : ' W');
    };
    utils.latLonFormatCoordinates2 = function(x, y) {
        return  this.trunc(Math.abs(y)) + (y > 0 ? ' N, ' : ' S, ') +
            this.trunc(Math.abs(x)) + (x > 0 ? ' E' : ' W');
    };
    utils.degRad = function(ang) {
        return ang * (Math.PI / 180.0);
    };

    utils.distVincenty =  function(lon1, lat1, lon2, lat2) {
        var p1 = {};
        var p2 = {};

        p1.lon =  this.degRad(lon1);
        p1.lat =  this.degRad(lat1);
        p2.lon =  this.degRad(lon2);
        p2.lat =  this.degRad(lat2);

        var a = 6378137, b = 6356752.3142,  f = 1 / 298.257223563;  // WGS-84 ellipsiod
        var L = p2.lon - p1.lon;
        var U1 = Math.atan((1 - f) * Math.tan(p1.lat));
        var U2 = Math.atan((1 - f) * Math.tan(p2.lat));
        var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
        var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

        var lambda = L, lambdaP = 2 * Math.PI;
        var iterLimit = 20;
        while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
                var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
                var sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
                    (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
                if (sinSigma === 0) { return 0; }
                var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
                var sigma = Math.atan2(sinSigma, cosSigma);
                var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
                var cosSqAlpha = 1 - sinAlpha * sinAlpha;
                var cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
                if (isNaN(cos2SigmaM)) { cos2SigmaM = 0; }
                var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
                lambdaP = lambda;
                lambda = L + (1 - C) * f * sinAlpha *
                    (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
        }
        if (iterLimit === 0) { return NaN; }

        var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
        var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
                B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
        var s = b * A * (sigma - deltaSigma);

        s = s.toFixed(3);
        return s;
    };

    utils.parseCoordinates = function(text) {
        // should understand the following formats:
        // 55.74312, 37.61558
        // 55°44'35" N, 37°36'56" E
        // 4187347, 7472103
        // 4219783, 7407468 (EPSG:3395)
        // 4219783, 7442673 (EPSG:3857)

        var crs = null,
            regex = /\(EPSG:(\d+)\)/g,
            t = regex.exec(text);

        if (t) {
            crs = t[1];
            text = text.replace(regex, '');
        }

        if (text.match(/[йцукенгшщзхъфывапролджэячсмитьбюЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮqrtyuiopadfghjklzxcvbmQRTYUIOPADFGHJKLZXCVBM_:]/)) {
            return null;
        }

        //there should be a separator in the string (exclude strings like "11E11")
        if (text.indexOf(' ') === -1 && text.indexOf(',') === -1) {
            return null;
        }

        if (text.indexOf(' ') !== -1) {
            text = text.replace(/,/g, '.');
        }
        var results = [];
        regex = /(-?\d+(\.\d+)?)([^\d\-]*)/g;
        t = regex.exec(text);
        while (t) {
            results.push(t[1]);
            t = regex.exec(text);
        }
        if (results.length < 2) {
            return null;
        }
        var ii = Math.floor(results.length / 2),
            y = 0,
            mul = 1,
            i;
        for (i = 0; i < ii; i++) {
            y += parseFloat(results[i]) * mul;
            mul /= 60;
        }
        var x = 0;
        mul = 1;
        for (i = ii; i < results.length; i++) {
            x += parseFloat(results[i]) * mul;
            mul /= 60;
        }

        if (Math.max(text.indexOf('N'), text.indexOf('S')) > Math.max(text.indexOf('E'), text.indexOf('W'))) {
            t = x;
            x = y;
            y = t;
        }

        var pos;
        if (crs === '3857') {
            pos = L.Projection.SphericalMercator.unproject(new L.Point(y, x));
            x = pos.lng;
            y = pos.lat;
        }
        if (Math.abs(x) > 180 || Math.abs(y) > 180) {
            pos = L.Projection.Mercator.unproject(new L.Point(y, x));
            x = pos.lng;
            y = pos.lat;
        }

        if (text.indexOf('W') !== -1) {
            x = -x;
        }

        if (text.indexOf('S') !== -1) {
            y = -y;
        }
        return [y, x];
    };

    utils.getCoordinatesString = function(latlng, num) {
        var x = latlng.lng,
            y = latlng.lat,
            formats = coordFormats,
            len = formats.length,
            merc,
            out = '';
        num = num || 0;
        if (x > 180) { x -= 360; }
        if (x < -180) { x += 360; }
        if (num % len === 0) {
            out = utils.latLonFormatCoordinates2(x, y);
        } else if (num % len === 1) {
            out = utils.latLonFormatCoordinates(x, y);
        } else if (num % len === 2) {
            merc = L.Projection.Mercator.project(new L.LatLng(y, x));
            out = '' + Math.round(merc.x) + ', ' + Math.round(merc.y) + formats[2];
        } else {
            merc = L.CRS.EPSG3857.project(new L.LatLng(y, x));
            out = '' + Math.round(merc.x) + ', ' + Math.round(merc.y) + formats[3];
        }
        return out;
    };
}
L.Control.GmxLocation.Utils = utils;

L.Control.gmxLocation = L.Control.GmxLocation;
L.control.gmxLocation = function (options) {
  return new L.Control.GmxLocation(options);
};
})();
