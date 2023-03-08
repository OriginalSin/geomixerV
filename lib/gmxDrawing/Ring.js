import Utils from './Utils.js';
import GmxDrawingContextMenu from './ContextMenu.js';
import PointMarkers from './PointMarkers.js';

const _options = {
	className: 'leaflet-drawing-ring',
	maxPoints: 0,
	minPoints: 0,
	// skipEqual: false,
	smoothFactor: 0,
	showPointsNum: false,
	noClip: true,
	opacity: 1,
	shape: 'circle',
	fill: true,
	fillColor: '#ffffff',
	fillOpacity: 1,
	size: L.Browser.mobile ? 40 : 8,
	weight: 2
};

const Ring = L.LayerGroup.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    initialize: function (parent, coords, options) {
        options = options || {};

        this.contextmenu = new GmxDrawingContextMenu();
        options.mode = '';
        this._activeZIndex = options.activeZIndex || 7;
        this._notActiveZIndex = options.notActiveZIndex || 6;
        this.options = {..._options, ...parent.getStyle(), ...options};

        this._layers = {};
        this._coords = coords;
        this._legLength = [];
        this._parent = parent;

        this._initialize(parent, coords);
    },

    _initialize: function (parent, coords) {
        this.clearLayers();
        delete this.lines;
        delete this.fill;
        delete this.points;

        this.downObject = false;
        this.mode = '';
        this.lineType = this.options.type.indexOf('Polyline') !== -1;
		if (this.options.type === 'Rectangle') {
			this.options.disableAddPoints = true;
		}

        var pointStyle = this.options.pointStyle;
        var lineStyle = {opacity:1, weight:2, noClip: true, clickable: false, className: 'leaflet-drawing-lines'};
        if (!this.lineType) {
            lineStyle.fill = 'fill' in this.options ? this.options.fill : true;
        }
        if (this.options.lineStyle) {
            for (var key in this.options.lineStyle) {
                if (key !== 'fill' || !this.lineType) {
                    lineStyle[key] = this.options.lineStyle[key];
                }
            }
        }
        if (this.options.hole) {
            lineStyle = L.extend({}, lineStyle, Utils.defaultStyles.holeStyle);
            pointStyle = L.extend({}, pointStyle, Utils.defaultStyles.holeStyle);
        } else {
			if (this.options.type === 'Polyline') {
				this.contextmenu.insertItem({text: 'Add line'});
			} else {
				this.contextmenu.insertItem({text: 'Add hole'});
				this.contextmenu.insertItem({text: 'Add polygon'});
			}
		}

        var latlngs = coords,
            _this = this,
            mode = this.options.mode || (latlngs.length ? 'edit' : 'add');

        var fillStyle = {opacity:0, weight:10, size: 10, noClip: true, smoothFactor: 0, fill: false, className: 'lleaflet-drawing-lines-fill'};
        if (this.options.fillStyle) {
            fillStyle = L.extend({}, fillStyle, this.options.fillStyle);
		}
		if (this.options.className) {
            fillStyle.className += ' ' + this.options.className;
            lineStyle.className += ' ' + this.options.className;
            pointStyle.className += ' ' + this.options.className;
        }
		this.fill = new L.Polyline(latlngs, fillStyle);
        this.fill.on('click', e => {
            this._parent.fire('click', e);
        });
        this.addLayer(this.fill);

        this.lines = new L.Polyline(latlngs, lineStyle);
        this.addLayer(this.lines);
        if (!this.lineType && mode === 'edit') {
			var latlng = latlngs[0][0] || latlngs[0];
            this.lines.addLatLng(latlng);
            this.fill.addLatLng(latlng);
        }
        this.mode = mode;

        this.points = new PointMarkers(latlngs, pointStyle);
        this.points._parent = this;

        this.addLayer(this.points);

        this.points
            .on('mouseover', function (ev) {
				this.toggleTooltip(ev, true, _this.lineType ? 'Length' : 'Area');
                if (ev.type === 'mouseover') {
                    _this._recheckContextItems('points', _this._map);
                }
            }, this)
            .on('mouseout', this.toggleTooltip, this);
        this.fill
            .on('mouseover mousemove', function (ev) {
				this.toggleTooltip(ev, true);
            }, this)
            .on('mouseout', this.toggleTooltip, this);

		if (this.points.bindContextMenu) {
			this.points.bindContextMenu({
				contextmenu: false,
				contextmenuInheritItems: false,
				contextmenuItems: []
			});
		}
		if (this.fill.bindContextMenu) {
			this.fill.bindContextMenu({
				contextmenu: false,
				contextmenuInheritItems: false,
				contextmenuItems: []
			});
			this.fill.on('mouseover', function (ev) {
				if (ev.type === 'mouseover') {
					this._recheckContextItems('fill', this._map);
				}
			}, this);
		}
        this._parent.on('rotate', function (ev) {
			this.toggleTooltip(ev, true, 'angle');
		}, this);
		L.DomEvent.on(document, 'keydown keyup', this._toggleBboxClass, this);
        if (this.options.showPointsNum) {
			this._createPointsNum();
		}
	},

    _createPointsNum: function () {
		var svgNS = 'http://www.w3.org/2000/svg';
		var userSelectProperty = L.DomUtil.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

		const opt = this.options.showPointsNum || {};
		const dx = 0, dy = -8;
		const _createItem = (it, nm, cont) => {
			let b = document.createElementNS(svgNS, 'rect');
			b.setAttributeNS(null, 'x', it.x - 4 + dx);
			b.setAttributeNS(null, 'y', it.y - 12 + dy);
			b.setAttributeNS(null, 'rx', 4);
			b.setAttributeNS(null, 'ry', 4);
			b.setAttributeNS(null, 'height', 16);
			L.DomUtil.addClass(b, 'gmxTooltipBGp' + (this.options.hole ? 'h' : ''));
			cont.appendChild(b);
			let	t = document.createElementNS(svgNS, 'text');
			t.style[userSelectProperty] = 'none';
			t.setAttributeNS(null, 'x', it.x + dx);
			t.setAttributeNS(null, 'y', it.y + dy);
			if (opt.prefix) nm = opt.prefix + nm;
			if (opt.postfix) nm += opt.postfix;
			t.innerHTML = nm;
			cont.appendChild(t);
			var length = t.getComputedTextLength();
			b.setAttributeNS(null, 'width', length + 8);
		};
		this.tPoints = false;
		this.showTooltipPoints = function(textArr) {
			if (textArr && textArr.length) {
				if (!this.tPoints) {
					this.tPoints = document.createElementNS(svgNS, 'g');
					const svgCont = this._map._pathRoot || this._map._renderer._container;
					svgCont.appendChild(this.tPoints);
				}
				Object.values(this.tPoints.childNodes).forEach(it => { it.remove(); });
				textArr.forEach((it, i) => {
					let nm = i + 1;
					if (!opt.skipLast || nm < textArr.length) {
						_createItem(it, nm, this.tPoints);
					}
				});
			}
		};
 	},
    checkMoveend: function () {
		if (this.tPoints && this.points) {
			var d = this.points._path.getAttribute('d');
			this.tPoints.setAttribute('visibility', d ? '' : 'hidden');
		}
    },

    bringToFront: function () {
		if (this.lines) { this.lines.bringToFront(); }
		if (this.fill) { this.fill.bringToFront(); }
		if (this.points) { this.points.bringToFront(); }

		return this;
    },

    bringToBack: function () {
		if (this.lines) { this.lines.bringToBack(); }
		if (this.fill) { this.fill.bringToBack(); }
		if (this.points) { this.points.bringToBack(); }

		return this;
    },

    _toggleBboxClass: function (ev) {
		if (ev.type === 'keydown' && this.mode === 'add') {
			var key = ev.key,
				points = this._getLatLngsArr();

			if (key === 'Backspace') {
				this._legLength = [];
				points.splice(points.length - 1, 1);
                this._setPoint(points[0], 0);
			}
            if (key === 'Escape' || (key === 'Backspace' && points.length < 2)) {
                this._parent.remove(this);
				this._parent._parent._clearCreate();
				this._fireEvent('drawstop');
			}
		}
		if (this.bbox) {
			var flagRotate = this._needRotate;
			if (!ev.altKey) { flagRotate = !flagRotate; }
			if (ev.type === 'keyup' && !ev.altKey) { flagRotate = !this._needRotate; }
			L.DomUtil[flagRotate ? 'removeClass' : 'addClass'](this.bbox._path, 'Rotate');
		}
	},

    toggleTooltip: function (ev, flag, type) {
		if (!this.options.toolTipPoints && '_showTooltip' in this._parent) {
			ev.ring = this;
			if (flag) {
				type = type || 'Length';
				this._parent._showTooltip(type, ev);
			} else if (this.mode !== 'add') {
				this._parent.hideTooltip(ev);
			}
		}
	},

    _recheckContextItems: function (type, map) {
        var _this = this;
		this[type].options.contextmenuItems = (map.gmxDrawing.contextmenu.getItems()[type] || [])
			.concat(this._parent.contextmenu.getItems()[type] || [])
			.concat(this.contextmenu.getItems()[type] || [])
			.map(function(obj) {
				var ph = {
					id: obj.text,
					text: Utils.getLocale(obj.text),
					icon: obj.icon,
					retinaIcon: obj.retinaIcon,
					iconCls: obj.iconCls,
					retinaIconCls: obj.retinaIconCls,
					callback: function (ev) {
						_this._eventsCmd(obj, ev);
					},
					context: obj.context || _this,
					disabled: 'disabled' in obj ? obj.disabled : false,
					separator: obj.separator,
					hideOnSelect: 'hideOnSelect' in obj ? obj.hideOnSelect : true
				};
				return ph;
			});
		return this[type].options.contextmenuItems;
    },

    _eventsCmd: function (obj, ev) {
		var ring = ev.relatedTarget && ev.relatedTarget._parent || this;
		var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent);
		if (downAttr) {
			var type = obj.text;
			if (obj.callback) {
				obj.callback(downAttr, this._parent);
			} else if (type === 'Add hole') {
				ring._addHole(ring);
			} else if (type === 'Add polygon') {
				ring._addPoly(ring);
			} else if (type === 'Add line') {
				ring._addLine(ring);
			} else if (type === 'Delete feature') {
                this._parent.remove(this);
				// this._parent._parent._clearCreate();
				this._fireEvent('drawstop');
			} else if (type === 'Remove point') {
				ring._removePoint(downAttr.num);
				// this._fireEvent('editstop', ev);
			} else if (type === 'Save' || type === 'Move' || type === 'Rotate' || type === 'Rotate around Point') {
                this._toggleRotate(type, downAttr);
			} else if (type === 'Cancel' && this._editHistory.length) {
				if (this._editHistory.length) {
					this.setLatLngs(this._editHistory[0]);
					this._editHistory = [];
				}
                this._toggleRotate('Save', downAttr);
			}
        }
    },

    _addHole: function (ring) {
		ring._map.gmxDrawing.create('Polygon', {hole: true, forRing: ring})
        ring._map.gmxDrawing.once('drawstop', function (ev) {
			var obj = ev.object;
			this._fireEvent('addHole', { ring, latLngsArr: obj.rings[0].ring._getLatLngsArr() });
			if (this._map && this._map.contextmenu) this._map.contextmenu.hide();
			obj._parent.remove(obj);
			// console.log('_addHole', ev, ring._parent.rings.holes);
        }, ring);
	},

    _addPoly: function (ring) {
		ring._map.gmxDrawing.create('Polygon')
        ring._map.gmxDrawing.once('drawstop', function (ev) {
			var obj = ev.object;
			this._fireEvent('addPoly', { ring, latLngsArr: obj.rings[0].ring._getLatLngsArr() });
			if (this._map && this._map.contextmenu) this._map.contextmenu.hide();
			obj._parent.remove(obj);
        }, ring);
	},

    _addLine: function (ring) {
		ring._map.gmxDrawing.create('Polyline')
        ring._map.gmxDrawing.once('drawstop', function (ev) {
			var obj = ev.object;
			this._fireEvent('addLine', { ring, latLngsArr: obj.rings[0].ring._getLatLngsArr() });
			if (this._map && this._map.contextmenu) this._map.contextmenu.hide();
			obj._parent.remove(obj);
        }, ring);
	},

    getFeature: function () {
		return this._parent;
    },

    onAdd: function (map) {
        L.LayerGroup.prototype.onAdd.call(this, map);
        this.setEditMode();
		if (this.points.bindContextMenu) {
			var contextmenuItems = this._recheckContextItems('points', map);
			this.points.bindContextMenu({
				contextmenu: true,
				contextmenuInheritItems: false,
				contextmenuItems: contextmenuItems
			});
		}
        map.on('moveend', this.checkMoveend, this);

    },

    onRemove: function (map) {
        map.off('moveend', this.checkMoveend, this);
		if (this.tPoints) {
			const svgCont = map._pathRoot || map._renderer._container;
			svgCont.removeChild(this.tPoints);
		}
        if (this.points) {
            this._pointUp();
            this.removeAddMode();
            this.removeEditMode();
			this._removeToolTipPoints();

            if ('hideTooltip' in this._parent) { this._parent.hideTooltip(); }
        }
        L.LayerGroup.prototype.onRemove.call(this, map);
        if (this.options.type === 'Point') {
            map.removeLayer(this._obj);
        }
        this._fireEvent('removefrommap');
    },

    getAngleLength: function (downAttr) {
        if (L.GeometryUtil && downAttr && downAttr.num) {
            var num = downAttr.num,
				latlngs = this.points._latlngs[0],
                prev = latlngs[num - 1],
                curr = latlngs[num] || downAttr.latlng,
				_parts = this.points._parts[0],
				angle = L.GeometryUtil.computeAngle(_parts[num - 1], _parts[num] || downAttr.layerPoint);
			angle += 90;
			angle %= 360;
			angle += angle < 0 ? 360 : 0;
			return {
				length: L.gmxUtil.distVincenty(prev.lng, prev.lat, curr.lng, curr.lat),
				angle: L.gmxUtil.formatDegrees(angle, 0)
			};
		}
        return null;
    },

    getLength: function (downAttr) {
        var length = 0,
            latlngs = this._getLatLngsArr(),
            len = latlngs.length;

        if (len) {
            var beg = 1,
                prev = latlngs[0];
            if (downAttr) {
                if (downAttr.type === 'node') {
                    len = downAttr.num + 1;
                } else {
                    beg = downAttr.num;
                    if (beg === len) {
                        prev = latlngs[beg - 1];
                        beg = 0;
                    } else {
                        prev = latlngs[beg - 1];
                    }
                    len = beg + 1;
                }
            }
            for (var i = beg; i < len; i++) {
                var leg = this._legLength[i] || null;
                if (leg === null) {
                    leg = L.gmxUtil.distVincenty(prev.lng, prev.lat, latlngs[i].lng, latlngs[i].lat);
                    this._legLength[i] = leg;
                }
                prev = latlngs[i];
                length += leg;
            }
        }
        return length;
    },

    _setPoint: function (latlng, nm, type) {
        if (!this.points) { return; }
        var latlngs = this._getLatLngsArr();
        if (this.options.type === 'Rectangle') {
			if (type === 'edge') {
                nm--;
                if (nm === 0) { latlngs[0].lng = latlngs[1].lng = latlng.lng; }
                else if (nm === 1) { latlngs[1].lat = latlngs[2].lat = latlng.lat; }
                else if (nm === 2) { latlngs[2].lng = latlngs[3].lng = latlng.lng; }
                else if (nm === 3) { latlngs[0].lat = latlngs[3].lat = latlng.lat; }
            } else {
                latlngs[nm] = latlng;
                if (nm === 0) { latlngs[3].lat = latlng.lat; latlngs[1].lng = latlng.lng; }
                else if (nm === 1) { latlngs[2].lat = latlng.lat; latlngs[0].lng = latlng.lng; }
                else if (nm === 2) { latlngs[1].lat = latlng.lat; latlngs[3].lng = latlng.lng; }
                else if (nm === 3) { latlngs[0].lat = latlng.lat; latlngs[2].lng = latlng.lng; }
            }
            this._legLength = [];
        } else {
            latlngs[nm] = latlng;
            this._legLength[nm] = null;
            this._legLength[nm + 1] = null;
        }
        this.setLatLngs(latlngs);
    },

    addLatLng: function (point, delta) {
        this._legLength = [];
        if (this.points) {
            var points = this._getLatLngsArr(),
                maxPoints = this.options.maxPoints,
                // skipEqual = this.options.skipEqual,
                len = points.length,
                lastPoint = points[len - 2],
				flag = !lastPoint || !lastPoint.equals(point);

            if (maxPoints && len >= maxPoints) {
				this.setEditMode();
				this._fireEvent('drawstop', {latlng: point});
				len--;
			}
            if (flag) {
                if (delta) { len -= delta; }    // reset existing point
                this._setPoint(point, len, 'node');
            }
			this._parent.lastAddLatLng = point;
        } else if ('addLatLng' in this._obj) {
            this._obj.addLatLng(point);
        }
    },

    setPositionOffset: function (p) {
        L.DomUtil.setPosition(this.points._container, p);
        L.DomUtil.setPosition(this.fill._container, p);
        L.DomUtil.setPosition(this.lines._container, p);
    },

    _removeToolTipPoints: function () {
		(this.points._toolTipPoints || []).map(tooltip => {
			if (this._map) this._map.removeLayer(tooltip);
		});
    },

    _createToolTipPoints: function (latlngs) {
		let arr = latlngs;
		let prev = arr.shift();
		let len = arr.length - 1;
		let sm = 0;
		let tOptions = {direction: 'top', interactive: true, sticky: true, permanent: true, className: 'staticTooltipPoint'};
		tOptions.offset =  L.point(0, -10);
        if (this.options.className) {
            tOptions.className += ' ' + this.options.className;
        }
		if (this.options.type === 'Polyline') {
			this.points._toolTipPoints = arr.map((latlng, i) => {
				let leg = L.gmxUtil.distVincenty(prev.lng, prev.lat, latlng.lng, latlng.lat);
				prev = latlng;
				sm += leg;
				let tCont = L.DomUtil.create('div', 'content');
				let info = L.DomUtil.create('span', 'infoTooltip', tCont);
				let str = '';
				if (len === i) {
					str = 'Отрезок: ';
					let closeBtn = L.DomUtil.create('span', 'closeBtn', tCont);
					L.DomEvent.on(closeBtn, 'click', function() {
						this._removeToolTipPoints();
						this.getFeature().remove();
					}, this);
				}
				info.innerHTML = str + L.gmxUtil.prettifyDistance(sm, this._map.options.distanceUnit);
				return L.tooltip(tOptions)
					.setLatLng(latlng)
					.setContent(tCont)
					.addTo(this._map);
					});
		} else {
			let tCont = L.DomUtil.create('div', 'content');
			let info = L.DomUtil.create('span', 'infoTooltip', tCont);
			tOptions.offset =  L.point(0, -10);
			let closeBtn = L.DomUtil.create('span', 'closeBtn', tCont);
			L.DomEvent.on(closeBtn, 'click', function() {
				this._removeToolTipPoints();
				this.getFeature().remove();
			}, this);

			let area = L.gmxUtil.geoJSONGetArea(this.points.toGeoJSON());
			info.innerHTML = 'Полигон: ' + L.gmxUtil.prettifyArea(area, this._map.options.squareUnit);
			this.points._toolTipPoints = [
				L.tooltip(tOptions)
					.setLatLng(latlngs[0])
					.setContent(tCont)
					.addTo(this._map)
			];
		}
		// console.log('bearing',i, bearing);
    },

    setLatLngs: function (latlngs) {	// TODO: latlngs не учитывает дырки полигонов
		if (this.points) {
            var points = this.points;
            this.fill.setLatLngs(latlngs);
            this.lines.setLatLngs(latlngs);
            if (!this.lineType && this.mode === 'edit' && latlngs.length > 2) {
                this.lines.addLatLng(latlngs[0]);
                this.fill.addLatLng(latlngs[0]);
            }
            if (this.bbox) {
				this.bbox.setBounds(this.lines._bounds);
            }

            points.setLatLngs(latlngs);
			if (this.options.toolTipPoints) {
				this._removeToolTipPoints();
				this._createToolTipPoints(latlngs);
			}
			if (this.showTooltipPoints) this.showTooltipPoints(this.points._parts[0]);
        } else if ('setLatLngs' in this._obj) {
            this._obj.setLatLngs(latlngs);
        }
        this._fireEvent('edit');
    },

    _getLatLngsArr: function () {
		return Utils.isOldVersion ? this.points._latlngs : this.points._latlngs[0];
    },

    // edit mode
    _pointDown: function (ev) {
        if (!this._map) {
            return;
        }
        if (L.Browser.ie || (L.gmxUtil && L.gmxUtil.gtIE11)) {
            this._map.dragging._draggable._onUp(ev); // error in IE
        }
        if (ev.originalEvent) {
            var originalEvent = ev.originalEvent;
            if (originalEvent.altKey) {	// altKey, shiftKey
                this._onDragStart(ev);
                return;
            } else if (originalEvent.which !== 1 && originalEvent.button !== 1) {
                return;
            }
        }
        var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent),
            type = downAttr.type,
            opt = this.options;

        this._lastDownTime = Date.now() + 100;
        this.down = downAttr;
        if (type === 'edge' && opt.type !== 'Rectangle') {
        // if (type === 'edge' && downAttr.ctrlKey && opt.type !== 'Rectangle') {
            if (opt.disableAddPoints) { return; }
            this._legLength = [];
            var num = downAttr.num,
                points = this._getLatLngsArr();
            points.splice(num, 0, points[num]);
            this._setPoint(ev.latlng, num, type);
        }
        this.downObject = true;
        this._parent._disableDrag();
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._mouseupPoint, this);
    },

    _chkHolePoint: function (point) {
        if (this.options.hole) {
			let prnt = this.options.forRing;
			// if (this.mode === 'add') prnt = prnt._parent;
			let points = prnt.points._parts[0];

			if (points && !Utils.isPointInRing(point, points)) {
				return false;
			}
			let holes = prnt._parent.rings[0].holes;
			for (let i = 0, len = holes.length; i < len; i++) {
				if (holes[i] !== this) {
					points = holes[i].points._parts[0];
					if (points && Utils.isPointInRing(point, points)) return false;
				}
			}
		}
		return true;
   },

    _mouseupPoint: function (ev) {
		const ctrlKey = ev.originalEvent.ctrlKey;
		if (!this._chkHolePoint(ev.layerPoint)) {
			this._pointUp(ev);
			return;
		}
		let latlng = ev.latlng;
		let _setPoint = this.down && !ctrlKey;

        if (ctrlKey && Utils.chkGeoJson(this.points.toGeoJSON()).length) {
			latlng = this._lastSnapLatlng;
			_setPoint = true;
		}
 // console.log('_mouseupPoint', _setPoint, ev)
       if (_setPoint) {
			this._setPoint(latlng, this.down.num, this.down.type);
		}
		this._pointUp(ev);
        if (this.__mouseupPointTimer) { cancelIdleCallback(this.__mouseupPointTimer); }
		this.__mouseupPointTimer = requestIdleCallback(function() {
			this._fireEvent('editstop', ev);
		}.bind(this), {timeout: 250});
    },

    _pointMove: function (ev) {
		const ctrlKey = ev.originalEvent.ctrlKey;
		// if (!this._chkHolePoint(ev.layerPoint)) {
			// return;
		// }

        if (this.down && this._lastDownTime < Date.now()) {
            if (!this.lineType) {
                this._parent.showFill();
            }
			
            this._clearLineAddPoint();
            this._moved = true;
		if (!this._chkHolePoint(ev.layerPoint)) {
			return;
		}

			let latlng = ev.latlng;
			if (ctrlKey) {
				// this._lastSnapLatlng = Utils.snapPoint(ev.latlng, this, this._map);
				let rp = Utils.snapPoint(ev.latlng, this, this._map);
				if (rp) latlng = this._lastSnapLatlng = rp;
			}
            this._setPoint(latlng, this.down.num, this.down.type);
			if (!this.options.toolTipPoints && '_showTooltip' in this._parent) {
				ev.ring = this;
				this._parent._showTooltip(this.lineType ? 'Length' : 'Area', ev);
			}
        }
    },

    _pointUp: function (ev) {
        this.downObject = false;
        this._parent._enableDrag();
        if (!this.points) { return; }
        if (this._map) {
            this._map
                .off('mousemove', this._pointMove, this)
                .off('mouseup', this._mouseupPoint, this);

            var target = ev && ev.originalEvent ? ev.originalEvent.target : null;
            if (target && target._leaflet_pos && /leaflet-marker-icon/.test(target.className)) {
                var latlng = Utils.getMarkerByPos(target._leaflet_pos, this._map.gmxDrawing.getFeatures());
                this._setPoint(latlng, this.down.num, this.down.type);
            }
            this._map._skipClick = true;    // for EventsManager
        }
        if (this._drawstop) {
           this._fireEvent('drawstop', ev);
        }
        this._drawstop = false;
        this.down = null;
        var lineStyle = this.options.lineStyle || {};
        if (!lineStyle.fill && !this.lineType) {
            this._parent.hideFill();
        }
    },
    _lastPointClickTime: 0,  // Hack for emulate dblclick on Point

    _removePoint: function (num) {
        var points = this._getLatLngsArr();
        if (points.length > num) {
            this._legLength = [];
            points.splice(num, 1);
            if (this.options.type === 'Rectangle'
                || points.length < 2
                || (points.length < 3 && !this.lineType)
                ) {
                this._parent.remove(this);
            } else {
                this._setPoint(points[0], 0);
            }
            this._fireEvent('drawstop', {op: 'pointRemove', mode: this.mode});
        }
	},

    _clearLineAddPoint: function () {
        if (this._lineAddPointID) { clearTimeout(this._lineAddPointID); }
        this._lineAddPointID = null;
    },

    _pointDblClick: function (ev) {
        this._clearLineAddPoint();
        if (!this.options.disableAddPoints && (!this._lastAddTime || Date.now() > this._lastAddTime)) {
            var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent);
            this._removePoint(downAttr.num);
        }
    },

    _pointClick: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) { return; }
        var clickTime = Date.now(),
            prevClickTime = this._lastPointClickTime;

        this._lastPointClickTime = clickTime + 300;
        if (this._moved || clickTime < prevClickTime) { this._moved = false; return; }

        var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent),
            mode = this.mode;
        if (downAttr.type === 'node') {
			var points = this._getLatLngsArr();
			var pCount = points.length;
			if (downAttr.end && this.options.minPoints && pCount <= this.options.minPoints) downAttr.end = false;
			
            var num = downAttr.num;
            if (downAttr.end) {  // this is click on first or last Point
                if (mode === 'add') {
                    this._pointUp();
                    this.setEditMode();
                    if (this.lineType && num === 0) {
                        this._parent.options.type = this.options.type = 'Polygon';
                        this.lineType = false;
                        this._removePoint(pCount - 1);
                    }
					downAttr.op = 'add';
                    this._fireEvent('drawstop', downAttr); // 1 drawstop
                    this._fireEvent('editstop', downAttr); // переход к edit
                    this._removePoint(num); // 2 drawstop
                    this._fireEvent('add', downAttr); // закончили добавление
                } else if (this.lineType) {
					this._clearLineAddPoint();
                    this._lineAddPointID = setTimeout(function () {
						if (num === 0) { points.reverse(); }
						this.points.addLatLng(downAttr.latlng);
						this.setAddMode();
						this._fireEvent('drawstop', downAttr);
					}.bind(this), 250);
                }
            } else if (mode === 'add') { // this is add pont
                this.addLatLng(ev.latlng);
            }
        }
    },

    _editHistory: [],
    // _dragType: 'Save',
    _needRotate: false,
    _toggleRotate: function (type, downAttr) {
		this._needRotate = type === 'Rotate' || type === 'Rotate around Point';
		this._editHistory = [];

		if (this.bbox) {
			this.bbox
				.off('contextmenu', this._onContextmenu, this)
				.off('mousedown', this._onRotateStart, this);
			this.removeLayer(this.bbox);
			this.bbox = null;
		} else {
			L.DomUtil.TRANSFORM_ORIGIN = L.DomUtil.TRANSFORM_ORIGIN || L.DomUtil.testProp(
				['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);

			this.bbox = L.rectangle(this.lines.getBounds(), {
				color: this.lines.options.color, //||'rgb(51, 136, 255)',
				opacity: this.lines.options.opacity,
				className: 'leaflet-drawing-bbox ' + type,
				dashArray: '6, 3',
				smoothFactor: 0,
				noClip: true,
				fillOpacity: 0,
				fill: true,
				weight: 1
			});
			this.addLayer(this.bbox);
			this.bbox
				.on('contextmenu', this._onContextmenu, this)
				.on('mousedown', this._onRotateStart, this);

			if (this.bbox.bindContextMenu) {
				this.bbox.bindContextMenu({
					contextmenu: false,
					contextmenuInheritItems: false,
					contextmenuItems: []
				});
			}

            this._recheckContextItems('bbox', this._map);
			this._rotateCenterPoint = type === 'Rotate' ? this.bbox.getCenter() : downAttr.latlng;

		}
    },

    _onContextmenu: function () {
		this.bbox.options.contextmenuItems[1].disabled = this._editHistory.length < 1;
    },

    _isContextMenuEvent: function (ev) {
		var e = ev.originalEvent;
		return e.which !== 1 && e.button !== 1 && !e.touches;
    },

    _onRotateStart: function (ev) {
		if (this._isContextMenuEvent(ev)) { return; }
		this._editHistory.push(this._getLatLngsArr().map(function(it) { return it.clone(); }));
		var flagRotate = this._needRotate;
		if (ev.originalEvent.altKey) {
			flagRotate = !flagRotate;
		}
		if (this._map.contextmenu) { this._map.contextmenu.hide(); }
		if (flagRotate) {
			this._rotateStartPoint = ev.latlng;
			this._rotateCenter = this._rotateCenterPoint;

			this._map
				.on('mouseup', this._onRotateEnd, this)
				.on('mousemove', this._onRotate, this);
			this._parent._disableDrag();
			this._fireEvent('rotatestart', ev);
		} else {
			this._onDragStart(ev);
		}
    },

    _onRotateEnd: function (ev) {	// TODO: не учитывает дырки полигонов
        this._map
            .off('mouseup', this._onRotateEnd, this)
            .off('mousemove', this._onRotate, this);

		this.toggleTooltip(ev);

		if (this._center) {
			var center = this._center,
				shiftPoint = this._map.getPixelOrigin().add(center),
				cos = Math.cos(-this._angle),
				sin = Math.sin(-this._angle),
				map = this._map,
				_latlngs = this.points._parts[0].map(function (p) {
					var ps = p.subtract(center);
					return map.unproject(L.point(
						ps.x * cos + ps.y * sin,
						ps.y * cos - ps.x * sin
					).add(shiftPoint));
				});
			this.setLatLngs(_latlngs);

			this._rotateItem();
			this.bbox.setBounds(this.lines._bounds);
			// console.log('_onRotateEnd', this.mode, this.points._latlngs, _latlngs);
		}
		this._parent._enableDrag();
        this._fireEvent('rotateend', ev);
    },

    _onRotate: function (ev) {
        var pos = ev.latlng,			// текущая точка
			s = this._rotateStartPoint,	// точка начала вращения
			c = this._rotateCenter;		// центр объекта

		this._rotateItem(
			Math.atan2(s.lat - c.lat, s.lng - c.lng) - Math.atan2(pos.lat - c.lat, pos.lng - c.lng),
			this._map.project(c).subtract(this._map.getPixelOrigin())
		);
		this._fireEvent('rotate', ev);
    },

    _rotateItem: function (angle, center) {
        var originStr = '',
			rotate = '';

		if (center) {
			originStr = center.x + 'px ' + center.y + 'px';
			rotate = 'rotate(' + angle + 'rad)';
		}

		this._angle = angle;
		this._center = center;

        [this.bbox, this.lines, this.fill, this.points].forEach(function(it) {
			it._path.style[L.DomUtil.TRANSFORM_ORIGIN] = originStr;
			it._path.style.transform = rotate;
		});
   },

    _onDragEnd: function () {
        this._map
            .off('mouseup', this._onDragEnd, this)
            .off('mousemove', this._onDrag, this);

		this._parent._enableDrag();
        this._fireEvent('dragend');
    },

    _onDragStart: function (ev) {
        this._dragstartPoint = ev.latlng;
        this._map
            .on('mouseup', this._onDragEnd, this)
            .on('mousemove', this._onDrag, this);
		this._parent._disableDrag();
        this._fireEvent('dragstart');
    },

    _onDrag: function (ev) {
        var lat = this._dragstartPoint.lat - ev.latlng.lat,
            lng = this._dragstartPoint.lng - ev.latlng.lng,
            points = this._getLatLngsArr();

        points.forEach(function (item) {
            item.lat -= lat;
            item.lng -= lng;
        });
        this._dragstartPoint = ev.latlng;

        this._legLength = [];
        this.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name, options) {
        this._parent._fireEvent(name, options);
    },

    _startTouchMove: function (ev, drawstop) {
        var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent);
        if (downAttr.type === 'node') {
            this._parent._disableDrag();
            this.down = downAttr;
            //var num = downAttr.num;
            var my = this;
            var _touchmove = function (ev) {
                downAttr = Utils.getDownType.call(my, ev, my._map, this._parent);
                    if (ev.touches.length === 1) { // Only deal with one finger
                        my._pointMove(downAttr);
                  }
            };
            var _touchend = function () {
                L.DomEvent
                    .off(my._map._container, 'touchmove', _touchmove, my)
                    .off(my._map._container, 'touchend', _touchend, my);
                my._parent._enableDrag();
                if (drawstop) {
                    my._parent.fire('drawstop', {mode: my.options.type, object: my});
                }
            };
            L.DomEvent
                .on(my._map._container, 'touchmove', _touchmove, my)
                .on(my._map._container, 'touchend', _touchend, my);
        }
    },

    _editHandlers: function (flag) {
        //if (!this.points) { return; }
        var stop = L.DomEvent.stopPropagation,
			prevent = L.DomEvent.preventDefault;
        if (this.touchstart) {
            L.DomEvent.off(this.points._container, 'touchstart', this.touchstart, this);
        }
        if (this.touchstartFill) {
            L.DomEvent.off(this.fill._container, 'touchstart', this.touchstartFill, this);
        }
        this.touchstart = null;
        this.touchstartFill = null;
        if (flag) {
            this.points
                .on('dblclick click', stop, this)
                .on('dblclick click', prevent, this)
                .on('dblclick', this._pointDblClick, this)
                .on('click', this._pointClick, this);
            if (L.Browser.mobile) {
                if (this._EditOpacity) {
                    this._parent._setPointsStyle({fillOpacity: this._EditOpacity});
                }
                var my = this;
                this.touchstart = function (ev) {
                    my._startTouchMove(ev);
                };
                L.DomEvent.on(this.points._container, 'touchstart', this.touchstart, this);
                this.touchstartFill = function (ev) {
                    var downAttr = Utils.getDownType.call(my, ev, my._map, this._parent);
                    if (downAttr.type === 'edge' && my.options.type !== 'Rectangle') {
                        var points = my.points._latlngs;
                        points.splice(downAttr.num, 0, points[downAttr.num]);
                        my._legLength = [];
                        my._setPoint(downAttr.latlng, downAttr.num, downAttr.type);
                    }
                };
                L.DomEvent.on(this.fill._container, 'touchstart', this.touchstartFill, this);
            } else {
                this.points
                    .on('mousemove', stop)
                    .on('mousedown', this._pointDown, this);
                this.lines
                    .on('mousedown', this._pointDown, this);
                this.fill
                    .on('dblclick click', stop, this)
                    .on('mousedown', this._pointDown, this);
                this._fireEvent('editmode');
            }
        } else {
            this._pointUp();
            this.points
                .off('dblclick click', stop, this)
                .off('dblclick click', prevent, this)
                .off('dblclick', this._pointDblClick, this)
                .off('click', this._pointClick, this);
            if (!L.Browser.mobile) {
                this.points
                    .off('mousemove', stop)
                    .off('mousedown', this._pointDown, this);
                this.lines
                    .off('mousedown', this._pointDown, this);
                this.fill
                    .off('dblclick click', stop, this)
                    .off('mousedown', this._pointDown, this);
            }
        }
    },

    _createHandlers: function (flag) {
        if (!this.points || !this._map) { return; }
        var stop = L.DomEvent.stopPropagation;
        if (flag) {
			if (this._map.contextmenu) {
				this._map.contextmenu.disable();
			}

            this._parent._enableDrag();
            this._map
                .on('dblclick', stop)
                .on('mousedown', this._mouseDown, this)
                .on('mouseup', this._mouseUp, this)
                .on('mousemove', this._moseMove, this);
            this.points
                .on('click', this._pointClick, this);
            this._fireEvent('addmode');
            if (!this.lineType) { this.lines.setStyle({fill: true}); }
        } else {
            if (this._map) {
                this._map
                    .off('dblclick', stop)
                    .off('mouseup', this._mouseUp, this)
                    .off('mousemove', this._moseMove, this);
                this.points
                    .off('click', this._pointClick, this);
            }
            var lineStyle = this.options.lineStyle || {};
            if (!this.lineType && !lineStyle.fill) {
                this.lines.setStyle({fill: false});
            }
        }
    },

    setEditMode: function () {
        if (this.options.editable) {
            this._editHandlers(false);
            this._createHandlers(false);
            this._editHandlers(true);
            this.mode = 'edit';
        }
        return this;
    },

    setAddMode: function () {
        if (this.options.editable) {
            this._editHandlers(false);
            this._createHandlers(false);
            this._createHandlers(true);
            this.mode = 'add';
        }
        return this;
    },

    removeAddMode: function () {
        this._createHandlers(false);
        this.mode = '';
    },

    removeEditMode: function () {
        this._editHandlers(false);
        this.mode = '';
    },

    // add mode
    _moseMove: function (ev) {
        if (this.points) {
			if (!this._chkHolePoint(ev.layerPoint)) {
				return;
			}
           var points = this._getLatLngsArr(),
				latlng = ev.latlng;
            if (ev.originalEvent.ctrlKey) {
				let p = Utils.snapPoint(latlng, this, this._map);
				if (p) latlng = p;
			}
            if (points.length === 1) { this._setPoint(latlng, 1); }

            this._setPoint(latlng, points.length - 1);
			this.toggleTooltip(ev, true, this.lineType ? 'Length' : 'Area');
        }
    },

    _mouseDown: function () {
        this._lastMouseDownTime = Date.now() + 200;
		if (this._map && this._map.contextmenu) { this._map.contextmenu.hide(); }
		if ('hideTooltip' in this._parent) { this._parent.hideTooltip(); }
    },

    _mouseUp: function (ev) {
        var timeStamp = Date.now();
        if (ev.delta || timeStamp < this._lastMouseDownTime) {
            this._lastAddTime = timeStamp + 1000;
			var rTapMouse = ev.originalEvent && ev.originalEvent.which === 3;
			if (!this._chkHolePoint(ev.layerPoint)) {
				this.setEditMode();
				this._pointUp();
				this._fireEvent('drawstop');
				return;
				// rTapMouse = true;
			}

			var _latlngs = this._getLatLngsArr();
			if (rTapMouse
				&& this.points && _latlngs && _latlngs.length) {	// for click right button

				this.setEditMode();
				this._removePoint(_latlngs.length - 1);
				this._pointUp();
				this._fireEvent('drawstop');
				if (this._map && this._map.contextmenu) {
					requestIdleCallback(this._map.contextmenu.enable.bind(this._map.contextmenu), {timeout: 250});
				}
			} else {
				var latlng = ev._latlng || ev.latlng;
				if (ev.delta) { this.addLatLng(latlng, ev.delta); }    // for click on marker
				this.addLatLng(latlng);
			}
			this._parent._parent._clearCreate();
        }
    }
});
// L.GmxDrawing.Ring = Ring;
export default Ring;