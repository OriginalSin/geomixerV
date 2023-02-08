L.Map.addInitHook(function() {
    var map = this,
        hideControl = null,
        hiddenClass = 'leaflet-control-gmx-hidden',
		// defaultSvgSprites = ['http://www.kosmosnimki.ru/lib/geomixer/img/svg-symbols.svg'],
		defaultSvgSprites = ['img/svg-symbols.svg'],
        DEFAULT = ['gmxLoaderStatus', 'gmxHide', 'gmxZoom', 'gmxDrawing', 'gmxBottom', 'gmxLocation', 'gmxCopyright', 'gmxCenter', 'gmxLogo'];

    this.gmxControlsManager = {
        _controls: {},
        _svgLoaded: {},
        add: function(control) {
            var opt = control.options,
                id = opt.id;
            this._controls[id] = control;
            if (control instanceof L.Control.GmxHide) {
                hideControl = control;
            }
            if (hideControl && !hideControl.options.isActive
                && !opt.notHide && !control._parent
                && control._container
              ) {
                L.DomUtil.addClass(control._container, hiddenClass);
            }
			map.fire('gmxcontroladd', {id: id, control: control});
            return this;
        },
        remove: function(control) {
            delete this._controls[control.options.id];
			map.fire('gmxcontrolremove', {id: control.options.id, control: control});
            return this;
        },
        get: function(id) {
            return this._controls[id];
        },
        getAll: function() {
            return this._controls;
        },
        init: function(options) {
            options = options || {};
            if (map.options.svgSprite !== false) {
				this.setSvgSprites(map.options.svgSprite);
            }
            if (map.zoomControl && !options.zoomControl) {
                map.removeControl(map.zoomControl);
            }
            if (map.attributionControl && !options.attributionControl) {
                map.removeControl(map.attributionControl);
            }
			DEFAULT.forEach(function(key) {
                if (!(key in options) || options[key] !== null) {
                    map.addControl(L.control[key](options[key]));
                }
			});
            return this;
        },
        setSvgSprites: function(arr) {
			arr = arr && arr !== true ? (L.Util.isArray(arr) ? arr : [arr]) : defaultSvgSprites;
			var _this = this;
			arr.forEach(function(url) {
				if (!_this._svgLoaded[url]) {
					_this._svgLoaded[url] = true;
					fetch(url, {mode: 'cors'}).then(function(resp) {
						return resp.text();
					}).then(function(txt) {
						var div = document.createElement('div');
						div.style.display = 'none';
						document.body.appendChild(div);
						setTimeout(function() { div.innerHTML = txt; }, 200);
						map.fire('svgspriteloaded', {url: url});
					});
				}
			});
			map.options.svgSprite = arr;
            return this;
        }
    };
    this.gmxControlIconManager = this.gmxControlsManager;

	var st = '/geomixer-src.js';
	if (!map.options.svgSprite) {
		var arr = document.head.querySelectorAll('script[src*="' + st + '"]');
		if (arr.length < 1) {
			st = '/geomixer.js';
			arr = document.head.querySelectorAll('script[src*="' + st + '"]');
		}
		if (arr.length === 1) {
			var pref = arr[0].src;
			pref = pref.substring(0, pref.indexOf(st));
			map.gmxControlsManager.setSvgSprites(pref + '/img/svg-symbols.svg');
		}
	}
});
