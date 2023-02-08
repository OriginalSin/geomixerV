(function () {

var _gtxt = function (key) {
    var res = L.gmxLocale ? L.gmxLocale.getText(key) : null;
    return res || '';
};

L.Control.GmxCopyright = L.Control.extend({
    options: {
        position: 'gmxbottomleft',
        type: 'window', // 'window' or 'line'
        closeButton: false,
        notHide: true,
		cursorPosition: false,
        mapCopyright: '',
        scanexCopyright: '© ООО ИТЦ "СКАНЭКС"',
        // scanexCopyright: '<a target="_blank" href="http://kosmosnimki.ru/terms.html">&copy; 2007-' + (new Date().getUTCFullYear()) + ' RDC ScanEx</a> - Terms of Service',
        leafletCopyright: '<a target="_blank" href="http://leafletjs.com">&copy; Leaflet</a>',
        id: 'copyright'
    },

    onAdd: function (map) {
        if (L.gmxLocale) {
            L.gmxLocale.addText({
                eng: {
                    gmxCopyright: {
                        showHide: 'Show/Hide copyrights'
                    }
                },
                rus: {
                    gmxCopyright: {
                        showHide: 'Показать/Скрыть копирайты'
                    }
                }
            });
        }
        this._currentText = '';

        this._container = L.DomUtil.create('span', 'leaflet-gmx-copyright');
        if (this.options.notHide) { this._container._notHide = true; }
        this._container._id = this.options.id;

        this._window = L.DomUtil.create('div', 'leaflet-gmx-copyright-window', this._container);
		if (this.options.closeButton) {
			var closeButton = L.DomUtil.create('div', 'closeButton', this._window);
			closeButton.innerHTML = '&#215;';
			L.DomEvent.on(closeButton, 'click', this.toggleWindow, this);
		}

		this._windowContent = L.DomUtil.create('div', 'windowContent', this._window);
		// L.DomEvent.on(this._window, 'contextmenu', L.DomEvent.fakeStop || L.DomEvent._fakeStop);

        this._copyrights = L.DomUtil.create('span', 'leaflet-gmx-copyrights', this._container);

        if (this.options.cursorPosition) {
			var utils = L.gmxUtil || (L.Control.GmxLocation ? L.Control.GmxLocation.Utils : null),
				gmxLocation = map.gmxControlsManager.get('location') || null;

			if (utils) {
				var cursorPositionContainer = L.DomUtil.create('span', 'leaflet-gmx-cursorposition', this._container);
				this.lastLatLng = L.latLng(0, 0);
				this.cursorPosition = function (ev) {
					if (!map._animatingZoom) {
						var latlng = ev.latlng,
							mouseDown = L.Browser.webkit ? ev.originalEvent.which : ev.originalEvent.buttons;
						if (!mouseDown && !latlng.equals(this.lastLatLng)) {
							this.lastLatLng = latlng;
							cursorPositionContainer.innerHTML = utils.getCoordinatesString(latlng, gmxLocation ? gmxLocation.getCoordinatesFormat() : 0);
						}
					}
				};
				map.on('mousemove', this.cursorPosition, this);
			}
		}
        this.setFormat = function (type) {
            if (type === 'window') {
                this._copyrights.title = _gtxt('gmxCopyright.showHide');
                this._copyrights.innerHTML = '© Copyrights';
                this._container.style.width = 'auto';
            } else {
                this._copyrights.title = '';
            }
            this.options.type = type;
            this.toggleWindow();
            this._window.style.display = 'none';
        };

        this.setFormat(this.options.type);
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(this._window, 'dblclick', stop)
            .on(this._window, 'click', stop)
            .on(this._container, 'mousemove', stop)
            .on(this._copyrights, 'dblclick', stop)
            .on(this._copyrights, 'click', stop)
            .on(this._copyrights, 'click', this.toggleWindow, this);
        map
            .on('click', this.closeWindow, this)
            .on('onChangeLocationSize', this._chkWidth, this)
            .on('moveend', this._redraw, this)
            .on('layeradd', this._redraw, this)
            .on('layerremove', this._redraw, this);
        this._redraw();
        map.fire('controladd', this);
        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        return this._container;
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        map.fire('controlremove', this);
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .off(this._window, 'dblclick', stop)
            .off(this._window, 'click', stop)
            .off(this._container, 'mousemove', stop)
            .off(this._copyrights, 'dblclick', stop)
            .off(this._copyrights, 'click', stop)
            .off(this._copyrights, 'click', this.toggleWindow, this);
        map
            .off('click', this.closeWindow, this)
            .off('onChangeLocationSize', this._chkWidth, this)
            .off('moveend', this._redraw, this)
            .off('layeradd', this._redraw, this)
            .off('layerremove', this._redraw, this);

        if (this.cursorPosition) {
			map.off('mousemove', this.cursorPosition, this);
		}
    },

    toggleWindow: function() {
		this.setWindowVisible(this._window.style.display === 'none' ? true : false);
    },

    closeWindow: function() {
		this.setWindowVisible(false);
    },

    setWindowVisible: function(flag) {
		if (this.options.type === 'window') {
			var style = this._window.style;
			style.display = flag ? 'block' : 'none';
			this._currentText = '';
			this._redraw();
		}
    },

    _chkWidth: function(ev) {
        if (this.options.type !== 'window') {
            var width = this._map._size.x - ev.locationSize - 25;
            this._container.style.width = (width > 0 ? width : 0) + 'px';
        }
    },

    setMapCopyright: function(copyright) {
        this.options.mapCopyright = copyright || '';
        this._redraw();
    },

    _redrawItems: function() {
        var prefix = '<a target="_blank"',
            texts = [],
            _layers = this._map._layers,
            _zoom = this._map._zoom,
            _bounds = this._map.getBounds(),
            arr = [],
            chkExists = {};

        if (this.options.scanexCopyright) { texts.push(this.options.scanexCopyright); }
        if (this.options.mapCopyright) { texts.push(this.options.mapCopyright); }
        for (var id in _layers) {
            if (_layers[id].options) { arr.push(_layers[id].options); }
        }
        arr = arr.sort(function(a, b) { return a.zIndex - b.zIndex; });

        arr.forEach(function(item) {
            var attribution = item.attribution;
            if (attribution && !chkExists[attribution]) {
                chkExists[attribution] = true;
                texts.push(attribution.split('<a').join(prefix));
            }

            if (item.gmxCopyright) {
                item.gmxCopyright.forEach(function(item1) {
                    var copyright = item1.attribution;
                    if (chkExists[copyright] || _zoom < item1.minZoom || _zoom > item1.maxZoom) { return; }
                    if (item1.bounds) {
                        if (!(item1.bounds instanceof L.LatLngBounds)) {
                            item1.bounds = L.latLngBounds(item1.bounds);
                        }
                        if (!_bounds.intersects(item1.bounds)) { return; }
                    }
                    chkExists[copyright] = true;
                    texts.push(copyright.split('<a').join(prefix));
                });
            }
        });
        if (this.options.leafletCopyright) { texts.push(this.options.leafletCopyright); }

        var text = texts.join(' ');

        if (this._currentText !== text) {
            this._currentText = text;
            if (this.options.type === 'window') {
                this._windowContent.innerHTML = texts.join('<br>');
            } else {
                this._copyrights.innerHTML = text;
            }

        }
    },

    _redraw: function () {
        if (!this._map._animatingZoom) {
			if (this._redrawTimer) { cancelIdleCallback(this._redrawTimer); }
			this._redrawTimer = requestIdleCallback(function () {
				if (this._map && this._map._mapPane) { this._redrawItems(); }
			}.bind(this), {timeout: 250});
		}
        // var my = this;
			// if (this._redrawTimer) { clearTimeout(this._redrawTimer); }
			// this._redrawTimer = setTimeout(function() {
				// my._redrawTimer = null;
				// if (my._map) { my._redrawItems(); }
			// }, 100);
		// }
    }
});

L.Control.gmxCopyright = L.Control.GmxCopyright;
L.control.gmxCopyright = function (options) {
  return new L.Control.GmxCopyright(options);
};
})();
