import './Drawing.css';
import Utils from './Utils.js';
import ContextMenu from './ContextMenu.js';
import PointMarkers from './PointMarkers.js';
import Feature from './Feature.js';

const rectDelta = 0.0000001;
const stateVersion = '1.0.0';
const _options = {
	showPointsNum: false,
	type: ''
};

const GmxDrawing = L.Class.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    initialize: function (map, options) {
        this.options = {..._options, ...options};
        this._map = map;
        this.items = [];
        this.current = null;
        this.contextmenu = new ContextMenu({
			contextmenuInheritItems: false,
			// points: [], // [{text: 'Remove point'}, {text: 'Delete feature'}],
			points: [{text: 'Move'}, {text: 'Rotate'}, {text: 'Remove point'}, {text: 'Delete feature'}],	// , {text: 'Rotate around Point'}
			bbox: [{text: 'Save'}, {text: 'Cancel'}],
			fill: [{text: 'Rotate'}, {text: 'Move'}]
		});
        if (!L.gmxLocale) {
			L.gmxLocale = {
				getText: function(key) {
					let rus = Utils.locales[window.language] || {};
					let out = rus[key];
					if (!out) {
						let arr = key.split('.');
						out = (rus[arr[0]] || {})[arr[1]] || arr[1];
					}
					return out || key;
				}
				// getLanguage: function() { return window.language; }
			};
		}

        if (L.gmxUtil && L.gmxUtil.prettifyDistance) {
			var svgNS = 'http://www.w3.org/2000/svg';
			var tooltip = document.createElementNS(svgNS, 'g');
            L.DomUtil.addClass(tooltip, 'gmxTooltip');
            var bg = document.createElementNS(svgNS, 'rect');
            bg.setAttributeNS(null, 'rx', 4);
            bg.setAttributeNS(null, 'ry', 4);
            bg.setAttributeNS(null, 'height', 16);
            L.DomUtil.addClass(bg, 'gmxTooltipBG');

            var text = document.createElementNS(svgNS, 'text');
            var userSelectProperty = L.DomUtil.testProp(
                ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
            text.style[userSelectProperty] = 'none';
            tooltip.appendChild(bg);
            tooltip.appendChild(text);

            this.hideTooltip = function() {
                tooltip.setAttributeNS(null, 'visibility', 'hidden');
            };
			this.showTooltip = function(point, mouseovertext) {
				const svgCont = this._map._pathRoot || this._map._renderer._container;
                var x = point.x + 11,
                    y = point.y - 14;
                text.setAttributeNS(null, 'x', x);
                text.setAttributeNS(null, 'y', y);
                text.textContent = mouseovertext;
                if (tooltip.getAttributeNS(null, 'visibility') !== 'visible') {
                    svgCont.appendChild(tooltip);
                    tooltip.setAttributeNS(null, 'visibility', 'visible');
                }
                var length = text.getComputedTextLength();
                bg.setAttributeNS(null, 'width', length + 8);
                bg.setAttributeNS(null, 'x', x - 4);
                bg.setAttributeNS(null, 'y', y - 12);
            };
        }
        this.on('drawstop drawstart', function (ev) {
            this.drawMode = this._drawMode = ev.mode;
			this._map.doubleClickZoom[this.drawMode === 'edit' ? 'disable' : 'enable']();
        }, this);
    },

    bringToFront: function () {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item._map && 'bringToFront' in item) { item.bringToFront(); }
        }
    },

    addGeoJSON: function (obj, options) {
        var arr = [],
            isLGeoJSON = obj instanceof L.GeoJSON;
        if (!isLGeoJSON) {
            obj = L.geoJson(obj, options);
        }
        if (obj instanceof L.GeoJSON) {
            var layers = obj.getLayers();
            if (layers) {
                var parseLayer = function (it) {
                    var _originalStyle = null;
                    if (it.setStyle && options && options.lineStyle) {
                        _originalStyle = {};
                        for (var key in options.lineStyle) {
                            _originalStyle[key] = options.lineStyle[key];
                        }
                        it.setStyle(options.lineStyle);
                    }
                    var f = this.add(it, options);
                    f._originalStyle = _originalStyle;
                    arr.push(f);
                };
                for (var i = 0, len = layers.length; i < len; i++) {
                    var layer = layers[i];

                    if (layer.feature.geometry.type !== 'GeometryCollection') {
                        layer = L.layerGroup([layer]);
                    }
                    layer.eachLayer(parseLayer, this);
                }
            }
        }
        return arr;
    },

    add: function (obj, options) {
        var item = null;
		options = options || {};
        if (obj) {
            if (obj instanceof Feature) {
                item = obj;
            } else {
                var calcOptions = {};
				if (obj.feature && obj.feature.geometry) {
					var type = obj.feature.geometry.type;
					if (type === 'Point') {
						obj = new L.Marker(obj._latlng);
					} else if (type === 'MultiPolygon') {
						calcOptions.type = type;
					} else if (type === 'MultiLineString') {
						calcOptions.type = 'MultiPolyline';
					}
				}
                if (!options || !('editable' in options)) { calcOptions.editable = true; }
                if (obj.geometry)     { calcOptions.type = obj.geometry.type; }
                else if (obj instanceof L.Rectangle)     { calcOptions.type = 'Rectangle'; }
                else if (L.MultiPolygon && obj instanceof L.MultiPolygon)  { calcOptions.type = 'MultiPolygon'; }
                else if (obj instanceof L.Polygon)  { calcOptions.type = calcOptions.type || 'Polygon'; }
                else if (obj instanceof L.Polyline && !calcOptions.type) { calcOptions.type = 'Polyline'; }
                else if (obj.setIcon || obj instanceof L.Marker) {
                    calcOptions.type = 'Point'; calcOptions.editable = false;
                    obj.options.draggable = true;
                }
                options = this._chkDrawOptions(calcOptions.type, options);
                L.extend(options, calcOptions);
                if (obj.geometry) {
                    var iconStyle = options.markerStyle && options.markerStyle.iconStyle;
                    if (options.type === 'Point' &&
                        !options.pointToLayer &&
                        iconStyle
                    ) {
                        options.icon = L.icon(iconStyle);
                        options.pointToLayer = function (geojson, latlng) {
                             return new L.Marker(latlng, options);
                        };
                    }
                    return this.addGeoJSON(obj, options);
                }
                item = new Feature(this, obj, options);
            }
            if (!('map' in options)) { options.map = true; }
            if (options.map && !item._map && this._map) { this._map.addLayer(item); }
            else { this._addItem(item); }
            //if (!item._map) this._map.addLayer(item);
            //if (item.points) item.points._path.setAttribute('fill-rule', 'inherit');
            if ('setEditMode' in item) { item.setEditMode(); }
        }
        return item;
    },

    _disableDrag: function () {
		if (this._map) {
			this._map.dragging.disable();
			L.DomUtil.disableTextSelection();
			L.DomUtil.disableImageDrag();
			this._map.doubleClickZoom.removeHooks();
		}
    },

    _enableDrag: function () {
		if (this._map) {
			this._map.dragging.enable();
			L.DomUtil.enableTextSelection();
			L.DomUtil.enableImageDrag();
			this._map.doubleClickZoom.addHooks();
		}
    },

    clearCreate: function () {
		this._clearCreate();
    },

    _clearCreate: function () {
       if (this._map) this._map._container.style.cursor = '';
        if (this._createKey && this._map) {
            if (this._createKey.type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.off(this._map._container, 'touchstart', this._createKey.fn, this);
            } else {
                this._map.off(this._createKey.eventName, this._createKey.fn, this);
                this._map.off('mousemove', this._onMouseMove, this);
            }
            this._enableDrag();
        }
		if (this._firstPoint) {
			this._map.removeLayer(this._firstPoint);
			this._firstPoint = null;
		}

        this._createKey = null;
    },

    _chkDrawOptions: function (type, drawOptions) {
        var defaultStyles = Utils.defaultStyles,
            resultStyles = {};
        if (!drawOptions) {
            drawOptions = L.extend({}, defaultStyles);
        }
        if (type === 'Point') {
            L.extend(resultStyles, defaultStyles.markerStyle.options.icon, drawOptions);
        } else {
            L.extend(resultStyles, drawOptions);
            resultStyles.lineStyle = L.extend({}, defaultStyles.lineStyle, drawOptions.lineStyle);
            resultStyles.pointStyle = L.extend({}, defaultStyles.pointStyle, drawOptions.pointStyle);
            resultStyles.holeStyle = L.extend({}, defaultStyles.holeStyle, drawOptions.holeStyle);
        }

        if (resultStyles.iconUrl) {
            var iconStyle = {
                iconUrl: resultStyles.iconUrl
            };
            delete resultStyles.iconUrl;
            if (resultStyles.iconAnchor) {
                iconStyle.iconAnchor = resultStyles.iconAnchor;
                delete resultStyles.iconAnchor;
            }
            if (resultStyles.iconSize) {
                iconStyle.iconSize = resultStyles.iconSize;
                delete resultStyles.iconSize;
            }
            if (resultStyles.popupAnchor) {
                iconStyle.popupAnchor = resultStyles.popupAnchor;
                delete resultStyles.popupAnchor;
            }
            if (resultStyles.shadowSize) {
                iconStyle.shadowSize = resultStyles.shadowSize;
                delete resultStyles.shadowSize;
            }
            resultStyles.markerStyle = {
                iconStyle: iconStyle
            };
        }
        return resultStyles;
    },

    create: function (type, options) {
        this._clearCreate(null);
        if (type && this._map) {
            var map = this._map,
                drawOptions = this._chkDrawOptions(type, options),
                my = this;

            if (type === 'Rectangle') {
                //map._initPathRoot();
                map.dragging.disable();
            }
			map._container.style.cursor = 'copy';
			// var cont = map._container.style()

            this._createKey = {
                type: type,
                eventName: type === 'Rectangle' ? (L.Browser.mobile ? 'touchstart' : 'mousedown') : 'click',
                fn: function (ev) {
                    var opt = {};
					if (drawOptions.hole && options.forRing) {
						opt.forRing = options.forRing;
						let points = options.forRing.points._rings[0];
						if (points && !Utils.isPointInRing(ev.layerPoint, points)) {
							return false;
						}
					}
					var originalEvent = ev && ev.originalEvent,
                        ctrlKey = false, shiftKey = false, altKey = false;
					if (originalEvent) {
                        ctrlKey = originalEvent.ctrlKey;
                        shiftKey = originalEvent.shiftKey;
                        altKey = originalEvent.altKey;
						var clickOnTag = originalEvent.target.tagName;
						if (clickOnTag === 'g' || clickOnTag === 'path') { return; }
					}
                    my._createType = '';
                    var obj, key,
                        latlng = ev.latlng;
                    if (this.options.showPointsNum) {
						opt.showPointsNum = this.options.showPointsNum;
					}

                    for (key in drawOptions) {
                        if (!(key in Utils.defaultStyles)) {
                            opt[key] = drawOptions[key];
                        }
                    }
					if (ctrlKey && my._firstPoint && my._firstPoint._snaped) {
						latlng = my._firstPoint._snaped;
					}

                    if (type === 'Point') {
                        var markerStyle = drawOptions.markerStyle || {},
                            markerOpt = {
                                draggable: true
                            };
                        if (originalEvent) {
                            markerOpt.ctrlKey = ctrlKey;
                            markerOpt.shiftKey = shiftKey;
                            markerOpt.altKey = altKey;
                        }
                        if (markerStyle.iconStyle) {
                            markerOpt.icon = L.icon(markerStyle.iconStyle);
                        }
                        obj = my.add(new L.Marker(latlng, markerOpt), opt);
                    } else {
                        if (drawOptions.pointStyle) { opt.pointStyle = drawOptions.pointStyle; }
                        if (drawOptions.lineStyle) { opt.lineStyle = drawOptions.lineStyle; }
						if (type === 'Rectangle') {
                            // if (L.Browser.mobile) {
                                // var downAttr = Utils.getDownType.call(my, ev, my._map);
                                // latlng = downAttr.latlng;
                            // }
                            opt.mode = 'edit';
                            obj = my.add(
                                L.rectangle(L.latLngBounds(L.latLng(latlng.lat + rectDelta, latlng.lng - rectDelta), latlng))
                            , opt);
                            if (L.Browser.mobile) { obj._startTouchMove(ev, true); }
                            else { obj._pointDown(ev); }

                            obj.rings[0].ring._drawstop = true;
                        } else if (type === 'Polygon') {
                            opt.mode = 'add';
                            obj = my.add(L.polygon([latlng]), opt);
                            obj.setAddMode();
                        } else if (type === 'Polyline') {
                            opt.mode = 'add';
                            obj = my.add(L.polyline([latlng]), opt).setAddMode();
                        }
                    }
                    my._clearCreate();
                }
            };
            if (type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.on(map._container, 'touchstart', this._createKey.fn, this);
            } else {
                map.on(this._createKey.eventName, this._createKey.fn, this);
                map.on('mousemove', this._onMouseMove, this);
            }
            this._createType = type;
            L.DomUtil.addClass(map._mapPane, 'leaflet-clickable');
            this.fire('drawstart', {mode: type});
        }
        this.options.type = type;
    },

    _onMouseMove: function (ev) {
		var latlngs = [ev.latlng];

		if (!this._firstPoint) {
			this._firstPoint = new PointMarkers(latlngs, {interactive: false});
			this._map.addLayer(this._firstPoint);
		} else {
			this._firstPoint.setLatLngs(latlngs);
		}
    },

    extendDefaultStyles: function (drawOptions) {
        var defaultStyles = Utils.defaultStyles;
        drawOptions = drawOptions || {};
        if (drawOptions.iconUrl) {
            var iconStyle = defaultStyles.markerStyle.options.icon;
            iconStyle.iconUrl = drawOptions.iconUrl;
            delete drawOptions.iconUrl;
            if (drawOptions.iconAnchor) {
                iconStyle.iconAnchor = drawOptions.iconAnchor;
                delete drawOptions.iconAnchor;
            }
            if (drawOptions.iconSize) {
                iconStyle.iconSize = drawOptions.iconSize;
                delete drawOptions.iconSize;
            }
            if (drawOptions.popupAnchor) {
                iconStyle.popupAnchor = drawOptions.popupAnchor;
                delete drawOptions.popupAnchor;
            }
            if (drawOptions.shadowSize) {
                iconStyle.shadowSize = drawOptions.shadowSize;
                delete drawOptions.shadowSize;
            }
        }
        if (drawOptions.lineStyle) {
            L.extend(defaultStyles.lineStyle, drawOptions.lineStyle);
            delete drawOptions.lineStyle;
        }
        if (drawOptions.pointStyle) {
            L.extend(defaultStyles.pointStyle, drawOptions.pointStyle);
            delete drawOptions.pointStyle;
        }
        if (drawOptions.holeStyle) {
            L.extend(defaultStyles.holeStyle, drawOptions.holeStyle);
            delete drawOptions.holeStyle;
        }
        L.extend(defaultStyles, drawOptions);
        return this;
    },

    getFeatures: function () {
        var out = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            out.push(this.items[i]);
        }
        return out;
    },

    loadState: function (data) {
        //if (data.version !== stateVersion) return;

        var _this = this,
            featureCollection = data.featureCollection;
        L.geoJson(featureCollection, {
            onEachFeature: function (feature, layer) {
                var options = feature.properties,
                    popupOpened = options.popupOpened;
                if (options.type === 'Rectangle') {
                    layer = L.rectangle(layer.getBounds());
                } else if (options.type === 'Point') {
                    options = options.options;
                    var icon = options.icon;
                    if (icon) {
                        delete options.icon;
                        if (icon.iconUrl) { options.icon = L.icon(icon); }
                    }
                    layer = L.marker(layer.getLatLng(), options);
                }
                if (layer.setStyle && options && options.lineStyle) {
                    layer.setStyle(options.lineStyle);
                }
                _this.add(layer, options);
                if (popupOpened) {
                    layer.openPopup();
                }
            }
        });
    },

    saveState: function () {
        var featureGroup = L.featureGroup();
        var points = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it.options.type === 'Point') {
                var geojson = it.toGeoJSON();
                geojson.properties = Utils.getNotDefaults(it.options, Utils.defaultStyles.markerStyle);
                if (!it._map) { geojson.properties.map = false; }
                else if (it._map.hasLayer(it.getPopup())) {
                    geojson.properties.popupOpened = true;
                }
                var res = Utils.getNotDefaults(it._obj.options, Utils.defaultStyles.markerStyle.options);
                if (Object.keys(res).length) { geojson.properties.options = res; }
                res = Utils.getNotDefaults(it._obj.options.icon.options, Utils.defaultStyles.markerStyle.options.icon);
                if (Object.keys(res).length) {
                    if (!geojson.properties.options) { geojson.properties.options = {}; }
                    geojson.properties.options.icon = res;
                }
                points.push(geojson);
            } else {
                featureGroup.addLayer(it);
            }
        }
        var featureCollection = featureGroup.toGeoJSON();
        featureCollection.features = featureCollection.features.concat(points);
        return {
            version: stateVersion,
            featureCollection: featureCollection
        };
    },

    _addItem: function (item) {
        var addFlag = true;
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it === item) {
                addFlag = false;
                break;
            }
        }
        if (addFlag) { this.items.push(item); }
        this.fire('add', {mode: item.mode, object: item});
    },

    _removeItem: function (obj, remove) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item === obj) {
                if (remove) {
                    this.items.splice(i, 1);
                    var ev = {type: item.options.type, mode: item.mode, object: item};
                    this.fire('remove', ev);
                    item.fire('remove', ev);
                }
                return item;
            }
        }
        return null;
    },

    clear: function () {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item) {
				if (item._map) {
					item._map.removeLayer(item);
				}
				var ev = {type: item.options.type, mode: item.mode, object: item};
				this.fire('remove', ev);
				item.fire('remove', ev);
			}
        }
        this.items = [];
        return this;
    },

    remove: function (obj) {
        var item = this._removeItem(obj, true);
        if (item && item._map) {
            item._map.removeLayer(item);
        }
        return item;
    }
});
L.gmx = L.gmx || {};

L.Map.addInitHook(function () {
	L.gmx.gmxDrawing = new GmxDrawing(this);
    this.gmxDrawing = L.gmx.gmxDrawing;
});

export default GmxDrawing;