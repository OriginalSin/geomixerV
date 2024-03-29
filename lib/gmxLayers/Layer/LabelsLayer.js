import {gmxAPIutils} from '../Utils.js';

/*
 (c) 2014, Sergey Alekseev
 Leaflet.LabelsLayer, plugin for Gemixer layers.
*/
L.LabelsLayer = (L.Layer || L.Class).extend({

    options: {
		animate: false,
		labels: 'default',
        pane: 'overlayPane'
    },

    initialize: function (map, options) {
        L.setOptions(this, L.extend(this.options, options));
        this.__map = map;
        this._observers = {};
        this._styleManagers = {};
        this._labels = {};
        this._labelsIndex = {};
        var _this = this;

        this.bbox = gmxAPIutils.bounds();

        var chkData = function (data, layer) {
            if (!data.added && !data.removed) { return; }

            var opt = layer.options,
                added = map._zoom >= opt.minZoom && map._zoom <= opt.maxZoom ? data.added : [],
                layerId = '_' + layer._leaflet_id,
                gmx = layer._gmx,
                labels = {};

            for (var i = 0, len = added.length; i < len; i++) {
                var item = added[i].item,
                    isPoint = item.type === 'POINT' || item.type === 'MULTIPOINT',
                    currentStyle = item.parsedStyleKeys || item.currentStyle || {};

                if (gmx.styleHook) {
                    var styleExtend = gmx.styleHook(item, gmx.lastHover && item.id === gmx.lastHover.id);
                    if (styleExtend) {
                        currentStyle = L.extend({}, currentStyle, styleExtend);
                    } else {
                        continue;
                    }
                }
                if (item.multiFilters) {
                    for (var j = 0, len1 = item.multiFilters.length; j < len1; j++) {
                        var st = item.multiFilters[j].parsedStyle;
                        if ('labelField' in st || 'labelText' in st) {
                            currentStyle = st;
                            break;
                        }
                    }
                }
                var style = gmx.styleManager.getObjStyle(item) || {},
                    labelText = currentStyle.labelText || style.labelText,
                    labelField = currentStyle.labelField || style.labelField,
                    fieldType = gmx.tileAttributeTypes[labelField],
                    txt = String(labelText || L.gmxUtil.attrToString(fieldType, layer.getPropItem(labelField, item.properties)));

                if (style.labelTemplate) {
					var reg = /\[([^\]]*)\]/g,
						match;
					txt = style.labelTemplate;

					while ((match = reg.exec(style.labelTemplate))) {
						if (match.length === 2) {
							labelField = match[1];
							fieldType = gmx.tileAttributeTypes[labelField];
							var val = L.gmxUtil.attrToString(fieldType, layer.getPropItem(labelField, item.properties));
							txt = txt.replace(match[0], val);
						}
					}
                }
				if (txt || txt === 0) {
                    var fontSize = style.labelFontSize || currentStyle.labelFontSize || 12,
                        id = '_' + item.id,
                        changed = true,
                        width = 0,
						arrTxtWidth,
                        options = item.options,
                        labelStyle = {
                            font: fontSize + 'px "Arial"',
                            labelHaloColor: ('labelHaloColor' in currentStyle ? currentStyle.labelHaloColor : ('labelHaloColor' in style ? style.labelHaloColor : 0xffffff)),
                            labelColor: currentStyle.labelColor || style.labelColor,
                            labelAlign: currentStyle.labelAlign || style.labelAlign,
                            labelAnchor: currentStyle.labelAnchor || style.labelAnchor,
                            labelFontSize: fontSize
                        };
                    if (options) {
                        if (!('center' in options)) {
                            var center = gmxAPIutils.getItemCenter(item, gmx.dataManager.getItemMembers(item.id));
                            if (!center) { continue; }
                            options.center = center;
                        }
                        if (options.label) {
                            width = options.label.width;
                            arrTxtWidth = options.label.arrTxtWidth;
                            var pstyle = options.label.style;
                            changed = options.label.txt !== txt ||
                                pstyle.labelHaloColor !== labelStyle.labelHaloColor ||
                                pstyle.labelColor !== labelStyle.labelColor ||
                                pstyle.labelAlign !== labelStyle.labelAlign ||
                                pstyle.labelAnchor !== labelStyle.labelAnchor ||
                                pstyle.labelFontSize !== labelStyle.labelFontSize;
                        }
                    }
                    if (changed) {
						width = 0;
                        arrTxtWidth = gmxAPIutils.getLabelWidth(txt, labelStyle);
						if (arrTxtWidth) {
						    arrTxtWidth.forEach(function(it) {
								width = Math.max(width, it[1]);
							});
						}

                        if (!width) {
                            delete labels[id];
                            continue;
                        }
                        width += 4;
                        item.options.labelStyle = null;
                    }
                    options.label = {
                        isPoint: isPoint,
                        width: width,
                        sx: style.sx || 0,
                        txt: txt,
                        arrTxtWidth: arrTxtWidth,
                        style: labelStyle
                    };
                    labels[id] = item;
                }
            }
            _this._labelsIndex[layerId] = layer.options.zIndex;
            _this._labels[layerId] = labels;
        };

        var addObserver = function (layer, id) {
            var gmx = layer._gmx,
				dm = gmx.dataManager,
                filters = ['clipFilter', 'clipPointsFilter', 'styleFilter', 'labelFilter', 'userFilter'],
                options = {
                    type: 'resend',
                    bbox: _this.bbox,
                    filters: filters,
                    callback: function(data) {
                        chkData(data, layer);
                        _this.redraw();
                    }
                };
            if (gmx.beginDate && gmx.endDate) {
                options.dateInterval = [gmx.beginDate, gmx.endDate];
            }
            return dm.addObserver(options, '_Labels_' + id);
        };
        this.add = function (layer) {
            var id = layer._leaflet_id,
                gmx = layer._gmx;

            if (!_this._observers[id] && gmx && gmx.labelsLayer && id) {
                gmx.styleManager.promise.then(function () {
                    var observer = addObserver(layer, id),
						_zoom = _this.__map._zoom;
                    if (layer.options.isGeneralized) {
                        observer.targetZoom = _zoom;	//need update to current zoom
                    }
                    if (observer.dateInterval) {
                        layer.on('dateIntervalChanged', function(ev) {
							var dInterval = ev.target.getDateInterval();
							this.setDateInterval(dInterval.beginDate, dInterval.endDate);
						}, observer);
                    }
					if (!gmx.styleManager.isVisibleAtZoom(_zoom)) {
						observer.deactivate();
					}
                    _this._observers[id] = observer;
                    _this._styleManagers[id] = gmx.styleManager;

                    _this._labels['_' + id] = {};
					_this._labelsIndex['_' + id] = {};

                    _this._updateBbox();
                });
            }
        };
        this.remove = function (layer) {
            if (layer) {
				var id = layer._leaflet_id;
				if (_this._observers[id]) {
					var gmx = layer._gmx,
						dataManager = gmx.dataManager;
					dataManager.removeObserver(_this._observers[id].id);
					delete _this._observers[id];
					delete _this._styleManagers[id];
					delete _this._labels['_' + id];
					delete _this._labelsIndex['_' + id];
					_this.redraw();
				}
            }
		};
        // this._layeradd = function (ev) {
			// if (ev.layer._gmx.dataManager) {
				// _this.add(ev.layer);
			// }
        // };
        // this._layerremove = function (ev) {
            // _this.remove(ev.layer);
        // };
    },

    _layeradd: function (ev) {
		var clayer = ev.layer,
			gmx = clayer._gmx;
		if (gmx && gmx.dataManager) {
			this.add(clayer);
		}
   },
    _layerremove: function (ev) {
		var clayer = ev.layer,
			id = clayer._leaflet_id,
			gmx = clayer._gmx;
		if (gmx && gmx.dataManager && this._observers[id]) {
			gmx.dataManager.removeObserver(this._observers[id].id);
			delete this._observers[id];
			delete this._styleManagers[id];
			delete this._labels['_' + id];
			delete this._labelsIndex['_' + id];
			this.redraw();
		}
	},

    redraw: function () {
        if (!this._frame && this.__map && !this.__map._animating) {
            this._frame = L.Util.requestAnimFrame(this._redraw, this);
        }
        return this;
    },

    _addToPane: function () {
        var pane = this.__map.getPanes()[this.options.pane];
        if (pane) {
            pane.insertBefore(this._canvas, pane.firstChild);
        }
    },

    onAdd: function (map) {
        // this._map = map;

        if (!this._canvas) {
            this._initCanvas();
        }
		var arr = window.location.search.match('labels=([^&]+)');
		if (arr) {
			this.options.labels = arr[1];
		}

        // this._addToPane();
        map.on({
            moveend: this._reset,
            zoomstart: this._hideMe,
            layeradd: this._layeradd,
            layerremove: this._layerremove
        }, this);

        this._reset();
    },

    _hideMe: function () {
		this._canvas.style.visibility = 'hidden';
    },

    onRemove: function (map) {
        if (this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }

        map.off({
            moveend: this._reset,
            zoomstart: this._hideMe,
            layeradd: this._layeradd,
            layerremove: this._layerremove
        }, this);
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    _initCanvas: function () {
        var canvas = L.DomUtil.create('canvas', 'leaflet-labels-layer leaflet-layer leaflet-zoom-hide'),
            size = this.__map.getSize();
        canvas.width  = size.x; canvas.height = size.y;
        canvas.style.pointerEvents = 'none';
        this._canvas = canvas;
    },

    _updateBbox: function () {
        var _map = this.__map,
            screenBounds = _map.getBounds(),
            southWest = screenBounds.getSouthWest(),
            northEast = screenBounds.getNorthEast(),
			crs = _map.options.srs == 3857 ? L.CRS.EPSG3857 : L.Projection.Mercator,
            m1 = crs.project(southWest),	// предполагаем что все слои в одной проекции
            m2 = crs.project(northEast),
			_zoom = _map.getZoom();

        this.mInPixel = gmxAPIutils.getPixelScale(_zoom);
        this._ctxShift = [m1.x * this.mInPixel, m2.y * this.mInPixel];
        for (var id in this._observers) {
			var observer = this._observers[id];
			if (observer.targetZoom) {
				observer.targetZoom = _zoom;
			}
            observer.setBounds({
                min: {x: southWest.lng, y: southWest.lat},
                max: {x: northEast.lng, y: northEast.lat}
            });
        }
    },

    _reset: function () {
        this._updateBbox();
        for (var id in this._observers) {
            var observer = this._observers[id];
            if (!observer.isActive() &&
                this._styleManagers[id].isVisibleAtZoom(this.__map.getZoom())
            ) {
                observer.activate();
            }
            observer.fire('update');
        }
		setTimeout(function() {
			this._canvas.style.visibility = '';
		}.bind(this), 200);
    },

    _redraw: function () {
        var out = [],
            _map = this.__map;

		if (!_map || !_map._mapPane) { return; }

        var mapSize = _map.getSize(),
            _canvas = this._canvas,
            chkIntersects = this.options.labels,
            offset = _map.latLngToContainerPoint(_map.getBounds().getNorthWest()),
            topLeft = _map.containerPointToLayerPoint(offset);

		_canvas.width = mapSize.x; _canvas.height = mapSize.y;
        L.DomUtil.setPosition(_canvas, topLeft);

        var w2 = 2 * this.mInPixel * gmxAPIutils.worldWidthMerc,
            start = w2 * Math.floor(_map.getPixelBounds().min.x / w2),
            ctx = _canvas.getContext('2d'),
			arr = Object.keys(this._labels).sort(function(a ,b) { return this._labelsIndex[b] - this._labelsIndex[a]; }.bind(this)),
            i, len, it;

        arr.forEach(function(layerId) {
            var labels = this._labels[layerId];
            for (var id in labels) {
                it = labels[id];
                var options = it.options,
                    label = options.label,
                    style = label.style,
					labelAlign = style.labelAlign || 'center',
                    arrTxtWidth = label.arrTxtWidth,
					count = arrTxtWidth.length || 1,
                    width = label.width,
                    width2 = width / 2,
                    labelFontFamily = style.labelFontFamily || 'Arial',
                    size = style.labelFontSize || 12,
                    size2 = size / 2,
                    center = options.center,
                    pos = [center[0] * this.mInPixel, center[1] * this.mInPixel],
                    isFiltered = false;

                if (label.isPoint) {
                    var delta = label.sx;
                    if (labelAlign === 'left') {
                        pos[0] += width2 + delta;
                    } else if (labelAlign === 'right') {
                        pos[0] -= width + delta;
                    }
                }
                pos[0] -= width2 + this._ctxShift[0];
                pos[1] = -size2 - pos[1] + this._ctxShift[1];
				size2 *= count;
                if (style.labelAnchor) {
                    pos[0] += style.labelAnchor[0];
                    pos[1] += style.labelAnchor[1];
                }

                for (var tx = pos[0] + start; tx < mapSize.x; tx += w2) {
                    var coord = [Math.floor(tx), Math.floor(pos[1])],
                        bbox = gmxAPIutils.bounds([
                            [coord[0], coord[1] - size2],
                            [coord[0] + width, coord[1] + size2]
                        ]);
					if (chkIntersects !== 'All') {
						for (i = 0, len = out.length; i < len; i++) {
							if (bbox.intersects(out[i].bbox)) {
								isFiltered = true;
								break;
							}
						}
						if (isFiltered) { continue; }
					}

                    if (!options.labelStyle) {
                        options.labelStyle = {
                            font: size + 'px "' + labelFontFamily + '"',
                            //font: size + 'px "Arial"',
                            fillStyle: gmxAPIutils.dec2color(style.labelColor || 0, 1),
                            shadowBlur: 4
                        };
                        if (style.labelHaloColor !== -1) {
                            options.labelStyle.strokeStyle =
                            options.labelStyle.shadowColor =
                                gmxAPIutils.dec2color(style.labelHaloColor, 1);
                        }
                    }
                    out.push({
                        arr: it.properties,
                        bbox: bbox,
                        arrTxtWidth: arrTxtWidth,
                        width2: labelAlign === 'center' ? width2 : 0,
                        txt: label.txt,
                        style: options.labelStyle,
                        size: size,
                        coord: coord
                    });
                }
            }
		}.bind(this));

        if (out.length) {
            ctx.clearRect(0, 0, _canvas.width, _canvas.height);
            for (i = 0, len = out.length; i < len; i++) {
                it = out[i];
				it.arrTxtWidth.forEach(function(pt, nm) {
					var coord = [it.coord[0], it.coord[1] + (nm + 1) * it.size];
					gmxAPIutils.setLabel(ctx, pt[0], coord, it.style);
				});
            }
            if (!_canvas.parentNode) { this._addToPane(); }
        } else if (_canvas.parentNode) {
            _canvas.parentNode.removeChild(_canvas);
        }

        this._frame = null;
    },
    _animateZoom: function (e) {
		var scale = this.__map.getZoomScale(e.zoom),
		    offset = this.__map._latLngBoundsToNewLayerBounds(this.__map.getBounds(), e.zoom, e.center).min;
		L.DomUtil.setTransform(this._canvas, offset, scale);
    }
});

L.labelsLayer = function (map, options) {
    return new L.LabelsLayer(map, options);
};

L.Map.addInitHook(function () {
	// Check to see if Labels has already been initialized.
    if (!this._labelsLayer) {
        this._labelsLayer = new L.LabelsLayer(this, this.options);
        this._labelsLayer.addTo(this);
    }
});
