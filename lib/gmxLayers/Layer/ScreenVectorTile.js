import {gmxAPIutils} from '../Utils.js';

// Single tile on screen with vector data
var fetchOptions = {
	//mode: 'cors',
	credentials: 'include'
};

function ScreenVectorTile(layer, tileElem) {
// TODO - проверка версии
    this.layer = layer;
	this.ts = layer.options.tileSize;
	this.tileElem = tileElem;
	this.tile = tileElem.el;
	var tilePoint = tileElem.coords,
		zoom = tilePoint.z,
		pz = Math.pow(2, zoom),
		x = tilePoint.x % pz,
		y = tilePoint.y % pz,
		utils = gmxAPIutils;

    if (x < 0) { x += pz; }
    if (y < 0) { y += pz; }
    this.ntp = {z: zoom, x: x, y: y};

	this.tilePoint = tilePoint;
    this.zoom = zoom;
    this.gmx = layer._gmx;
    this.zKey = this.layer._tileCoordsToKey(tilePoint, zoom);
    this.worldWidthMerc = utils.worldWidthMerc;

    var gmxTilePoint = utils.getTileNumFromLeaflet(tilePoint, zoom);
    this.tpx = this.ts * gmxTilePoint.x;
    this.tpy = this.ts * (1 + gmxTilePoint.y);

	var tileSize = utils.tileSizes[tilePoint.z] * this.ts / 256;

    this.tbounds = utils.getBoundsByTilePoint(this.ntp, tileSize);
    this.topLeft = {
		tilePoint: tilePoint,
		tileSize: tileSize,
		mInPixel: this.ts / tileSize,
		pix: {
			px: this.ts * tilePoint.x,
			py: this.ts * tilePoint.y
		},
		wm: {
			x: tileSize * tilePoint.x - this.worldWidthMerc,
			y: this.worldWidthMerc - tileSize * tilePoint.y
		},
		bounds: utils.getBoundsByTilePoint(tilePoint, tileSize)
	};

    this.gmxTilePoint = gmxTilePoint;

    this.showRaster =
        (zoom >= this.gmx.minZoomRasters && 'rasterBGfunc' in this.gmx) ||
        (zoom >= this.gmx.minZoomQuicklooks && 'quicklookBGfunc' in this.gmx);
    this.rasters = {}; //combined and processed canvases for each vector item in tile
    this.rasterRequests = {};   // all cached raster requests
    this.itemsView = [];   		// items on screen tile + todo: without not visible
    this._uniqueID = 0;         // draw attempt id
    this.gmx.badTiles = this.gmx.badTiles || {};
}

