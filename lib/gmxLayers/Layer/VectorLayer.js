import {gmxAPIutils} from '../Utils.js';
import ScreenVectorTile from './ScreenVectorTile.js';

var VectorGridLayer = L.GridLayer.extend({
	_animateZoom: function (e) {
		this.options.updateWhenZooming = false;
		this._setView(e.center, e.zoom, true, true);
	},

	_setZoomTransform: function (level, center, zoom) {	// Add by Geomixer (for cache levels transform)
		var key = level.zoom + '_' + zoom + '_' + level.origin.x + '_' + level.origin.y,
			cache = L.gmx._zoomLevelsCache[key] || {},
			translate = cache.translate,
			scale = cache.scale;
		if (!translate) {
			scale = this._map.getZoomScale(zoom, level.zoom);
			translate = level.origin.multiplyBy(scale).subtract(this._map._getNewPixelOrigin(center, zoom))._round();
			L.gmx._zoomLevelsCache[key] = {translate: translate, scale: scale};
		}
		if (L.Browser.any3d) {
			L.DomUtil.setTransform(level.el, translate, scale);
		} else {
			L.DomUtil.setPosition(level.el, translate);
		}
	},
	_clearOldLevels: function (z) {
		if (this._map) {
			z = z || this._map.getZoom();
			for (var key in this._levels) {
				var el = this._levels[key].el,
					zz = Number(key);
				if (zz !== z) {
					L.DomUtil.remove(el);
					this._removeTilesAtZoom(zz);
					this._onRemoveLevel(zz);
					delete this._levels[key];
				}
			}
		}
	},
	_noTilesToLoad: function () {
		var zoom = this._tileZoom || this._map.getZoom();
		for (var key in this._tiles) {
			if (this._tiles[key].coords.z === zoom && !this._tiles[key].loaded) { return false; }
		}
		return true;
	},

	_tileReady: function (coords, err, tile) {
		if (!this._map) { return; }				// Add by Geomixer (нет возможности отключения fade-anim)

		if (err) {
			// @event tileerror: TileErrorEvent
			// Fired when there is an error loading a tile.
			this.fire('tileerror', {
				error: err,
				tile: tile,
				coords: coords
			});
		}

		var key = this._tileCoordsToKey(coords);

		tile = this._tiles[key];
		if (!tile) { return; }

		tile.loaded = +new Date();

		if (!err) {
			L.DomUtil.addClass(tile.el, 'leaflet-tile-loaded');
			this.fire('tileload', {		// @event tileload: TileEvent // Fired when a tile loads.
				tile: tile.el,
				coords: coords
			});
		}

		if (this._noTilesToLoad()) {
			this._loading = false;
			this._clearOldLevels(this._tileZoom);
			this.fire('load');			// @event load: Event // Fired when the grid layer loaded all visible tiles.
		}
	},
	//////////////////
	_updateLevels: function () {		// Add by Geomixer (coords.z is Number however _levels keys is String)

		var zoom = this._tileZoom,
			map = this._map;
			// ,
		    // maxZoom = this.options.maxZoom;

		if (zoom === undefined) { return undefined; }

		for (var z in this._levels) {
			var delta = zoom - z;
			if (delta === 0) {
				this._levels[z].origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
				this._onUpdateLevel(zoom);
			}
		}

		var level = this._levels[zoom];

		if (!level) {
			level = this._levels[zoom] = {};

			level.el = L.DomUtil.create('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);

			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
			level.zoom = zoom;

			this._setZoomTransform(level, map.getCenter(), map.getZoom());

			// force the browser to consider the newly added element for transition
			// L.Util.falseFn(level.el.offsetWidth);

			this._onCreateLevel(level);
		}

		this._level = level;

		return level;
	},

	_update: function (center) {				// Add by Geomixer (для события update _tiles + не добавлять пустые тайлы)
		var map = this._map;
		if (!map) { return; }
		var zoom = this._clampZoom(map.getZoom());

		if (center === undefined) { center = map.getCenter(); }
		if (this._tileZoom === undefined) { return; }	// if out of minzoom/maxzoom

		var pixelBounds = this._getTiledPixelBounds(center),
		    tileRange = this._pxBoundsToTileRange(pixelBounds),
		    tileCenter = tileRange.getCenter(),
		    queue = [],
		    margin = this.options.keepBuffer,
		    noPruneRange = new L.Bounds(tileRange.getBottomLeft().subtract([margin, -margin]),
		                              tileRange.getTopRight().add([margin, -margin]));

		// Sanity check: panic if the tile range contains Infinity somewhere.
		if (!(isFinite(tileRange.min.x) &&
		      isFinite(tileRange.min.y) &&
		      isFinite(tileRange.max.x) &&
		      isFinite(tileRange.max.y))) { throw new Error('Attempted to load an infinite number of tiles'); }

		for (var key in this._tiles) {
			var c = this._tiles[key].coords;
			if (c.z !== this._tileZoom || !noPruneRange.contains(new L.Point(c.x, c.y))) {
				this._tiles[key].current = false;
			}
		}

		// _update just loads more tiles. If the tile zoom level differs too much
		// from the map's, let _setView reset levels and prune old tiles.
		if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

		// create a queue of coordinates to load tiles from
		for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
			for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
				var coords = new L.Point(i, j);
				coords.z = this._tileZoom;

				if (!this._isValidTile(coords)) { continue; }

				var tile = this._tiles[this._tileCoordsToKey(coords)];
				if (tile) {
					tile.current = true;
					// if (tile.el.parentNode !== this._level.el) {
						// this._level.el.appendChild(tile.el);
					// }
				} else {
					queue.push(coords);
				}
			}
		}

		// sort tile queue to load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
		});

		if (queue.length !== 0) {
			// if it's the first batch of tiles to load
			if (!this._loading) {
				this._loading = true;
				// @event loading: Event
				// Fired when the grid layer starts loading tiles.
				this.fire('loading');
			}

			// create DOM fragment to append tiles in one batch
			var fragment = document.createDocumentFragment();

			for (i = 0; i < queue.length; i++) {
				this._addTile(queue[i], fragment);
			}

			// if (!(this instanceof L.gmx.VectorLayer)) {
				// this._level.el.appendChild(fragment);
			// }
		}
		this.fire('update');
	}
});

