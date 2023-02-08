L.Control.GmxLogo = L.Control.extend({
    options: {
        position: 'gmxbottomcenter',
        notHide: true,
        id: 'logo'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('a', '');
        this._container = container;
        if (this.options.notHide) { container._notHide = true; }
        container.id = this.options.id;
        var url = '//scanex.ru/' + (L.gmxLocale && L.gmxLocale.getLanguage() === 'rus' ? '' : 'en/');

        container.setAttribute('href', url);
        container.setAttribute('target', '_blank');

        this._logoPrefix = 'leaflet-gmx-logo' + (this.options.type ? '-' + this.options.type : '');
        var shiftClass = this._logoPrefix + '-shift';
        this._shift = false;
        this._updatePosition = function (ev) {
            if (container.parentNode) {
                var shift = (container.clientWidth - container.parentNode.clientWidth) / 2 + ev.locationSize > 0 ? true : false;
                if (this._shift !== shift) {
                    this._shift = shift;
                    if (shift) {
                        L.DomUtil.addClass(container, shiftClass);
                    } else {
                        L.DomUtil.removeClass(container, shiftClass);
                    }
                }
            }
        };
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
        map.off('onChangeLocationSize', this._updatePosition, this);
    },

    addTo: function (map) {
        L.Control.prototype.addTo.call(this, map);
        L.DomUtil.addClass(this._container, this._logoPrefix);
        map.on('onChangeLocationSize', this._updatePosition, this);
        return this;
    }
});

L.Control.gmxLogo = L.Control.GmxLogo;
L.control.gmxLogo = function (options) {
  return new L.Control.GmxLogo(options);
};

L.Map.addInitHook(function () {
    if (!this._controlCorners.bottom) {
        this._controlCorners.bottom = L.DomUtil.create(
            'div',
            'leaflet-bottom leaflet-left leaflet-right',
            this._controlContainer
        );
    }
});
