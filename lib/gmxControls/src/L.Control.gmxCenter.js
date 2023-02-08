L.Control.GmxCenter = L.Control.extend({
    options: {
        position: 'center',
        id: 'center',
        notHide: true,
        color: '#216b9c'
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        map.fire('controlremove', this);
    },

    onAdd: function (map) {
        var className = 'leaflet-gmx-center',
			svgNS = 'http://www.w3.org/2000/svg',
            container = L.DomUtil.create('div', className),
            div = L.DomUtil.create('div', className),
            svg = document.createElementNS(svgNS, 'svg'),
            g = document.createElementNS(svgNS, 'g'),
            path = document.createElementNS(svgNS, 'path');

        this._container = container;
        container._id = this.options.id;
        if (this.options.notHide) { container._notHide = true; }

		path.setAttribute('stroke-width', 1);
		path.setAttribute('stroke-opacity', 1);
		path.setAttribute('d', 'M6 0L6 12M0 6L12 6');
        this._path = path;
		g.appendChild(path);
		svg.appendChild(g);
        svg.setAttribute('width', 12);
        svg.setAttribute('height', 12);
        div.appendChild(svg);
        container.appendChild(div);

        this.setColor(this.options.color);
        map.fire('controladd', this);
        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        return container;
    },

    setColor: function (color) {
        this.options.color = color;
        if (this._map) { this._path.setAttribute('stroke', color); }
        return this;
    }
});

L.Control.gmxCenter = L.Control.GmxCenter;
L.control.gmxCenter = function (options) {
  return new L.Control.GmxCenter(options);
};