L.gmx.VectorLayer = VectorGridLayer.extend({
    options: {
		tilesCRS: L.CRS.EPSG3395,
        openPopups: [],
		className: 'vector-tiles',
        minZoom: 1,
        zIndexOffset: 0,
        isGeneralized: true,
        isFlatten: false,
        useWebGL: false,
		skipTiles: 'All', // All, NotVisible, None
        iconsUrlReplace: [],
        cacheRasters: true,
        cacheQuicklooks: true,
        clearCacheOnLoad: true,
        showScreenTiles: false,
		updateWhenZooming: false,
		// bubblingMouseEvents: false,
		keepBuffer: 0,
        clickable: true
    },

	// extended from L.GridLayer
    initialize: function(options) {
        // options = L.setOptions(this, L.extend(this.options, options));
        options = L.setOptions(this, options);

        this._initPromise = new Promise(function(resolve, reject) {
			this._resolve = resolve;
			this._reject = reject;
		}.bind(this));

        this.repaintObservers = {};    // external observers like screen

        this._gmx = {
            hostName: gmxAPIutils.normalizeHostname(options.hostName || 'maps.kosmosnimki.ru'),
            mapName: options.mapID,
			gmxEndPoints: options.gmxEndPoints,
			sessionKey: this.options.sessionKey,
			iconsUrlReplace: this.options.iconsUrlReplace,
			showScreenTiles: this.options.showScreenTiles,
            skipTiles: options.skipTiles,
            needBbox: options.skipTiles === 'All',
            useWebGL: options.useWebGL,
			srs: options.srs || '',
            layerID: options.layerID,
            beginDate: options.beginDate,
            endDate: options.endDate,
            sortItems: options.sortItems || null,
            styles: options.styles || [],
            shiftXlayer: 0,
            shiftYlayer: 0,
            renderHooks: [],
            preRenderHooks: [],
            _needPopups: {}
        };
		if (/\buseWebGL=1\b/.test(location.search)) {
			this._gmx.useWebGL = true;
		}
        if (options.cacheQuicklooks) {			// cache quicklooks for CR
            this._gmx.quicklooksCache = {};
        }
        if (options.cacheRasters) {				// cache rasters for CR
            this._gmx.rastersCache = {};
        }
        if (options.crossOrigin) {
            this._gmx.crossOrigin = options.crossOrigin;
        }
        if (('multiPopup' in window) && !('multiPopup' in options)) {
            this.options.multiPopup = window.multiPopup;
        }
	},

    _onCreateLevel: function(level) {
		this._updateShiftY(level.zoom);
		//console.log('_onCreateLevel ', level);
    },

	_initContainer: function () {
		if (this._container) { return; }

		var classNames = ['leaflet-layer'];
		if (this.options.className) { classNames.push(this.options.className); }

		this._container = L.DomUtil.create('div', classNames.join(' '));
		if (this.options.clickable === false) {
			this._container.style.pointerEvents = 'none';
		}
		this._updateZIndex();

		this.getPane(this.options.pane).appendChild(this._container);
	},

    _onVersionChange: function () {
		this._updateProperties(this._gmx.rawProperties);
		this._chkTiles(true);
    },

	_waitCheckOldLevels: function () {
		if (this._oldLevelsTimer) { clearTimeout(this._oldLevelsTimer); }
		this._oldLevelsTimer = setTimeout(this._chkOldLevels.bind(this), 250);
    },

	_chkOldLevels: function () {
		if (!this._map) {return;}
		var zoom = this._map._zoom,
			key, tile;

		for (key in this._tiles) {
			tile = this._tiles[key];
			if (tile.coords.z === zoom && !tile.loaded) {
				return;
			}
		}
		this._loading = false;
		this._clearOldLevels(zoom);
		this.fire('load');			// @event load: Event // Fired when the grid layer loaded all visible tiles.
	},

	_waitOnMoveEnd: function () {
		if (this._onmoveendTimer) { clearTimeout(this._onmoveendTimer); }
		this._onmoveendTimer = setTimeout(this._chkTiles.bind(this), 250);
    },

	_chkCurrentTiles: function () {
		if (!this._map) {return;}
		// console.log('_onmoveend ', this._tileZoom, this._loading, this._noTilesToLoad(), this._tileZoom, Date.now());
		var zoom = this._tileZoom || this._map._zoom,
			key, tile;

		for (key in this._tiles) {
			tile = this._tiles[key];
			if (tile.coords.z === zoom) {
				L.DomUtil.setPosition(tile.el, this._getTilePos(tile.coords));	// позиции тайлов
				if (!tile.promise) {							// данный тайл еще не рисовался
					this.__drawTile(tile);
				}
			}
		}
    },

	_chkTiles: function (flag) {
		this._chkCurrentTiles();
		if (flag) { this.repaint(); }
		this._waitCheckOldLevels();
	},

	// _removeScreenObservers: function (z, flag) {
        // if (this._gmx && this._gmx.dataManager) {
			// var dm = this._gmx.dataManager;
			// dm.removeScreenObservers(z);
			// if (flag) {
				// dm.fire('moveend');
			// }
		// }
	// },

	// _onMoveEnd: function () {
		// if (!this._map || this._map._animatingZoom) { return; }
//console.log('_onMoveEnd', arguments)
		// requestIdleCallback(function () {
			// this._update();
		// }.bind(this), {timeout: 0});
		//this._update();
	// },

	_getEvents: function () {
		var events = L.GridLayer.prototype.getEvents.call(this);
		L.extend(events, {
			// zoomanim: function(ev) {
				//this._setZoomTransforms(ev.center, ev.zoom);
			// }
			// beforezoomanim: function(ev) {
				// this._setZoomTransforms(ev.center, ev.zoom);
			// }

			// zoomstart: function() {
				// console.log('zoomstart', this._map._zoom, this._gmx.layerID, arguments);
				// this._gmx.zoomstart = true;
				// this._removeScreenObservers();
			// }
			//,
			// zoomanim: function(ev) {
				// this._setZoomTransforms(ev.center, ev.zoom);
				// this._gmx.zoomstart = true;
			// },
			// zoomend: function() {
				//this._gmx.zoomstart = false;
				// this._drawDoneObjectsCount = this._drawnObjectsCount;
				// this._drawnObjectsCount = 0;
			// }
		});
        var gmx = this._gmx;
        var owner = {
			dateIntervalChanged: function() {
				this._chkTiles(true);
				if (L.gmx.sendCmd) {
					var interval = gmx.dataManager.getMaxDateInterval();
					L.gmx.sendCmd('dateIntervalChanged', {
						layerID: gmx.layerID,
						mapID: gmx.mapName,
						hostName: gmx.hostName,
						dInterval: [Math.floor(interval.beginDate.getTime() / 1000), Math.floor(interval.endDate.getTime() / 1000)]
					});
				}
			},
			// load: function() {				// Fired when the grid layer starts loading tiles.
				// console.log('load layer ', this._tileZoom, this._map._zoom, Date.now() - window.startTest)
				// this._clearOldLevels(this._tileZoom);
				// if (this._onloadTimer) { clearTimeout(this._onloadTimer); }
				// this._onloadTimer = setTimeout(L.bind(this.repaint, this), 150);
			// },

			tileloadstart: function(ev) {				// тайл (ev.coords) загружается
				var key = ev.key || this._tileCoordsToKey(ev.coords),
					tLink = this._tiles[key];

				tLink.loaded = 0;
			},
			stylechange: function() {
				// var gmx = this._gmx;
				if (!gmx.balloonEnable && this._popup) {
					this.unbindPopup();
				} else if (gmx.balloonEnable && !this._popup) {
					this.bindPopup('');
				}
				if (this._map) {
					if (this.options.minZoom !== gmx.styleManager.minZoom || this.options.maxZoom !== gmx.styleManager.maxZoom) {
						this.options.minZoom = gmx.styleManager.minZoom;
						this.options.maxZoom = gmx.styleManager.maxZoom;
						this._resetView();
						// this._map._updateZoomLevels();
					}
					if (gmx.labelsLayer) {
						this._map._labelsLayer.add(this);
					} else if (!gmx.labelsLayer) {
						this._map._labelsLayer.remove(this);
					}
					// this.repaint();
					this._chkTiles(true);
				}
			},
			versionchange: this._onVersionChange
		};
		events.moveend = this._waitOnMoveEnd.bind(this);
		events.zoomend = function () {
			this._chkTiles(true);
		};

		return {
			map: events,
			owner: owner
		};
	},

	beforeAdd: function(map) {
		this._updateShiftY(map.getZoom());
        L.GridLayer.prototype.beforeAdd.call(this, map);
		this._map = map;
		this._drawnObjectsCount = 0;
    },

    onAdd: function(map) {
		map = map || this._map;
        if (map.options.crs !== L.CRS.EPSG3857 && map.options.crs !== L.CRS.EPSG3395) {
            throw 'GeoMixer-Leaflet: map projection is incompatible with GeoMixer layer';
        }
		this.beforeAdd(map);

        var gmx = this._gmx;

		this.options.tilesCRS = gmx.srs == 3857 ? L.CRS.EPSG3857 : L.CRS.EPSG3395;
        gmx.shiftY = 0;
        gmx.applyShift = map.options.crs === L.CRS.EPSG3857 && gmx.srs != 3857;
        gmx.currentZoom = map.getZoom();
		this._levels = {}; // need init before styles promise resolved
		this._tiles = {};
		this._initContainer();

		gmx.styleManager.initStyles().then(function () {
			if (gmx.balloonEnable && !this._popup) { this.bindPopup(''); }

			if (this._map) {
				var events = this._getEvents();
				map.on(events.map, this);
				this.on(events.owner, this);
				this.once('remove', function () {
					map.off(events.map, this);
					this.off(events.owner, this);
				}, this);

				L.gmx._zoomLevelsCache = {};
				this._invalidateAll();
				this._resetView();
				gmx.dataManager.fire('moveend');

				this._chkTiles(true);
				L.gmx.layersVersion.add(this);
			}
			// this._addLayerVersion();
			this.fire('add');
		}.bind(this));
   },

    onRemove: function(map) {
        var gmx = this._gmx,
			dm = gmx.dataManager;

		// if (gmx.labelsLayer) {	// удалить из labelsLayer
			// map._labelsLayer.remove(this);
		// }
		this._invalidateAll();

		gmx.badTiles = {};
        gmx.quicklooksCache = {};
        gmx.rastersCache = {};
        delete gmx.map;
		if (dm && !dm.getActiveObserversCount()) {
			L.gmx.layersVersion.remove(this);
        }
        if (this._map) {
			L.GridLayer.prototype.onRemove.call(this, map);
		}
        this._map = null;
        this.fire('remove');
    },
	removeBadTiles: function () {
		this._gmx.badTiles = {};
    },
	_removeTile: function (key) {
		if (!this._map || this._map._animatingZoom) { return; }
        if (this._gmx && this._gmx.dataManager) {
			this._gmx.dataManager.removeObserver(key);		// TODO: про active
		}
        L.GridLayer.prototype._removeTile.call(this, key);
	},

    _updateZIndex: function () {
        if (this._container) {
            var options = this.options,
                zIndex = options.zIndex || 0,
                zIndexOffset = options.zIndexOffset || 0;

           this._container.style.zIndex = zIndexOffset + zIndex;
        }
	   this.fire('zindexupdated')
	},

/*eslint-disable no-unused-vars */
	createTile: function(coords , done) {
		//this._test = [coords, done];
		var tile = L.DomUtil.create('canvas', 'leaflet-tile');
		var size = this.getTileSize();
		tile.width = tile.height = 0;
		tile.style.width = size.x + 'px';
		tile.style.height = size.y + 'px';
		tile.onselectstart = L.Util.falseFn;
		tile.onmousemove = L.Util.falseFn;

		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.android && !L.Browser.android23) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		// tile.setAttribute('role', 'presentation');

		// tile.style.opacity = this.options.opacity;
		return tile;
    },
/*eslint-enable */

    //block: public interface
    initFromDescription: function(ph) {
        var gmx = this._gmx;

        gmx.properties = ph.properties;
        gmx.geometry = ph.geometry;

        if (gmx.properties._initDone) {    // need delete tiles key
            delete gmx.properties[gmx.properties.Temporal ? 'TemporalTiles' : 'tiles'];
        }
        gmx.properties._initDone = true;

        if (!gmx.geometry) {
            var worldSize = gmxAPIutils.tileSizes[1];
            gmx.geometry = {
                type: 'POLYGON',
                coordinates: [[[-worldSize, -worldSize], [-worldSize, worldSize], [worldSize, worldSize], [worldSize, -worldSize], [-worldSize, -worldSize]]]
            };
        }

        // Original properties from the server.
        // Descendant classes can override this property
        // Not so good solution, but it works
        gmx.rawProperties = ph.rawProperties || ph.properties;

        this._updateProperties(ph.properties);
        if (gmx.rawProperties.type === 'Vector') {
			ph.properties.srs = gmx.srs = 3857;
			gmx.RasterSRS = Number(gmx.rawProperties.RasterSRS) || 3857;
        // } else if (gmx.rawProperties.RasterSRS) {
			// ph.properties.srs = gmx.srs = Number(gmx.rawProperties.RasterSRS);
		}

        ph.properties.sessionKey = ph.properties.sessionKey || gmx.sessionKey || '';
        ph.properties.needBbox = gmx.needBbox;
        ph.properties.isGeneralized = this.options.isGeneralized;
        ph.properties.isFlatten = this.options.isFlatten;
        ph.properties.gmxEndPoints = this.options.gmxEndPoints;

        gmx.dataManager = this.options.dataManager || new L.gmx.DataManager(ph.properties);

        if (this.options.parentOptions) {
			if (!ph.properties.styles) { ph.properties.styles = this.options.parentOptions.styles; }
			gmx.dataManager.on('versionchange', this._onVersionChange, this);
		}

		gmx.styleManager = new L.gmx.StyleManager(gmx);
        this.options.minZoom = gmx.styleManager.minZoom;
        this.options.maxZoom = gmx.styleManager.maxZoom;

        gmx.dataManager.on('observeractivate', this._chkNeedLayerVersion, this);

        if (gmx.properties.type === 'Vector' && !('chkUpdate' in this.options)) {
            this.options.chkUpdate = true; //Check updates for vector layers by default
        }
        if (gmx.rawProperties.type !== 'Raster' && this._objectsReorderInit) {
            this._objectsReorderInit(this);
        }

        if (gmx.clusters) {
            this.bindClusters(JSON.parse(gmx.clusters));
        }
        if (gmx.filter) {
/*eslint-disable no-useless-escape */
            var func = L.gmx.Parsers.parseSQL(gmx.filter.replace(/[\[\]]/g, '"'));
/*eslint-enable */
            if (func) {
				gmx.dataManager.addFilter('userFilter_' + gmx.layerID, function(item) {
					return gmx.layerID !== this._gmx.layerID || !func || func(item.properties, gmx.tileAttributeIndexes, gmx.tileAttributeTypes) ? item.properties : null;
				}.bind(this));
            }
        }
        if (gmx.dateBegin && gmx.dateEnd) {
            this.setDateInterval(gmx.dateBegin, gmx.dateEnd);
        }

        this._resolve();
        return this;
    },

    getStyleIcon: function (nm, txt) {
		return this._gmx.styleManager.getStyleIcon(nm, txt);
    },

    _chkNeedLayerVersion: function () {
		if (this._chkNeedLayerVersionTimer) { clearTimeout(this._chkNeedLayerVersionTimer); }
		this._chkNeedLayerVersionTimer = setTimeout(function() {
				if (this._gmx.dataManager.getActiveObserversCount()) {
					L.gmx.layersVersion.add(this);
				} else {
					L.gmx.layersVersion.remove(this);
				}
			}.bind(this)
		, 100);
    },
/*
    _addLayerVersion: function () {
		// if (this._onVersionTimer) { cancelIdleCallback(this._onVersionTimer); }
		// this._onVersionTimer = requestIdleCallback(L.gmx.layersVersion.add.bind(L.gmx.layersVersion, this), {timeout: 0});
		if (this._onVersionTimer) { clearTimeout(this._onVersionTimer); }
		this._onVersionTimer = setTimeout(L.gmx.layersVersion.add.bind(L.gmx.layersVersion, this), 0);
    },
*/
    getDataManager: function () {
		return this._gmx.dataManager;
    },

    enableGeneralization: function () {
        if (!this.options.isGeneralized) {
            this.options.isGeneralized = true;
            if (this._gmx.dataManager) {
                // this._clearAllSubscriptions();
                this._gmx.dataManager.enableGeneralization();
                this.redraw();
				this._chkTiles(true);
            }
        }
    },

    disableGeneralization: function () {
        if (this.options.isGeneralized) {
            this.options.isGeneralized = false;
            if (this._gmx.dataManager) {
                // this._clearAllSubscriptions();
                this._gmx.dataManager.disableGeneralization();
                this.redraw();
				this._chkTiles(true);
            }
        }
    },

    setRasterOpacity: function (opacity) {
        if (this._gmx.rasterOpacity !== opacity) {
            this._gmx.rasterOpacity = opacity;
            this._initPromise.then(this.repaint.bind(this));
        }
        return this;
    },

    getStyles: function () {
        return this._gmx.styleManager.getStyles();
    },

    getIcons: function (callback) {
        this._gmx.styleManager.getIcons(callback);
        return this;
    },

    setStyles: function (styles) {
        this._initPromise.then(function() {
            this._gmx.styleManager.clearStyles();
            if (styles) {
                styles.forEach(function(it, i) {
                    this.setStyle(it, i, true);
                }.bind(this));
            } else {
                this.fire('stylechange');
            }
        }.bind(this));
        return this;
    },

    getStyle: function (num) {
        return this.getStyles()[num];
    },

    setStyle: function (style, num, createFlag) {
        this._initPromise.then(function() {
            this._gmx.styleManager.setStyle(style, num, createFlag).then(function () {
                this.fire('stylechange', {num: num || 0});
            }.bind(this));
        }.bind(this));
        return this;
    },

    setStyleHook: function (func) {
        this._gmx.styleHook = func;
        this.repaint();
        return this;
    },

    removeStyleHook: function () {
        this._gmx.styleHook = null;
        return this;
    },

    setRasterHook: function (func) {
        this._gmx.rasterProcessingHook = func;
        this.repaint();
        return this;
    },

    removeRasterHook: function () {
        this._gmx.rasterProcessingHook = null;
        this.repaint();
        return this;
    },

    setFilter: function (func) {
        var gmx = this._gmx;
        gmx.dataManager.addFilter('userFilter', function(item) {
            return gmx.layerID !== this._gmx.layerID || !func || func(item) ? item.properties : null;
        }.bind(this));
        return this;
    },

    removeFilter: function () {
        this._gmx.dataManager.removeFilter('userFilter');
        return this;
    },

    addLayerFilter: function (func, options) {
        var gmx = this._gmx;

		options = options || {};
		options.layerID = gmx.layerID;

        gmx.dataManager.addLayerFilter(function(item) {
            return !func || func(item) ? item.properties : null;
        }.bind(this), options);

        return this;
    },

    removeLayerFilter: function (options) {
		options = options || {};
		options.layerID = this._gmx.layerID;
        this._gmx.dataManager.removeLayerFilter(options);
        return this;
    },

    setDateInterval: function (beginDate, endDate) {
        var gmx = this._gmx;

        if (gmx.dateBegin && gmx.dateEnd) {
			beginDate = gmx.dateBegin;
			endDate = gmx.dateEnd;
		}

        //check that something changed
        if (!gmx.beginDate !== !beginDate ||
            !gmx.endDate !== !endDate ||
            (beginDate && gmx.beginDate && (gmx.beginDate.valueOf() !== beginDate.valueOf())) ||
            (endDate && gmx.endDate && (gmx.endDate.valueOf() !== endDate.valueOf()))
        ) {
			var msecDay = 24 * 3600 * 1000;
            if (gmx.minShownPeriod && endDate) {
                beginDate = new Date(endDate.valueOf() - msecDay * gmx.minShownPeriod);
            } else if (gmx.rawProperties.maxShownPeriod && beginDate) {
                beginDate = new Date(Math.max(beginDate.valueOf(), endDate.valueOf() - msecDay * gmx.rawProperties.maxShownPeriod));
            }
            gmx.beginDate = beginDate;
            gmx.endDate = endDate;

            var observer = null,
				dataManager = gmx.dataManager;
            for (var key in this._tiles) {
				this._tiles[key].loaded = 0;
				observer = this._tiles[key].observer;
				if (observer) {
					observer.setDateInterval(beginDate, endDate);
				}
            }
            observer = dataManager.getObserver('_Labels');
            if (observer) {
                observer.setDateInterval(beginDate, endDate);
            }
			if (gmx.skipTiles === 'NotVisible' || gmx.needBbox || gmx.properties.UseTiles === false) {
				if (!gmx.needBbox) {
					gmx.properties.LayerVersion = -1;
					dataManager.setOptions({LayerVersion: -1});
				}
				if (this._map) {
					L.gmx.layersVersion.now();
				}
			}
            this.fire('dateIntervalChanged');
        }

        return this;
    },

    getDateInterval: function() {
        return {
            beginDate: this._gmx.beginDate,
            endDate: this._gmx.endDate
        };
    },

    addObserver: function (options) {
        return this._gmx.dataManager.addObserver(options);
    },

    removeObserver: function(observer) {
        return this._gmx.dataManager.removeObserver(observer.id);
    },

    setPositionOffset: function(dx, dy) {
        var gmx = this._gmx;
        gmx.shiftXlayer = dx;
        gmx.shiftYlayer = dy;
        this._update();
        return this;
    },

    getPositionOffset: function() {
        var gmx = this._gmx;
        return {shiftX: gmx.shiftXlayer, shiftY: gmx.shiftYlayer};
    },

    setZIndexOffset: function (offset) {
        if (arguments.length) {
            this.options.zIndexOffset = offset;
        }
        this._updateZIndex();
        return this;
    },

    _clearLoaded: function (zKey) {
		if (this._tiles[zKey]) {
			this._tiles[zKey].loaded = 0;
		}
    },

    repaint: function (zKeys) {
        if (this._map) {
			this._chkCurrentTiles();
            if (!zKeys) {
				var zoom = L.gmx._zoomStart || this._tileZoom || this._map._zoom,
					key, tile;
				// console.log('_____',  L.gmx._zoomStart, this._tileZoom, this._map._zoom)
                zKeys = {};
                for (key in this._tiles) {
					tile = this._tiles[key];
					if (tile.coords.z === zoom) {
						zKeys[key] = true;
						this._clearLoaded(key);
						if (tile.observer) { tile.observer.activate(true); }
					} else if (tile.observer) {
						tile.observer.deactivate(true);
					}
				}
                L.extend(zKeys, this.repaintObservers);
            } else if (Array.isArray(zKeys)) {
				var arr = zKeys;
				zKeys = {};
				arr.forEach(function (it) { zKeys[it] = true; this._clearLoaded(it); }.bind(this) );
            } else if (typeof zKeys === 'string') {
				var it = zKeys;
				this._clearLoaded(it);
				zKeys = {};
				zKeys[it] = true;
			}
            this._gmx.dataManager._triggerObservers(zKeys);
			//this._onmoveend();
       }
    },

    redrawItem: function (item) {
        if (this._map) {
			if (typeof(item) !== 'object') { item = this._gmx.dataManager.getItem(item); }
			if (item) {
				var gmxTiles = this._getTilesByBounds(item.bounds);
				this.repaint(gmxTiles);
			}
        }
    },

    appendTileToContainer: function (tileLink) {		// call from screenTile
		//createTi
		if (this._level && this._level.zoom === tileLink.coords.z && this._level.el !== tileLink.el.parentNode) {
			this._level.el.appendChild(tileLink.el);
		}
    },

    addData: function(data, options) {
        if (!this._gmx.mapName) {     // client side layer
            this._gmx.dataManager.addData(data, options);
            this.repaint();
        }
        return this;
    },

    removeData: function(data, options) {
        if (!this._gmx.mapName) {     // client side layer
            this._gmx.dataManager.removeData(data, options);
            this.repaint();
        }
        return this;
    },

    getStylesByProperties: function(propArray, zoom) {
        return this._gmx.styleManager.getCurrentFilters(propArray, zoom);
    },

    getItemStyle: function(id) {
        var gmx = this._gmx,
            item = gmx.dataManager.getItem(id);
        return gmx.styleManager.getObjStyle(item);
    },

    getTileAttributeTypes: function() {
        return this._gmx.tileAttributeTypes;
    },

    getTileAttributeIndexes: function() {
        return this._gmx.tileAttributeIndexes;
    },

    getItemBalloon: function(id) {
        var gmx = this._gmx,
            item = gmx.dataManager.getItem(id),
            styles = this.getStyles(),
            out = '';

        if (item && styles[item.currentFilter]) {
            var propsArr = item.properties;
            out = L.gmxUtil.parseBalloonTemplate(styles[item.currentFilter].Balloon, {
                properties: this.getItemProperties(propsArr),
                geometries: [propsArr[propsArr.length - 1]],
                tileAttributeTypes: gmx.tileAttributeTypes,
                unitOptions: this._map ? this._map.options : {}
            });
        }
        return out;
    },

    getItemProperties: function(propArray) {
        var properties = {},
            indexes = this._gmx.tileAttributeIndexes;
        for (var key in indexes) {
            properties[key] = propArray[indexes[key]];
        }
        return properties;
    },

    addPreRenderHook: function(renderHook) {
        this._gmx.preRenderHooks.push(renderHook);
        this.repaint();
    },

    removePreRenderHook: function(hook) {
        var arr = this._gmx.preRenderHooks;
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === hook) {
                arr.splice(i, 1);
                this.repaint();
                break;
            }
        }
    },

    addRenderHook: function(renderHook) {
        this._gmx.renderHooks.push(renderHook);
        this.repaint();
    },

    removeRenderHook: function(hook) {
        var arr = this._gmx.renderHooks;
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === hook) {
                arr.splice(i, 1);
                this.repaint();
                break;
            }
        }
    },
    getGmxProperties: function() {
        return this._gmx.rawProperties;
	},

    //returns L.LatLngBounds
    getBounds: function() {
        var gmxBounds = this._gmx.layerID ? gmxAPIutils.geoItemBounds(this._gmx.geometry).bounds : this._gmx.dataManager.getItemsBounds();

        if (gmxBounds) {
			return gmxBounds.toLatLngBounds(this._gmx.srs == 3857);
        } else {
            return new L.LatLngBounds();
        }
    },

    getGeometry: function() {
        if (!this._gmx.latLngGeometry) {
            this._gmx.latLngGeometry = L.gmxUtil.geometryToGeoJSON(this._gmx.geometry, true, this._gmx.srs == 3857);
        }

        return this._gmx.latLngGeometry;
    },

    getPropItem: function (key, propArr) {
        return gmxAPIutils.getPropItem(key, propArr, this._gmx.tileAttributeIndexes);
    },

	//block: internal

    _getTilesByBounds: function (bounds) {    // Получить список gmxTiles по bounds
        var gmx = this._gmx,
            zoom = this._tileZoom || this._map._zoom,
            shiftX = gmx.shiftX || 0,   // Сдвиг слоя
            shiftY = gmx.shiftY || 0,   // Сдвиг слоя + OSM
			latLngBounds = bounds.toLatLngBounds(gmx.srs == 3857),
            minLatLng = latLngBounds.getSouthWest(),
            maxLatLng = latLngBounds.getNorthEast(),
            screenBounds = this._map.getBounds(),
            sw = screenBounds.getSouthWest(),
            ne = screenBounds.getNorthEast(),
            dx = 0;


        if (ne.lng - sw.lng < 360) {
            if (maxLatLng.lng < sw.lng) {
                dx = 360 * (1 + Math.floor((sw.lng - maxLatLng.lng) / 360));
            } else if (minLatLng.lng > ne.lng) {
                dx = 360 * Math.floor((ne.lng - minLatLng.lng) / 360);
            }
        }
        minLatLng.lng += dx;
        maxLatLng.lng += dx;

        var pixelBounds = this._map.getPixelBounds(),
            minPoint = this._map.project(minLatLng),
            maxPoint = this._map.project(maxLatLng),
			ts = this.options.tileSize;

        var minY, maxY, minX, maxX;
        if (pixelBounds) {
            minY = Math.floor((Math.max(maxPoint.y, pixelBounds.min.y) + shiftY) / ts);
            maxY = Math.floor((Math.min(minPoint.y, pixelBounds.max.y) + shiftY) / ts);
            minX = minLatLng.lng <= -180 ? pixelBounds.min.x : Math.max(minPoint.x, pixelBounds.min.x);
            minX = Math.floor((minX + shiftX) / ts);
            maxX = maxLatLng.lng >= 180 ? pixelBounds.max.x : Math.min(maxPoint.x, pixelBounds.max.x);
            maxX = Math.floor((maxX + shiftX) / ts);
        } else {
            minY = Math.floor((maxPoint.y + shiftY) / ts);
            maxY = Math.floor((minPoint.y + shiftY) / ts);
            minX = Math.floor((minPoint.x + shiftX) / ts);
            maxX = Math.floor((maxPoint.x + shiftX) / ts);
        }
        var gmxTiles = {};
        for (var x = minX; x <= maxX; x++) {
            for (var y = minY; y <= maxY; y++) {
                var zKey = this._tileCoordsToKey({x: x, y: y, z:zoom});
                gmxTiles[zKey] = true;
            }
        }
      return gmxTiles;
    },

    _updateProperties: function (prop) {
        var gmx = this._gmx;
        if (!gmx.sessionKey) {
			gmx.sessionKey = prop.sessionKey = this.options.sessionKey || ''; //should be already received
		}

        if (this.options.parentOptions) {
			prop = this.options.parentOptions;
		}

        gmx.identityField = prop.identityField; // ogc_fid
        gmx.GeometryType = (prop.GeometryType || '').toLowerCase();   // тип геометрий обьектов в слое
        gmx.minZoomRasters = prop.RCMinZoomForRasters || 1;// мин. zoom для растров
        gmx.minZoomQuicklooks = gmx.minZoomRasters; // по умолчанию minZoom для квиклуков и КР равны

        var type = prop.type || 'Vector';
        if (prop.Temporal) { type += 'Temporal'; }
        gmx.layerType = type;   // VectorTemporal Vector
        gmx.items = {};

        L.extend(gmx, L.gmxUtil.getTileAttributes(prop));
        if (gmx.dataManager) {
            gmx.dataManager.setOptions(prop);
        }
        if (this._objectsReorder) {
            this._objectsReorder.initialize();
        }

        // if ('clusters' in prop) {
            // gmx.clusters = prop.clusters;
        // }

        gmx.filter = prop.filter; 	// for dataSource attr
        gmx.dateBegin = prop.dateBegin;
        gmx.dateEnd = prop.dateEnd;
        gmx.dataSource = prop.dataSource;
        if ('MetaProperties' in gmx.rawProperties) {
            var meta = gmx.rawProperties.MetaProperties;
			if ('zIndexField' in meta && meta.zIndexField.Value) {
				// поле сортировки слоя
				prop.ZIndexField = meta.zIndexField.Value;
			}
            if ('srs' in meta) {  		// проекция слоя
                gmx.srs = meta.srs.Value || '';
            }

            if ('multiPopup' in meta) {  // многостраничный попап
				var multiPopup = meta.multiPopup.Value.toLowerCase();
				this.options.multiPopup = multiPopup === 'true' ? true : false;
            }
            if ('parentLayer' in meta) {  // фильтр слоя		// todo удалить после изменений вов вьювере
                gmx.dataSource = meta.parentLayer.Value || '';
            }
            if ('filter' in meta) {  // фильтр слоя
                gmx.filter = meta.filter.Value || '';
            }
            if ('minShownPeriod' in meta) {  // мин.период (в сутках) для мультивременного слоя
                gmx.minShownPeriod = Number(meta.minShownPeriod.Value);
            }
            if ('dateBegin' in meta) {  // фильтр для мультивременного слоя
                gmx.dateBegin = L.gmxUtil.getDateFromStr(meta.dateBegin.Value || '01.01.1980');
            }
            if ('dateEnd' in meta) {  // фильтр для мультивременного слоя
                gmx.dateEnd = L.gmxUtil.getDateFromStr(meta.dateEnd.Value || '01.01.1980');
            }
            if ('showScreenTiles' in meta) {  // показывать границы экранных тайлов
                gmx.showScreenTiles = meta.showScreenTiles.Value === '1' ? true : false;
            }

            if ('shiftX' in meta || 'shiftY' in meta) {  // сдвиг всего слоя
                gmx.shiftXlayer = meta.shiftX ? Number(meta.shiftX.Value) : 0;
                gmx.shiftYlayer = meta.shiftY ? Number(meta.shiftY.Value) : 0;
            }
            if ('shiftXfield' in meta || 'shiftYfield' in meta) {    // поля сдвига растров объектов слоя
                if (meta.shiftXfield) { gmx.shiftXfield = meta.shiftXfield.Value; }
                if (meta.shiftYfield) { gmx.shiftYfield = meta.shiftYfield.Value; }
            }
            if ('quicklookPlatform' in meta) {    // тип спутника
                gmx.quicklookPlatform = meta.quicklookPlatform.Value;
                if (gmx.quicklookPlatform === 'image') { delete gmx.quicklookPlatform; }
            }
            if ('quicklookX1' in meta) { gmx.quicklookX1 = meta.quicklookX1.Value; }
            if ('quicklookY1' in meta) { gmx.quicklookY1 = meta.quicklookY1.Value; }
            if ('quicklookX2' in meta) { gmx.quicklookX2 = meta.quicklookX2.Value; }
            if ('quicklookY2' in meta) { gmx.quicklookY2 = meta.quicklookY2.Value; }
            if ('quicklookX3' in meta) { gmx.quicklookX3 = meta.quicklookX3.Value; }
            if ('quicklookY3' in meta) { gmx.quicklookY3 = meta.quicklookY3.Value; }
            if ('quicklookX4' in meta) { gmx.quicklookX4 = meta.quicklookX4.Value; }
            if ('quicklookY4' in meta) { gmx.quicklookY4 = meta.quicklookY4.Value; }

            if ('gmxProxy' in meta) {    // Установка прокачивалки
                gmx.gmxProxy = meta.gmxProxy.Value.toLowerCase() === 'true' ? L.gmx.gmxProxy : meta.gmxProxy.Value;
            }
            if ('multiFilters' in meta) {    // проверка всех фильтров для обьектов слоя
                gmx.multiFilters = meta.multiFilters.Value === '1' ? true : false;
            }
            if ('isGeneralized' in meta) {    // Set generalization
                this.options.isGeneralized = meta.isGeneralized.Value !== 'false';
            }
            if ('isFlatten' in meta) {        // Set flatten geometry
                this.options.isFlatten = meta.isFlatten.Value !== 'false';
            }
        }
        if ('ZIndexField' in prop) {
            if (prop.ZIndexField in gmx.tileAttributeIndexes) {
                gmx.zIndexField = gmx.tileAttributeIndexes[prop.ZIndexField];   // sort field index
            }
        }
        if (prop.Temporal) {    // Clear generalization flag for Temporal layers
            this.options.isGeneralized = false;
        }

        if (prop.IsRasterCatalog) {
            gmx.IsRasterCatalog = prop.IsRasterCatalog;
            var layerLink = gmx.tileAttributeIndexes.GMX_RasterCatalogID;
            if (layerLink) {
				var endPoint = this.options.gmxEndPoints ? this.options.gmxEndPoints.tileProps : '/TileSender.ashx';
                gmx.rasterBGfunc = function(x, y, z, item, srs) {
                    var properties = item.properties,
						sessionKey = gmx.sessionKey || gmx.dataManager.options.sessionKey,
						syncParams = L.gmx.gmxMapManager.getSyncParams(true),
						url = L.gmxUtil.protocol + '//' + gmx.hostName + endPoint
							+ '?ModeKey=tile&ftc=osm'
							+ '&x=' + x
							+ '&y=' + y
							+ '&z=' + z;
					if (srs || gmx.srs) { url += '&srs=' + (srs || gmx.srs); }
					if (gmx.crossOrigin) { url += '&cross=' + gmx.crossOrigin; }
					url += '&LayerName=' + properties[layerLink];
					if (sessionKey) { url += '&key=' + encodeURIComponent(sessionKey); }
					if (syncParams) { url += '&' + syncParams; }
					if (L.gmx._sw && item.v) { url += '&sw=' + L.gmx._sw + '&v=' + item.v; }
                    return url;
                };
            }
        }
        if (prop.Quicklook) {
            var quicklookParams;

            //раньше это была просто строка с шаблоном квиклука, а теперь стало JSON'ом
            if (prop.Quicklook[0] === '{') {
                quicklookParams = JSON.parse(prop.Quicklook);
            } else {
                quicklookParams = {
                    minZoom: gmx.minZoomRasters,
                    template: prop.Quicklook
                };
            }

            if ('X1' in quicklookParams) { gmx.quicklookX1 = quicklookParams.X1; }
            if ('Y1' in quicklookParams) { gmx.quicklookY1 = quicklookParams.Y1; }
            if ('X2' in quicklookParams) { gmx.quicklookX2 = quicklookParams.X2; }
            if ('Y2' in quicklookParams) { gmx.quicklookY2 = quicklookParams.Y2; }
            if ('X3' in quicklookParams) { gmx.quicklookX3 = quicklookParams.X3; }
            if ('Y3' in quicklookParams) { gmx.quicklookY3 = quicklookParams.Y3; }
            if ('X4' in quicklookParams) { gmx.quicklookX4 = quicklookParams.X4; }
            if ('Y4' in quicklookParams) { gmx.quicklookY4 = quicklookParams.Y4; }

            var template = gmx.Quicklook = quicklookParams.template;
            if ('minZoom' in quicklookParams) { gmx.minZoomQuicklooks = quicklookParams.minZoom; }
            gmx.quicklookBGfunc = function(item) {
                var url = template,
                    reg = /\[([^\]]+)\]/,
                    matches = reg.exec(url);
                while (matches && matches.length > 1) {
                    url = url.replace(matches[0], item.properties[gmx.tileAttributeIndexes[matches[1]]]);
                    matches = reg.exec(url);
                }
				//if (gmx.srs) { url += (url.indexOf('?') === -1 ? '?' : '&') + 'srs=' + gmx.srs; }
                return url;
            };
            gmx.imageQuicklookProcessingHook = L.gmx.gmxImageTransform;
        }
        this.options.attribution = prop.Copyright || '';
    },

    _updateShiftY: function(zoom) {
        var gmx = this._gmx;
		gmx.currentZoom = zoom;
		gmx.tileSize = gmxAPIutils.tileSizes[zoom];
		gmx.mInPixel = this.options.tileSize / gmx.tileSize;
    },

    __drawTile: function (ev) {
		var coords = ev.coords,
			zKey = this._tileCoordsToKey(coords),
			tileElem = this._tiles[zKey];
		if (!tileElem) {
			return;
		}

        var myLayer = this,
			zoom = this._tileZoom,
            gmx = this._gmx;

        // if (tileElem.observer) {
			// gmx.dataManager.removeObserver(tileElem.observer.id);
			// tileElem.reject();
			//this._tileReady(coords, null, tileElem.el);
		// }

        if (!tileElem.promise) {
			tileElem.loaded = 0;
			tileElem.key = zKey;
			tileElem.screenTile = new ScreenVectorTile(myLayer, tileElem);
			tileElem.promise = new Promise(function(resolve, reject) {
				tileElem.resolve = resolve;
				tileElem.reject = reject;
				var filters = gmx.dataManager.getViewFilters('screen', gmx.layerID);
                var done = function() {
					if (tileElem.count) {
						myLayer._drawnObjectsCount += tileElem.count;
						myLayer.appendTileToContainer(tileElem);
					}
					myLayer._tileReady(coords, null, tileElem.el);
                };
				tileElem.observer = gmx.dataManager.addObserver({
                    type: 'resend',
                    layerID: gmx.layerID,
                    needBbox: gmx.needBbox,
					//topLeft: tileElem.screenTile.topLeft,
                    srs: gmx.srs,
                    target: 'screen',
                    z: zoom,
					targetZoom: myLayer.options.isGeneralized ? zoom : null,
					dateInterval: gmx.layerType === 'VectorTemporal' ? [gmx.beginDate, gmx.endDate] : null,
                    active: true,
                    bbox: gmx.styleManager.getStyleBounds(coords),
                    filters: ['clipFilter', 'userFilter_' + gmx.layerID, 'styleFilter', 'userFilter'].concat(filters),
                    callback: function(data) {
// if (L.gmx._animatingZoom) {
// console.log('____ tileElem.promise', data);
// }
                        // if (myLayer._tiles[zKey] && !myLayer._map._animatingZoom) {
                        if (myLayer._tiles[zKey]) {
							myLayer._tiles[zKey].loaded = 0;

							tileElem.screenTile.drawTile(data).then(function(res) {
								if (res) { tileElem.count = res.count; }
								done(res);
							}, function(err) {
								done(err);
							}).catch(console.log);
						} else {
							done();
						}
                    }
				}, zKey)
			}).catch(function(e) {
				console.warn('catch:', e);
			});
		} else {
			tileElem.resolve();
		}
    // },

	// _abortLoading: function () {	// stops loading all tiles in the background layer
		// this._removeScreenObservers();
	}
});
L.Map.addInitHook(function () {
    if (L.Evented.ContextMenu) {
		L.gmx.VectorLayer.include(L.Evented.ContextMenu);
	}
	this.options.ftc = this.options.ftc || 'osm';
	this.options.srs = this.options.srs || 3857;
	this.options.skipTiles = this.options.skipTiles || 'All';

	L.gmx.leafletMap = this;
	L.gmx._zoomLevelsCache = {};
	// L.gmx._zoomAnimCache = {};

	// this.on('zoomend', function(ev) {
			// console.log('zoomend ', ev);
	// }, this);
	this.on('zoomstart', function(ev) {
			// console.log('zoomstart ', ev);
		L.gmx._zoomStart = ev.zoom;
		L.gmx._zoomLevelsCache = {};
		L.gmx._zoomLevelsCount = 0;
		var cnt = 0,
			maxZoomAnimGmxLayers = this.options.maxZoomAnimGmxLayers || 5;
		for (var key in this._layers) {
			var it = this._layers[key];
			if (it._map && it instanceof L.gmx.VectorLayer) {
				var func = L.DomUtil.removeClass;
				if (ev.zoom > this._zoom && (it._drawnObjectsCount === 0 || (cnt > maxZoomAnimGmxLayers))) {func = L.DomUtil.addClass;}
				else {cnt++;}
				func(it._container, 'leaflet-zoom-hide');
				it._drawnObjectsCount = 0;
			}
		}
	}, this);
});
