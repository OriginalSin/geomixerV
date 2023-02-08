(function() {
function isIE(v) {
  return RegExp('msie' + (!isNaN(v) ? ('\\s' + v) : ''), 'i').test(navigator.userAgent);
}
var ICONSIZE = 32;
L.Control.GmxIconGroup = L.Control.GmxIcon.extend({
    options: {
        position: 'topleft',
        id: 'defaultIconGroup',
        isVertical: true,
        isCollapsible: true,
        isSortable: false,
        singleSelection: false
    },
    addIcon: function (gmxIcon) {
        this.items.push(gmxIcon);
        gmxIcon._parent = this;
        if (this._map) {
            this._container.appendChild(gmxIcon.onAdd(this._map));
            if (gmxIcon.options.addBefore) {
                gmxIcon.addBefore(gmxIcon.options.addBefore);
            }
        }

        gmxIcon.on('click', function () {
            this.setActiveIcon(gmxIcon);
        }, this);

        if (this.options.isCollapsible && !gmxIcon.options.skipCollapse) {
            gmxIcon.on('click', this._minimize, this);
        }
        return this;
    },
    removeIcon: function (gmxIcon) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            if (gmxIcon === this.items[i]) {
                var cont = gmxIcon._container;
                if (cont.parentNode) {
                    cont.parentNode.removeChild(cont);
                }
                this.items.splice(i, 1);
                break;
            }
        }
        return this;
    },
    getIconById: function (id) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it.options.id === id) { return it; }
        }
        return null;
    },
    setActiveIcon: function (gmxIcon, isActive) {
        this.activeIcon = '';
        var len = this.items.length;
        if (len) {
            if (this.options.singleSelection) {
                for (var i = 0; i < len; i++) {
                    var it = this.items[i],
                        flag = gmxIcon === it && (isActive || it.options.isActive);
                    it.setActive(flag);
                    if (flag) { this.activeIcon = it.options.id; }
                }
            }
            var cont = this._container;
            if (this.options.isSortable && gmxIcon && cont.firstChild) {
                cont.insertBefore(gmxIcon._container, cont.firstChild);
                if (gmxIcon.options.text) {
                    this._chkTriangleStyle(gmxIcon._container);
                }
            }
            if (this.triangle) {
                var icon = this.options.isSortable ? gmxIcon : this.items[0];
                if (icon && icon.options.isActive) {
                    L.DomUtil.addClass(this.triangle, 'triangle-active');
                } else {
                    L.DomUtil.removeClass(this.triangle, 'triangle-active');
                }
            }
            this.fire('activechange', this);
        }
        return this;
    },

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

    onAdd: function (map) {
        var options = this.options,
			svgSprite = options.svgSprite || map.options.svgSprite,
			prefix = 'leaflet-gmx-icon-group',
            className = prefix + '-' + options.id + (svgSprite ? ' ' + prefix + 'Svg' : '') + ' ' + prefix + (options.isVertical ? '-vertical' : '-horizontal'),
            container = L.DomUtil.create('div', prefix + ' ' + className);

		if (options.isVertical) {
            if (isIE(10) || isIE(9)) {
                var vertical = L.DomUtil.create('span', 'icons-vertical',  container);
                var bg = L.DomUtil.create('img', '',  vertical);
                bg.width = bg.height = ICONSIZE;
                bg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=';
                this.bg = bg;
                setTimeout(function() { bg.width = container.clientWidth; }, 0);
            }
            if (options.isCollapsible) {
				if (svgSprite) {
					this.triangle = L.DomUtil.create('div', 'triangleSvg',  container);
					this.triangle.innerHTML = '<svg role="img" class="svgIcon">\
						<use xlink:href="#arrow-down"></use>\
						</svg>';
				} else {
					this.triangle = L.DomUtil.create('div', 'triangle leaflet-gmx-icon-sprite',  container);
					this.triangle.width = this.triangle.height = ICONSIZE;
				}
            }
        }

        this._map = map;
        this._container = container;
        container._id = options.id;
        if (options.isCollapsible) {
            L.DomEvent
                .on(container, 'mousemove', L.DomEvent.stopPropagation)
                .on(container, 'mouseout', function(event) {
                    var parent = event.toElement;
                    while (parent) {
                        if (parent === container) { return; }
                        parent = parent.parentNode;
                    }
                    this._minimize();
                }, this)
                .on(container, 'mouseover', function(event) {
                    var parent = event.fromElement;
                    while (parent) {
                        if (parent === container) { return; }
                        parent = parent.parentNode;
                    }
                    this._maximize();
                }, this);

            this._minimize();
        }

        this.items = [];
        options.items.map(this.addIcon, this);
        if (options.onAdd) { options.onAdd(this); }
        this.fire('controladd');
        map.fire('controladd', this);

        if (options.isVertical) { container.style.marginLeft = 0; }
        if (options.notHide) {
            container._notHide = true;
        }
        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        if (this.items.length) {
            var first = this.items[0],
                _this = this;
            if (first.options.text) {
                setTimeout(function() { _this._chkTriangleStyle(first._container); }, 0);
            }
        }
        return container;
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        this.fire('controlremove');
        map.fire('controlremove', this);
    }
});
L.Control.gmxIconGroup = L.Control.GmxIconGroup;
L.control.gmxIconGroup = function (options) {
  return new L.Control.GmxIconGroup(options);
};

})();
