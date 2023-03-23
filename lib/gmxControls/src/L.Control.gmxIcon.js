const _options = {
	position: 'topleft',
	id: 'defaultIcon',
	// svgSprite: true,
	isActive: false
};
L.Control.GmxIcon = L.Control.extend({
    includes: L.Evented.prototype,
	initialize(options) {
        this.options = {..._options, ...options};
	},
    setActive: function (active, skipEvent) {
        var options = this.options,
			container = this._container,
            togglable = options.togglable || options.toggle;
        if (togglable) {
            var prev = options.isActive,
                prefix = this._prefix,
                className = prefix + '-' + options.id;

            options.isActive = active;

            if (this._img) {
                if (active && options.activeImageUrl) { this._img.src = options.activeImageUrl; }
                else if (!active && options.regularImageUrl) { this._img.src = options.regularImageUrl; }
            }
            if (active) {
                L.DomUtil.addClass(container, prefix + '-active');
                L.DomUtil.addClass(container, className + '-active');
                if (container.children.length) {
                    L.DomUtil.addClass(container, prefix + '-externalImage-active');
                }
                if (options.styleActive) this.setStyle(options.styleActive);
            } else {
                L.DomUtil.removeClass(container, prefix + '-active');
                L.DomUtil.removeClass(container, className + '-active');
                if (container.children.length) {
                    L.DomUtil.removeClass(container, prefix + '-externalImage-active');
                }
                if (options.style) this.setStyle(options.style);
            }
			if (options.activeIcon) {
				var use = this._container.getElementsByTagName('use');
				if (use && use.length) {
					var postfix = typeof(options.activeIcon) === 'boolean' ? '-off' : options.activeIcon;
					var re = new RegExp(`${postfix}$`);
					var zn = (use[0].getAttribute('xlink:href') || '').replace(re, '');
					// var zn = (use[0].getAttribute('xlink:href') || '').replace(/-off$/, '');
					if (options.isActive) { zn += postfix; }
					use[0].setAttribute('href', zn);
				}
			}

            if (!skipEvent && prev !== active) { this.fire('statechange'); }
		}
    },

    onAdd: function (map) {
        var options = this.options,
			svgSprite = typeof(options.regularImageUrl) === 'string' || options.text ? false : true,
			prefix = 'leaflet-gmx-icon' + (svgSprite ? 'Svg' : ''),
            className = prefix + '-' + options.id;

// console.log("onAdd", svgSprite, typeof(options.regularImageUrl));
		this._prefix = prefix;
        var container = L.DomUtil.create('div', prefix + ' ' + className);
        container._id = options.id;

        this._container = container;
        if (options.title) container.title = options.title;
        this.setStyle = function (style) {
            for (var key in style) container.style[key] = style[key];
        };
        if (options.className) {
            L.DomUtil.addClass(container, options.className);
        }
        if (options.regularImageUrl) {
            let img = L.DomUtil.create('img', '', container);
            img.src = options.regularImageUrl;
            this._img = img;
            L.DomUtil.addClass(container, prefix + '-img');
            L.DomUtil.addClass(container, prefix + '-externalImage');
        } else if (options.text) {
            L.DomUtil.addClass(container, prefix + '-text');
            let span = L.DomUtil.create('span', '', container);
            span.innerHTML = options.text;
        } else if (svgSprite) {
          L.DomUtil.addClass(container, 'svgIcon');
          var useHref = '#' + options.id.toLowerCase();
          container.innerHTML = '<svg role="img" class="svgIcon"><use xlink:href="' + useHref + '" href="' + useHref + '"></use></svg>';
        } else {
            L.DomUtil.addClass(container, prefix + '-img ' +  prefix + '-sprite');
        }
        // if (container.children.length) {
            // L.DomUtil.addClass(container, prefix + '-externalImage');
        // }
        if (options.style) this.setStyle(options.style);

        L.DomEvent.on(container, 'click', this._iconClick, this);
        if (options.onAdd) options.onAdd(this);
        this.fire('controladd');
        map.fire('controladd', this);

        if (options.notHide) container._notHide = true;
        if (map.gmxControlsManager) map.gmxControlsManager.add(this);
		L.DomEvent.disableClickPropagation(container);
        return container;
    },
    _iconClick: function () {
		if (this._container.parentNode) {
			this.setActive(!this.options.isActive);
			this.fire('click');
			if (this.options.stateChange) { this.options.stateChange(this); }
		}
	},

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        this.fire('controlremove');
        map.fire('controlremove', this);

        var container = this._container;
        L.DomEvent.off(container, 'click', this._iconClick, this);
    },

    addTo: function (map) {
        L.Control.prototype.addTo.call(this, map);
        if (this.options.addBefore) {
            this.addBefore(this.options.addBefore);
        }
        return this;
    },

    addBefore: function (id) {
        var parentNode = this._parent && this._parent._container;
        if (!parentNode) {
            parentNode = this._map && this._map._controlCorners[this.getPosition()];
        }
        if (!parentNode) {
            this.options.addBefore = id;
        } else {
            for (var i = 0, len = parentNode.childNodes.length; i < len; i++) {
                var it = parentNode.childNodes[i];
                if (id === it._id) {
                    parentNode.insertBefore(this._container, it);
                    break;
                }
            }
        }

        return this;
    }
});

L.Control.gmxIcon = L.Control.GmxIcon;
L.control.gmxIcon = function (options) {
  return new L.Control.GmxIcon(options);
};
