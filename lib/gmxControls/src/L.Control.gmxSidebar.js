L.Control.GmxSidebar = L.Control.extend({
    options: {
        id: 'defaultSidebar',
        position: 'right'
    },
    onAdd: function(map) {
        var container = document.createElement('div');
        this._container = container;
        container._id = this.options.id;
        container.className = 'leaflet-gmx-sidebar';
        if (typeof this.options.width === 'number') {
            container.setAttribute('style', 'width: ' + this.options.width + 'px');
        }
        if (typeof this.options.className === 'string') {
            L.DomUtil.addClass(container, this.options.className);
        }
        L.DomEvent
            .on(container, 'mousemove', L.DomEvent.stopPropagation)
            .on(container, 'dblclick', L.DomEvent.stopPropagation);

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
    },
    expand: function() {
        L.DomUtil.addClass(this._container, 'leaflet-gmx-sidebar_expanded');
    },
    collapse: function() {
        L.DomUtil.removeClass(this._container, 'leaflet-gmx-sidebar_expanded');
    },
    isExpanded: function() {
        return L.DomUtil.hasClass(this._container, 'leaflet-gmx-sidebar_expanded');
    },
    getContentContainer: function() {
        return this.getContainer();
    },
    setWidth: function(w) {
        if (typeof w === 'number') {
            this._container.setAttribute('style', 'width: ' + w + 'px');
        }
    }
});

L.Control.gmxSidebar = L.Control.GmxSidebar;
L.control.gmxSidebar = function(options) {
    return new L.Control.GmxSidebar(options);
};
