L.Control.GmxLoaderStatus = L.Control.extend({
    options: {
        id: 'loaderStatus',
        position: 'topleft',
        type: 'gif' // 'gif' 'font'
    },
    _items: {},
    _text: 'Loader status',

    addItem: function (id, type) {
        var itemId = id || L.gmxUtil.newId(),
            item = this._items[itemId],
            className = this.options.type === 'gif' ? 'icon-refresh-gif' : 'animate-spin icon-refresh';
        className += (type ? ' leaflet-gmx-loaderStatus-' + type : '');

        this._div.className = className;
        L.DomUtil.removeClass(this._container, 'leaflet-gmx-visibility-hidden');
        if (item) {
            item++;
        } else {
            this._items[itemId] = 1;
        }
		this._container.title = this._text + ': ' + Object.keys(this._items).length;

        return itemId;
    },

    removeItem: function (id) {
        var item = this._items[id];
        if (item > 1) {
            this._items[id]--;
        } else {
            delete this._items[id];
        }
        if (Object.keys(this._items).length === 0) {
            if (this.options.type !== 'gif') { L.DomUtil.removeClass(this._div, 'animate-spin'); }
            L.DomUtil.addClass(this._container, 'leaflet-gmx-visibility-hidden');
        }
		this._container.title = this._text + ': ' + Object.keys(this._items).length;
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        map.fire('controlremove', this);
        delete L.gmx.loaderStatus;
    },

    onAdd: function (map) {
        var options = this.options,
            className = 'leaflet-gmx-visibility-hidden leaflet-gmx-' + options.id,
            container = L.DomUtil.create('div', className),
            div = L.DomUtil.create('div', options.type === 'gif' ? 'icon-refresh-gif' : 'animate-spin icon-refresh', container),
            txt = 'Loader status';

        if (L.gmxLocale) {
            txt = L.gmxLocale.addText({
                'eng': {hide: txt},
                'rus': {hide: 'Статус загрузки'}
            }).getText('hide');
        }

        container._id = this.options.id;
        container.title = this._text = txt;

        this._container = container;
        this._div = div;
        this._items = {};

        map.fire('controladd', this);
        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        var _this = this;
        if (!L.gmxUtil) { L.gmxUtil = {}; }
        L.gmxUtil.loaderStatus = function(id, removeFlag, type) {
            return _this[removeFlag ? 'removeItem' : 'addItem'].apply(_this, [id, type]);
        };
		L.DomEvent
			.on(container, 'click', L.DomEvent.stopPropagation)
			.on(container, 'click', function() {
				var arr = Object.keys(this._items);
				console.info('Запросов в очереди на загрузку:', arr);
			}, this);
        return container;
    }
});

L.Control.gmxLoaderStatus = L.Control.GmxLoaderStatus;
L.control.gmxLoaderStatus = function (options) {
  return new L.Control.GmxLoaderStatus(options);
};
