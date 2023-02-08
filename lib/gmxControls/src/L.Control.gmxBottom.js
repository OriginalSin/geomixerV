L.Control.GmxBottom = L.Control.extend({
    options: {
        position: 'bottom',
        notHide: true,
        id: 'bottom'
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        map.fire('controlremove', this);
        var corners = map._controlCorners;
        ['bottomleft', 'bottomright', 'right', 'left'].map(function (it) {
            if (corners[it]) {
                L.DomUtil.removeClass(corners[it], 'gmx-bottom-shift');
            }
        });
    },

    onAdd: function (map) {
        var className = 'leaflet-gmx-copyright-location',
            container = L.DomUtil.create('div', className);

        this._container = container;
        container._id = this.options.id;
        if (this.options.notHide) { container._notHide = true; }
        L.DomEvent
            .on(container, 'mousemove', L.DomEvent.stopPropagation)
            .on(this._map._controlContainer, 'dblclick', L.DomEvent.stopPropagation);
        L.DomUtil.create('div', className + '-bg', container);
        map.fire('controladd', this);

        var corners = map._controlCorners;
        ['bottomleft', 'bottomright', 'right', 'left'].map(function (it) {
            if (corners[it]) {
                L.DomUtil.addClass(corners[it], 'gmx-bottom-shift');
            }
        });
        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        return container;
    }
});

L.Control.gmxBottom = L.Control.GmxBottom;
L.control.gmxBottom = function (options) {
  return new L.Control.GmxBottom(options);
};