ScreenVectorTile.prototype = {
    _getUrlFunction: function (gtp, item) {
		return this.gmx.rasterBGfunc(gtp.x, gtp.y, gtp.z, item);
    },
    _chkZoom: function (zoom) {
		return	(zoom >= this.gmx.minZoomRasters && 'rasterBGfunc' in this.gmx) ||
				(zoom >= this.gmx.minZoomQuicklooks && 'quicklookBGfunc' in this.gmx);
    },

    _loadTileRecursive: function (tilePoint, item) {    //return promise, which resolves with object {gtp, image}
        var gmx = this.gmx,
			gtp = {z: tilePoint.z, x: this.ntp.x, y: this.ntp.y},
            _this = this;

		// for (var key in this.rasterRequests) {
			// this.rasterRequests[key].reject();
		// }
		this.rasterRequests = {};

		return new Promise(function(resolve) {
			var tryLoad = function(gtp, crossOrigin) {
				var rUrl = _this._getUrlFunction(gtp, item);
				if (gmx.rastersCache && gmx.rastersCache[rUrl]) {
					resolve({gtp: gtp, image: gmx.rastersCache[rUrl]});
				} else {
					var tryHigherLevelTile = function(url) {
						if (url) {
							gmx.badTiles[url] = true;
						}

						var nextZoom = gtp.z - 1;
						if (nextZoom && _this._chkZoom(nextZoom)) {
							tryLoad({
								x: Math.floor(gtp.x / 2),
								y: Math.floor(gtp.y / 2),
								z: nextZoom
							}, ''); // 'anonymous' 'use-credentials'
						} else {
							resolve({gtp: gtp});
						}
					},
					skipUrl = function(res) {
						_this.layer.fire('bitmap', {id: item.id, loaded: false, url: rUrl, result: res});
						tryHigherLevelTile(rUrl);
					};

					if (gmx.badTiles[rUrl] || (gmx.maxNativeZoom && gmx.maxNativeZoom < gtp.z)) {
						tryHigherLevelTile();
						return;
					}

					if (L.gmx.getBitmap) {
						L.gmx.getBitmap(rUrl, fetchOptions).then(
							function(res) {
								if (res) {
									var imageObj = res.imageBitmap,
										canvas_ = document.createElement('canvas');
									canvas_.width = imageObj.width;
									canvas_.height = imageObj.height;
									canvas_.getContext('2d').drawImage(imageObj, 0, 0, canvas_.width, canvas_.width);
									if (gmx.rastersCache) {
										gmx.rastersCache[rUrl] = canvas_;
									}
									resolve({gtp: gtp, image: canvas_});
									_this.layer.fire('bitmap', {id: item.id, loaded: true, url: rUrl, result: res});
								} else {
									skipUrl();
								}
							},
							skipUrl
							// function(res) {
								// _this.layer.fire('bitmap', {id: item.id, loaded: false, url: rUrl, result: res});
								// tryHigherLevelTile(rUrl);
							// }
						)
						.catch(L.Util.falseFn);
					} else {
						var request = _this.rasterRequests[rUrl];
						if (!request) {
							if (gmx.rasterProcessingHook) {
								crossOrigin = 'anonymous';
							}
							request = L.gmx.imageLoader.push(rUrl, {
								tileRastersId: _this._uniqueID,
								zoom: _this.zoom,
								cache: true,
								crossOrigin: gmx.crossOrigin || crossOrigin || ''
							});
							_this.rasterRequests[rUrl] = request;
						} else {
							request.options.tileRastersId = _this._uniqueID;
						}
						request.def.then(
							function(imageObj) {
								if (imageObj) {
									if (gmx.rastersCache) {
										gmx.rastersCache[rUrl] = imageObj;
									}
									resolve({gtp: gtp, image: imageObj});
								} else {
									tryHigherLevelTile(rUrl);
								}
							},
							function() {
								// console.log('tryHigherLevelTile111 ', rUrl);
								tryHigherLevelTile(rUrl);
							}
						);
					}
				}
			};

			tryLoad(gtp);
		});
    },

    _rasterHook: function (attr) {
        var source = attr.sourceTilePoint || attr.destinationTilePoint,
            info = {
                geoItem: attr.geoItem,
				zKey: attr.zKey,
                destination: {
                    z: attr.destinationTilePoint.z,
                    x: attr.destinationTilePoint.x,
                    y: attr.destinationTilePoint.y
                },
                source: {
                    z: source.z,
                    x: source.x,
                    y: source.y
                }
            };
        if (attr.url) { info.quicklook = attr.url; }
        return (this.gmx.rasterProcessingHook || this._defaultRasterHook)(
            attr.res, attr.image,
            attr.sx || 0, attr.sy || 0, attr.sw || 256, attr.sh || 256,
            attr.dx || 0, attr.dy || 0, attr.dw || 256, attr.dh || 256,
            info
        );
    },

    // default rasterHook: res - result canvas other parameters as http://www.w3schools.com/tags/canvas_drawimage.asp
    _defaultRasterHook: function (res, image, sx, sy, sw, sh, dx, dy, dw, dh) {
		if (image) {
			var ptx = res.getContext('2d');
			ptx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
		}
		return res;
    },

    // get pixels parameters for shifted object
    _getShiftPixels: function (it) {
        var w = it.dx + (it.dx < 0 ? 256 : 0),
            h = it.dy + (it.dy < 0 ? 256 : 0),
            sx = 0, sw = 256 - w, dx = w, dw = sw;
        if (it.tx > it.x) {
            sx = sw; sw = w; dx = 0; dw = sw;
        }
        if (sx === 256 || sw < 1) { return null; }

        var sy = h, sh = 256 - h, dy = 0, dh = sh;
        if (it.ty > it.y) {
            sy = 0; dy = sh; sh = h; dh = sh;
        }
        if (sy === 256 || sh < 1) { return null; }

        return {
            sx: sx, sy: sy, sw: sw, sh: sh,
            dx: dx, dy: dy, dw: dw, dh: dh
        };
    },

    // get tiles parameters for shifted object
    _getShiftTilesArray: function (bounds, shiftX, shiftY) {
        var mInPixel = this.topLeft.mInPixel,
            gmxTilePoint = this.gmxTilePoint,
            px = shiftX * mInPixel,
            py = shiftY * mInPixel,
            deltaX = Math.floor(0.5 + px % this.ts),            // shift on tile in pixel
            deltaY = Math.floor(0.5 + py % this.ts),
            tileSize = this.ts / mInPixel,
            tminX = gmxTilePoint.x - shiftX / tileSize,     // by screen tile
            tminY = gmxTilePoint.y - shiftY / tileSize,
            rminX = Math.floor(tminX),
            rmaxX = rminX + (tminX === rminX ? 0 : 1),
            rminY = Math.floor(tminY),
            rmaxY = rminY + (tminY === rminY ? 0 : 1),
            minX = Math.floor((bounds.min.x - shiftX) / tileSize),  // by geometry bounds
            maxX = Math.floor((bounds.max.x - shiftX) / tileSize),
            minY = Math.floor((bounds.min.y - shiftY) / tileSize),
            maxY = Math.floor((bounds.max.y - shiftY) / tileSize);

        if (rminX < minX) { rminX = minX; }
        if (rmaxX > maxX) { rmaxX = maxX; }
        if (rminY < minY) { rminY = minY; }
        if (rmaxY > maxY) { rmaxY = maxY; }

        var arr = [];
        for (var j = rminY; j <= rmaxY; j++) {
            for (var i = rminX; i <= rmaxX; i++) {
                arr.push({
                    z: gmxTilePoint.z,
                    x: i,
                    y: j,
                    dx: deltaX,
                    dy: deltaY,
                    tx: tminX,
                    ty: tminY
                });
            }
        }
        return arr;
    },

    _chkRastersByItemIntersect: function (arr, item) {
		var geo = item.properties[item.properties.length - 1],
			out = [];
		arr.forEach(function(it) {
			var bounds = gmxAPIutils.getBoundsByTilePoint(it);
			if (gmxAPIutils.isItemIntersectBounds(geo, bounds)) {
				out.push(it);
			}
		});
		return out;
    },

	getTilePosZoomDelta: function(tilePoint, zoomFrom, zoomTo) {		// получить смещение тайла на меньшем zoom
        var dz = Math.pow(2, zoomFrom - zoomTo),
            size = this.ts / dz,
            dx = tilePoint.x % dz,
            dy = tilePoint.y % dz;
		return {
			size: size,
			zDelta: dz,
			x: size * dx,
			y: size * dy
		};
    },

    // Loads missing rasters for single item and combines them in canvas.
    // Stores resulting canvas in this.rasters
    _getItemRasters: function (geo) {
        var properties = geo.properties,
            idr = properties[0],
            _this = this,
            gmx = this.gmx,
            indexes = gmx.tileAttributeIndexes,
            rasters = this.rasters,
            shiftX = Number(gmx.shiftXfield ? gmxAPIutils.getPropItem(gmx.shiftXfield, properties, indexes) : 0) % this.worldWidthMerc,
            shiftY = Number(gmx.shiftYfield ? gmxAPIutils.getPropItem(gmx.shiftYfield, properties, indexes) : 0),
            isShift = shiftX || shiftY,
            urlBG = gmxAPIutils.getPropItem('urlBG', properties, indexes),
            url = '',
            itemImageProcessingHook = null,
            isTiles = false,
            // item = gmx.dataManager.getItem(idr),
            item = geo,
            gmxTilePoint = this.gmxTilePoint,
            tilePoint = this.tilePoint,
            ntp = this.ntp,
            resCanvas = null;

		item.v = geo.v;
		if (gmx.IsRasterCatalog && (gmx.rawProperties.type === 'Raster' || gmxAPIutils.getPropItem('GMX_RasterCatalogID', properties, indexes))) {
			isTiles = true;                     // Raster Layer
		} else if (gmx.quicklookBGfunc) {
			url = gmx.quicklookBGfunc(item);    // Quicklook
			itemImageProcessingHook = gmx.imageQuicklookProcessingHook;
		} else if (urlBG) {
			url = urlBG;                        // Image urlBG from properties
			itemImageProcessingHook = gmx.imageQuicklookProcessingHook;
		}
		if (isTiles) {
			return new Promise(function(resolve1) {
				var dataOption = geo.dataOption || {},
					tileToLoadPoints = this._chkRastersByItemIntersect(isShift ? this._getShiftTilesArray(dataOption.bounds, shiftX, shiftY) : [ntp], geo);

				var cnt = tileToLoadPoints.length,
					chkReadyRasters = function() {
						if (cnt < 1) { resolve1(); }
					},
					skipRasterFunc = function() {
						cnt--;
						chkReadyRasters();
					},
					onLoadFunction = function(gtp, p, img) {
						item.skipRasters = false;
						var isImage = true;

						if (itemImageProcessingHook) {
							img = itemImageProcessingHook(img, {
								gmx: gmx,
								geoItem: geo,
								item: item,
								gmxTilePoint: gtp
							});
							isImage = false;
						}

						var info = {
								geoItem: geo,
								image: img,
								zKey: _this.zKey,
								destinationTilePoint: tilePoint,
								sourceTilePoint: gtp,
								sx: 0, sy: 0, sw: _this.ts, sh: _this.ts,
								dx: 0, dy: 0, dw: _this.ts, dh: _this.ts
							};

						if (isShift) {
							var pos = _this._getShiftPixels(p);
							if (pos === null) {
								skipRasterFunc();
								return;
							}
							L.extend(info, pos);
							isImage = false;
						}

						if (gtp.z !== ntp.z) {
							var posInfo = _this.getTilePosZoomDelta(ntp, ntp.z, gtp.z);
							if (posInfo.size < 1 / 256) {// меньше 1px
								chkReadyRasters();
								return;
							}
							isImage = false;
							info.sx = Math.floor(posInfo.x);
							info.sy = Math.floor(posInfo.y);
							info.sw = info.sh = posInfo.size;
							if (isShift) {
								var sw = Math.floor(info.dw / posInfo.zDelta);
								info.sx = (info.dx === 0 ? info.sw : _this.ts) - sw;
								info.sw = sw;

								var sh = Math.floor(info.dh / posInfo.zDelta);
								info.sy = (info.dy === 0 ? info.sh : _this.ts) - sh;
								info.sh = sh;
							}
						}
						if (isImage && !gmx.rasterProcessingHook) {
							cnt--;
							resCanvas = img;
							rasters[idr] = resCanvas;
							chkReadyRasters();
						} else {
							if (!resCanvas) {
								resCanvas = document.createElement('canvas');
								resCanvas.width = resCanvas.height = _this.ts;
							}
							info.res = resCanvas;
							var hookResult = _this._rasterHook(info),
								then = function() {
									cnt--;
									//p.resImage = resCanvas;
									rasters[idr] = resCanvas;
									chkReadyRasters();
								};

							if (hookResult) {
								if (hookResult.then) {
									hookResult.then(then);
								} else {
									resCanvas = hookResult;
									then();
								}
							} else if (hookResult === null) {
								item.skipRasters = true;
								skipRasterFunc();
							} else {
								resCanvas = img;
								then();
							}
						}
					};
				if (cnt) {
					tileToLoadPoints.map(function(it) {
						var loader = _this._loadTileRecursive(it, item);
						loader.then(function(loadResult) {
							onLoadFunction(loadResult.gtp, it, loadResult.image);
						}, skipRasterFunc);
						return loader;
					});
				} else {
					item.skipRasters = true;
					skipRasterFunc();
				}
			}.bind(this));
		}

		if (gmx.sessionKey) { url += (url.indexOf('?') === -1 ? '?' : '&') + 'key=' + encodeURIComponent(gmx.sessionKey); }

		return new Promise(function(resolve1) {
			var skipRaster = function(res) {
				_this.layer.fire('bitmap', {id: idr, loaded: false, url: url, result: res});
				item.skipRasters = true;
				resolve1();
			};

// console.log('____3_____', this.zKey, url)
			if (!url) { skipRaster(); return; }

			var done = function(resCanvas) {
				gmx.quicklooksCache[url] = resCanvas;
				var res = resCanvas;
				if (this.gmx.rasterProcessingHook) {
					//console.warn('rasterProcessingHook for quicklooks did`t work!');
				}
				if (itemImageProcessingHook) {	// требуется transform
					var imgAttr = {
						gmx: gmx,
						topLeft: this.topLeft,
						geoItem: geo,
						item: item,
						gmxTilePoint: gmxTilePoint
					};
					res = itemImageProcessingHook(resCanvas, imgAttr);
				}
				if (res) {
					resolve1(res);
					item.skipRasters = false;
					rasters[idr] = res;
				} else {
					skipRaster();
				}
			}.bind(this);

			if (gmx.quicklooksCache && gmx.quicklooksCache[url]) {
				done(gmx.quicklooksCache[url]);
			} else if (L.gmx.getBitmap) {
				var urlProxy = url;
				if (gmx.gmxProxy) {
					urlProxy = gmx.gmxProxy + '?WrapStyle=none&get=' + encodeURIComponent(url);
				}
				L.gmx.getBitmap(urlProxy, fetchOptions).then(
					function(res) {
						var imageObj = res.imageBitmap,
							canvas_ = document.createElement('canvas');
						canvas_.width = imageObj.width;
						canvas_.height = imageObj.height;
						canvas_.getContext('2d').drawImage(imageObj, 0, 0, canvas_.width, canvas_.height);
						done(canvas_);
						_this.layer.fire('bitmap', {id: idr, loaded: true, url: url, result: res});
					}, skipRaster)
				.catch(skipRaster);
			} else {
				var request = this.rasterRequests[url];
				if (!request) {
					request = L.gmx.imageLoader.push(url, {
						tileRastersId: _this._uniqueID,
						crossOrigin: gmx.crossOrigin || 'anonymous'
					});
					this.rasterRequests[url] = request;
				} else {
					request.options.tileRastersId = this._uniqueID;
				}

				// in fact, we want to return request.def, but need to do additional action during cancellation.
				// so, we consctruct new promise and add pipe it with request.def
				request.def.then(done, skipRaster);
			}
		}.bind(this));
    },

    _getVisibleItems: function (geoItems) {
        if (geoItems.length < 2) {
			this.itemsView = geoItems;
            return geoItems;
        }
        if (!gmxAPIutils._tileCanvas) {
            gmxAPIutils._tileCanvas = document.createElement('canvas');
            gmxAPIutils._tileCanvas.width = gmxAPIutils._tileCanvas.height = this.ts;
        }
        var i, len,
            gmx = this.gmx,
            dm = gmx.dataManager,
            canvas = gmxAPIutils._tileCanvas,
            ctx = canvas.getContext('2d'),
            dattr = {
                tbounds: this.tbounds,
                gmx: gmx,
				topLeft: this.topLeft,
                tpx: this.tpx,
                tpy: this.tpy,
                ctx: ctx
            };
        ctx.clearRect(0, 0, this.ts, this.ts);
        ctx.imageSmoothingEnabled = false;
        for (i = 0, len = geoItems.length; i < len; i++) {
            ctx.fillStyle = gmxAPIutils.dec2rgba(i + 1, 1);
            var geoItem = geoItems[i];
            L.gmxUtil.drawGeoItem(
                geoItem,
                dm.getItem(geoItem.properties[0]),
                dattr,
                {fillStyle: ctx.fillStyle}
            );
        }
        var items = {},
            data = ctx.getImageData(0, 0, this.ts, this.ts).data;

        for (i = 0, len = data.length; i < len; i += 4) {
            if (data[i + 3] === 255) {
                var color = data[i + 2];
                if (data[i + 1]) { color += (data[i + 1] << 8); }
                if (data[i]) { color += (data[i] << 16); }
                if (color) { items[color] = true; }
            }
        }
        var out = [];
        for (var num in items) {
            var it = geoItems[Number(num) - 1];
            if (it) { out.push(it); }
        }
		this.itemsView = out;
        return out;
    },

    _getNeedRasterItems: function (geoItems) {
        var gmx = this.gmx,
            indexes = gmx.tileAttributeIndexes,
            tbounds = this.tbounds,
            out = [];
        for (var i = 0, len = geoItems.length; i < len; i++) {
            var geo = geoItems[i],
                properties = geo.properties,
                idr = properties[0],
                dataOption = geo.dataOption || {},
                skipRasters = false;

            if (gmx.quicklookBGfunc && !gmxAPIutils.getPropItem('GMX_RasterCatalogID', properties, indexes)) {
                if (gmx.minZoomQuicklooks && this.zoom < gmx.minZoomQuicklooks) { continue; }
                var platform = gmxAPIutils.getPropItem(gmx.quicklookPlatform, properties, indexes) || gmx.quicklookPlatform || '';
                if ((!platform || platform === 'imageMercator') &&
                    !gmxAPIutils.getQuicklookPointsFromProperties(properties, gmx)
                ) {
                    continue;
                }
            }

            if (gmx.styleHook) {
                geo.styleExtend = gmx.styleHook(
                    gmx.dataManager.getItem(idr),
                    gmx.lastHover && idr === gmx.lastHover.id
                );
                skipRasters = geo.styleExtend && geo.styleExtend.skipRasters;
            }
            if (!skipRasters && tbounds.intersectsWithDelta(dataOption.bounds, -1, -1)) {
                out.push(geo);
            }
        }
        return this._getVisibleItems(out);
    },

    _getTileRasters: function (geoItems) {   //load all missing rasters for items we are going to render
		return new Promise(function(resolve) {
			var arr = this._getNeedRasterItems(geoItems).map(this._getItemRasters.bind(this));
// console.log('_getTileRasters___', arr)
			Promise.all(arr)
				.then(resolve, function() {
// console.log('_getTileRasters', ev)
				});
		}.bind(this));
    },

    _chkItems: function (data) {
        var layer = this.layer;
        if (!layer._map) {
            return null;
        }
        var items = data && data.added && data.added.length ? data.added : null;

        if (!items) {
            var tLink = layer._tiles[this.zKey];
            if (tLink && tLink.el) {
                tLink.el.getContext('2d').clearRect(0, 0, this.ts, this.ts);
            }
            return null;
        }
        return this.gmx.sortItems ? layer.getSortedItems(items) : items;
    },

    destructor: function () {
		// if (this.drawReject) {
			// this.drawReject('отмена');
			// this.drawReject = null;
		// }
		if (this._preRenderPromise) {
			this._preRenderPromise.reject();        // cancel preRenderHooks chain if exists
		}
		if (this._renderPromise) {
			this._renderPromise.reject();           // cancel renderHooks chain if exists
		}
        this._cancelRastersPromise();
        this._clearCache();
    },

    _cancelRastersPromise: function () {
        if (this.rastersPromise) {
			if (this.rastersPromise.reject) {
				this.rastersPromise.reject();
			}
            this.rastersPromise = null;
        }
    },

    _clearCache: function () {
        for (var url in this.rasterRequests) {
            this.rasterRequests[url].remove();
        }
        this.rasterRequests = {};
    },

    drawTile: function (data) {
// if (L.gmx._animatingZoom) {
		// if (this._animId) { L.Util.cancelAnimFrame(this._animId); }
// console.log('____ drawTile', L.gmx._animatingZoom);
		// return new Promise(function(resolve, reject) {
			// resolve();
		// });

// }
		this.destructor();
		return new Promise(function(resolve, reject) {
			// if (L.gmx._animatingZoom) {
				// resolve();
				// return;
			// }
			if (L.gmx._zoomStart && L.gmx._zoomStart !== this.zoom) {
				resolve();
				return;
			}

			// this.drawReject = reject;
			var geoItems = this._chkItems(data);
			var result = function() {
				resolve({count: geoItems.length});
			}.bind(this);

			this._uniqueID++;       // count draw attempt

			if (geoItems) {
				if (this.layer._gridClusters && this.layer._gridClusters.checkData({
						geoItems: geoItems,
						tileElem: this.tileElem,
						layer: this.layer
					})) {
					result();
					return;
				}

				if (this.showRaster) {
					this.rastersPromise = this._getTileRasters(geoItems);
					this.rastersPromise.then(function() { this._doDraw(geoItems, resolve, reject); }.bind(this), reject); //first load all raster images, then render all of them at once
				} else {
					this._doDraw(geoItems, resolve, reject);
				}
			} else {
				resolve();
			}
		}.bind(this)).catch(console.warn);
    },

    _doDraw: function (geoItems, resolve, reject) {
// if (L.gmx._animatingZoom) {
// console.log('____ _doDraw', L.gmx._animatingZoom);
	// return [];
// }
		var _this = this,
			tile = _this.tile,
			ctx = tile.getContext('2d'),
			gmx = _this.gmx,
			ts = _this.layer.options.tileSize || 256,
			dattr = {
				//tileLink: tileLink,
				tbounds: _this.tbounds,
				rasters: _this.rasters,
				gmx: gmx,
				topLeft: _this.topLeft,
				tpx: _this.tpx,
				tpy: _this.tpy,
				ctx: ctx
			},
			tinfo = 'zKey:' + _this.zKey + ' count: ' + geoItems.length;
		L.DomUtil.addClass(_this.tile, tinfo);
		_this.tile.width = _this.tile.height = ts;

		if (!_this.layer._gridClusters) {
			ctx.clearRect(0, 0, ts, ts);
			if (gmx.showScreenTiles) {
				ctx.strokeRect(0, 0, ts - 1, ts - 1);
				ctx.strokeText( _this.zKey + ' ' + geoItems.length, 50, 50);
			}
		}
		var hookInfo = {
				zKey: _this.zKey,
				topLeft: _this.topLeft,
				tpx: _this.tpx,
				tpy: _this.tpy,
				x: _this.tilePoint.x,
				y: _this.tilePoint.y,
				z: _this.zoom
			},
			bgImage;

		var fArr = [];
		gmx.preRenderHooks.forEach(function (f) {
			if (!bgImage) {
				bgImage = document.createElement('canvas');
				bgImage.width = bgImage.height = ts;
			}
			var res = f(bgImage, hookInfo);
			if (res && res.then) {
				fArr.push(res);
			}
		});
		Promise.all(fArr).then(function() {
			if (bgImage) { dattr.bgImage = bgImage; }
// if (L.gmx._animatingZoom) {
// console.log('geoItems', geoItems.length, L.gmx._animatingZoom, gmx.preRenderHooks);
// resolve({count: 0});
// return;
// }
			// window.tStamp = Date.now();
			//ctx.save();
			// var drawCount = 0;
			for (var i = 0, len = geoItems.length; i < len; i++) {
				var geoItem = geoItems[i],
					id = geoItem.id,
					item = geoItem;
					// item = gmx.dataManager.getItem(id);
				if (item) {     // skip removed items   (bug with screen tile screenTileDrawPromise.cancel on hover repaint)
					var style = gmx.styleManager.getObjStyle(item, _this.zoom),
						hover = gmx.lastHover && gmx.lastHover.id === geoItem.id && style;

					if (gmx.multiFilters) {
						for (var j = 0, len1 = item.multiFilters.length; j < len1; j++) {
							var it = item.multiFilters[j];
							L.gmxUtil.drawGeoItem(geoItem, item, dattr, hover ? it.parsedStyleHover : it.parsedStyle, it.style);
						}
					} else {
// if(!dattr.rasters[item.id]) {
// console.log('___bg', _this.ntp, item.skipRasters, item.id, dattr.rasters[item.id]);
// }
// geoItem._animId = L.Util.requestAnimFrame(function() {
// if (L.gmx._animatingZoom) {
// console.log('__________L.gmxUtil.drawGeoItem_', i, geoItem._animId, geoItems.length);
// break;
// }
	// L.gmxUtil.drawGeoItem(geoItem, item, dattr, hover ? item.parsedStyleHover : item.parsedStyleKeys, style);
// }, this);

						L.gmxUtil.drawGeoItem(geoItem, item, dattr, hover ? item.parsedStyleHover : item.parsedStyleKeys, style);
						//drawCount += L.gmxUtil.drawGeoItem(geoItem, item, dattr, hover ? item.parsedStyleHover : item.parsedStyleKeys, style) ? 1 : 0;
					}
					if (id in gmx._needPopups && !gmx._needPopups[id]) {
						gmx._needPopups[id] = true;
					}
				}
			}
			// console.log('doDraw:', _this.zKey, drawCount, geoItems.length, (Date.now() - window.tStamp) / 1000, ' sec.');
			//ctx.restore();
			//_this.rasters = {}; // clear rasters		TODO: растры пропадают из-за быстрых перерисовок permalink=C2YMI
			Promise.all(_this._getHooksPromises(gmx.renderHooks, tile, hookInfo)).then(function() {
				resolve({count: geoItems.length});
			}, reject);
		}, reject);
		// _this.layer.appendTileToContainer(_this.tileElem);
    },

    _getHooksPromises: function (hooks, obj, options) {
		var arr = [];
		hooks.forEach(function (f) {
			var res = f(obj, options);
			if (res && res.then) {
				arr.push(res);
			}
		});
		return arr;
    }
};
export default ScreenVectorTile;
