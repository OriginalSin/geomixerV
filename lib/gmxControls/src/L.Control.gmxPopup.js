L.Control.GmxPopup = L.Control.extend({
    options: {
        position: 'center',
        id: 'gmxPopup',
        className: 'gmxControlPopup',
		maxWidth: 520,
		minWidth: 20,
		maxHeight: 400,
        closeOnMapClick: true,
        draggable: true
    },

    onAdd: function (map) {
        this._map = map;
		if (map.gmxControlsManager) {
			var prev = map.gmxControlsManager.get('gmxPopup');
			if (prev) { prev.remove(); }
		}
		if (!this._container) {
			this._initLayout();
		}
		this.update();
		if (this.options.closeOnMapClick) {
			map.once('click', this.remove, this);
		}
		return this._container;
    },

    openOn: function (map) {
        map.addControl(this);
		this.update();
		return this;
    },

    remove: function () {
		if (this._map) {
			this._map.fire('removeControl', this);
			if (L.Control.prototype.remove) {
				L.Control.prototype.remove.call(this);
			} else {
				this._map.removeControl(this);
			}
        }
		return this;
    },

	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	update: function () {
		if (!this._container) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';
		return this;
	},

	_updateContent: function () {
		if (!this._content) { return; }

		if (typeof this._content === 'string') {
			this._contentNode.innerHTML = this._content;
		} else {
			while (this._contentNode.hasChildNodes()) {
				this._contentNode.removeChild(this._contentNode.firstChild);
			}
			this._contentNode.appendChild(this._content);
		}
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		if (this.options.maxWidth) {
			style.maxWidth = this.options.maxWidth + 'px';
		}
		if (this.options.minWidth) {
			style.minWidth = this.options.minWidth + 'px';
		}
		if (this.options.maxHeight) {
			style.maxHeight = this.options.maxHeight + 'px';
		}
		if (this.options.minHeight) {
			style.minHeight = this.options.minHeight + 'px';
		}
		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			// style.height = maxHeight + 'px';
			L.DomUtil.addClass(container, scrolledClass);
		} else {
			L.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var offset = new L.Point(this._container.clientWidth, this._container.clientHeight),
            anchor = this.options.anchor && this.options.anchor._subtract(L.point(10, this._container.clientHeight)) || this._map.getSize()._divideBy(2),
            pos = anchor._subtract(offset._divideBy(2));

        L.DomUtil.setPosition(this._container, pos);
	},

	_initLayout: function () {
		var container = this._container = L.DomUtil.create('div', this.options.className),
			closeButton = L.DomUtil.create('div', 'closeButton', container);

        closeButton.innerHTML = '&#215;';
        L.DomEvent.disableClickPropagation(closeButton);
        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.on(closeButton, 'click', this.remove, this);
        if (this.options.draggable) {
            new L.Draggable(container).enable();
            container.style.cursor = 'move';
        }

		var wrapper = L.DomUtil.create('div', 'content-wrapper', container);
		L.DomEvent.disableClickPropagation(wrapper);

		this._content = this._content || this.options.content;
		this._contentNode = L.DomUtil.create('div', 'content', wrapper);

		L.DomEvent.disableScrollPropagation(this._contentNode);
		L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

        if (this.options.tip) {
            this._tipContainer = L.DomUtil.create('div', 'tip-container', container);
            this._tip = L.DomUtil.create('div', 'tip', this._tipContainer);
        }
	}
});

L.control.gmxPopup = function (options) {
  return new L.Control.GmxPopup(options);
};
