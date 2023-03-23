const ICONSIZE = 32;
const _options =  {
	position: 'topleft',
	id: 'defaultIconGroup',
	isVertical: true,
	isCollapsible: true,
	isSortable: false,
	singleSelection: false
};
L.Control.GmxIconGroup = L.Control.GmxIcon.extend({
	initialize(options) {
        this.options = {
			..._options,
			...options
		};
	},
    addIcon: function (gmxIcon) {
        this.items.push(gmxIcon);
        gmxIcon._parent = this;
        if (this._map) {
            this._container.appendChild(gmxIcon.onAdd(this._map));
            if (gmxIcon.options.addBefore) gmxIcon.addBefore(gmxIcon.options.addBefore);
        }

        gmxIcon.on('click', function () {
            this.setActiveIcon(gmxIcon);
        }, this);
        return this;
    },
    removeIcon: function (gmxIcon) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            if (gmxIcon === this.items[i]) {
                var cont = gmxIcon._container;
                if (cont.parentNode) cont.parentNode.removeChild(cont);
                this.items.splice(i, 1);
                break;
            }
        }
        return this;
    },
    getIconById: function (id) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it.options.id === id) return it;
        }
        return null;
    },
    setActiveIcon: function (gmxIcon, isActive) {
        this.activeIcon = '';
        var len = this.items.length;
        if (len) {
			if (this.options.singleSelection) {
                (this.items || []).forEach(it => {
                    let flag = gmxIcon === it && (isActive || it.options.isActive);
                    it.setActive(flag);
                    if (flag) { this.activeIcon = it.options.id; }
                });
            }
            var cont = this._container;
            if (this.options.isSortable && gmxIcon && cont.firstChild) cont.insertBefore(gmxIcon._container, cont.firstChild);
			cont.classList.remove('isActiveItems');
			if (this.activeIcon) cont.classList.add('isActiveItems');
            this.fire('activechange', this);
        }
        return this;
    },

    onAdd: function (map) {
        this.options = {
			...this.options,
			...L.Control.GmxIcon.prototype.options,
			...L.Control.GmxIconGroup.prototype.options,
		};

        var options = this.options,
			// svgSprite = options.svgSprite || map.options.svgSprite,
			svgSprite = true,
			prefix = 'leaflet-gmx-icon-group',
            className = prefix + '-' + options.id + ' ' + prefix + 'Svg ' + prefix + (options.isVertical ? '-vertical' : '-horizontal'),
            container = L.DomUtil.create('div', prefix + ' ' + className);

// console.log("onAdd", svgSprite, options);
		if (options.isVertical) {
            if (options.isCollapsible) {
				this.triangle = L.DomUtil.create('div', 'triangleSvg',  container);
				this.triangle.innerHTML = '<svg role="img" class="svgIcon"><use xlink:href="#arrow-down"></use></svg>';
            }
        }

        this._map = map;
        this._container = container;
        container._id = options.id;

        this.items = [];
        (options.items || []).map(this.addIcon, this);
        if (options.onAdd) { options.onAdd(this); }
        this.fire('controladd');
        map.fire('controladd', this);

        if (options.isVertical) container.style.marginLeft = 0;
        if (options.notHide) container._notHide = true;
        if (map.gmxControlsManager) map.gmxControlsManager.add(this);
		L.DomEvent.disableClickPropagation(container);
        return container;
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) map.gmxControlsManager.remove(this);
        this.fire('controlremove');
        map.fire('controlremove', this);
    }
/*

    _chkTriangleStyle: function (first) {
        var cont = this._container;
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it._container === first) {
                if (it.options.text) {
                    this.triangle.style.right = (cont.clientWidth - first.clientWidth - 5) + 'px';
                    this.triangle.style.left = 'inherit';
                }
                break;
            }
        }
    },
    _minimize: function () {
        var style = this._container.style;

        style.height = ICONSIZE + 'px';
        if (this.options.width !== 'auto') { style.width = (ICONSIZE + 4) + 'px'; }
        style.overflow = 'hidden';
        if (this.bg) { this.bg.height = ICONSIZE + 2; }

		L.DomUtil.removeClass(this._container, 'leaflet-gmx-icon-group-maximum');
        this.fire('collapse', this);
    },

    _maximize: function () {
        var style = this._container.style,
            options = this.options;

        var size = this.items.length === 1 ? ICONSIZE : (ICONSIZE + 4) * this.items.length;
        if (options.isVertical) {
            if (this.bg) { this.bg.height = size; }
            style.height = size + 'px';
            if (options.width !== 'auto') { style.width = (ICONSIZE + 4) + 'px'; }
        } else {
            style.height = ICONSIZE + 'px';
            style.width = size + 'px';
        }
        style.overflow = 'unset';
		L.DomUtil.addClass(this._container, 'leaflet-gmx-icon-group-maximum');
        this.fire('expand', this);
    },
*/
});
L.Control.gmxIconGroup = L.Control.GmxIconGroup;
L.control.gmxIconGroup = function (options) {
  return new L.Control.GmxIconGroup(options);
};

// })();
