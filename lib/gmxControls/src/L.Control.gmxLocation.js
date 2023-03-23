import Location from './Location.svelte'

const _location = (container, props) => {
	return new Location({ target: container, props });
};

const _localeJson = {
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

const _gtxt = function (key) {
    let res = '';
    if (L.gmxLocale) { res = L.gmxLocale.getText(key); }
    else {
        const arr = key.split('.');
        res = _localeJson.eng.gmxLocation[arr[arr.length - 1]]
    }
    return res || '';
};
let _options = {
	position: 'gmxbottomright',
	id: 'location',
	gmxPopup: 'internal',
	notHide: true,
	coordinatesFormat: 0,
	scaleFormat: 'bar'  // or text
};

L.Control.GmxLocation = L.Control.extend({
    includes: L.Evented.prototype,
	initialize(options) {
        this.options = {..._options, ...options};
        if (L.gmxLocale) L.gmxLocale.addText(_localeJson);
	},

    setOptions: function (opt) {
        this.options = {...this.options, ...opt};
		if (this._map) this._app.$set(this.options);
    },

    setScaleFormat: function (type) {
        this.setOptions({scaleFormat: type === 'bar' ? 'bar' : 'text'});
    },

    onAdd: function (map) {
        let container = L.DomUtil.create('div', 'leaflet-gmx-location');

		this._app = _location(container, { options: this.options });
        map.fire('controladd', this);
        if (map.gmxControlsManager) map.gmxControlsManager.add(this);
		
        return container;
    },
    onRemove: function (map) {
        if (map.gmxControlsManager) map.gmxControlsManager.remove(this);
        map.fire('controlremove', this);
    }
});


L.Control.gmxLocation = L.Control.GmxLocation;
L.control.gmxLocation = function (options) {
  return new L.Control.GmxLocation(options);
};
// })();
