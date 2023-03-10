import {gmxAPIutils} from './Utils.js';

/** Asynchronously request information about map given server host and map name
*/
var gmxMapManager = {
    //serverHost should be host only string like 'maps.kosmosnimki.ru' without any slashes or 'http://' prefixes
    getMap: function(serverHost, apiKey, mapName, skipTiles, srs) {
		return gmxMapManager.loadMapProperties({
			srs: srs,
			hostName: serverHost,
			apiKey: apiKey,
			mapName: mapName,
			skipTiles: skipTiles
		});
    },

	_addMapProperties: function(res, serverHost, mapName) {
		L.gmx._maps[serverHost] = L.gmx._maps[serverHost] || {};
		L.gmx._maps[serverHost][mapName] = {
			_rawTree: res,
			_nodes: {}
		};
		gmxMapManager.iterateNode(res, function(it) {	// TODO: удалить после переделки стилей на сервере
			if (it.type === 'layer') {
				var props = it.content.properties;
				if (props.styles && !props.gmxStyles) {
					it.content.properties.gmxStyles = L.gmx.StyleManager.decodeOldStyles(props);
				}
			}
		});

		if (L.gmx.mapPropertiesHook) {
			L.gmx.mapPropertiesHook(res);
		}
    },

	getMapFolder: function(options) {
        var serverHost = options.hostName || options.serverHost || 'maps.kosmosnimki.ru',
			mapId = options.mapId,
			folderId = options.folderId;

		var opt = {
			folderId: folderId || '',
			mapId: mapId,
			skipTiles: options.skipTiles || 'All', // All, NotVisible, None
			srs: options.srs || 3857
		};
		return new Promise(function(resolve, reject) {
			if (L.gmx.sendCmd) {
				console.log('TODO: L.gmx.sendCmd');
			} else {
				L.gmx.gmxSessionManager.requestSessionKey(serverHost, options.apiKey).then(function(sessionKey) {
					opt.key = sessionKey;
					gmxAPIutils.requestJSONP(L.gmxUtil.protocol + '//' + serverHost + '/Map/GetMapFolder', opt).then(function(json) {
						if (json && json.Status === 'ok' && json.Result) {
							var mapInfo = L.gmx._maps[serverHost][mapId],
								gmxMap = mapInfo.loaded,
								res = json.Result.content,
								outInfo = {
									children: res.children,
									properties: gmxMap.properties
								};
							gmxMapManager.iterateNode(mapInfo._rawTree, function(it) {
								if (folderId === it.content.properties.GroupID) {
									L.extend(it, json.Result);
								}
							}, true);
							gmxMap.layersCreated.then(function() {
								gmxMap.layersCreatePromise(outInfo).then(function() {
									resolve(json.Result);
								});
							});
						} else {
							reject(json);
						}
					}, reject);
				}, reject);
			}
		});
    },

	loadMapProperties: function(options) {
        options = options || {};
        var maps = this._maps,
			disableCache = options.disableCache,
			serverHost = options.hostName || options.serverHost || 'maps.kosmosnimki.ru',
            mapPropsEndPoint = options.gmxEndPoints && options.gmxEndPoints.mapProps ? options.gmxEndPoints.mapProps : '/TileSender.ashx',
            apiKeyEndPoint = options.gmxEndPoints && options.gmxEndPoints.apiKey ? options.gmxEndPoints.apiKey : '/ApiKey.ashx',
			mapName = options.mapName;

        if (disableCache || !maps[serverHost] || !maps[serverHost][mapName]) {
			var opt = {
				WrapStyle: 'func',
				skipTiles: options.skipTiles || 'All', // All, NotVisible, None
				MapName: mapName,
				srs: options.srs || 3857,
				ftc: options.ftc || 'osm',
				ModeKey: 'map'
			};
			if (options.visibleItemOnly) { opt.visibleItemOnly = true; }
			var promise = new Promise(function(resolve, reject) {
				if (L.gmx.sendCmd) {
					L.gmx.sendCmd('mapProperties', {
						serverHost: serverHost,
						apiKeyEndPoint: apiKeyEndPoint,
						mapPropsEndPoint: mapPropsEndPoint,
						apiKey: options.apiKey,
						WrapStyle: 'func',
						skipTiles: options.skipTiles || 'All', // All, NotVisible, None
						MapName: mapName,
						visibleItemOnly: opt.visibleItemOnly|| false,
						srs: options.srs || 3857,
						ftc: options.ftc || 'osm',
						ModeKey: 'map'
					}).then(function(json) {
						if (json && json.load && json.res) {
							gmxMapManager._addMapProperties(json.res, serverHost, mapName);
							resolve(json.res);
						} else {
							reject(json);
						}
					}).catch(reject);
				} else {
					L.gmx.gmxSessionManager.requestSessionKey(serverHost, options.apiKey).then(function(sessionKey) {
						opt.key = sessionKey;
						gmxAPIutils.requestJSONP(L.gmxUtil.protocol + '//' + serverHost + mapPropsEndPoint, opt).then(function(json) {
							if (json && json.Status === 'ok' && json.Result) {
								json.Result.properties.hostName = serverHost;
								json.Result.properties.sessionKey = sessionKey;
								gmxMapManager._addMapProperties(json.Result, serverHost, mapName);
								resolve(json.Result);
							} else {
								reject(json);
							}
						}, reject);
					}, reject);
				}
			});
            maps[serverHost] = maps[serverHost] || {};
            maps[serverHost][mapName] = {promise: promise};
        }
        return maps[serverHost][mapName].promise;
    },

	syncParams: {},
    // установка дополнительных параметров для серверных запросов
    setSyncParams: function(hash) {
		this.syncParams = hash;
    },
    getSyncParams: function(stringFlag) {
		var res = this.syncParams;
		if (stringFlag) {
			var arr = [];
			for (var key in res) {
				arr.push(key + '=' + res[key]);
			}
			res = arr.join('&');
		}
		return res;
    },

    //we will (lazy) create index by layer name to speed up multiple function calls
    findLayerInfo: function(serverHost, mapID, layerID) {
		var hostMaps = L.gmx._maps[serverHost],
			layerInfo = null;

		if (hostMaps && hostMaps[mapID]) {
			var mapInfo = hostMaps[mapID];
			if (!mapInfo._nodes[layerID]) {
				gmxMapManager.iterateNode(mapInfo._rawTree, function(it) {
					mapInfo._nodes[it.content.properties.name] = it;
				});
			}
			layerInfo = mapInfo._nodes[layerID];
		}
		return layerInfo ? layerInfo.content : null;
    },
    iterateLayers: function(treeInfo, callback) {
        var iterate = function(arr) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var layer = arr[i];

                if (layer.type === 'layer') {
                    callback(layer.content);
                } else if (layer.type === 'group') {
                    iterate(layer.content.children || []);
                }
            }
        };

        treeInfo && iterate(treeInfo.children);
    },
    iterateNode: function(treeInfo, callback, onceFlag) {
        var iterate = function(node) {
			var arr = node.children || [];
            for (var i = 0, len = arr.length; i < len; i++) {
                var layer = arr[i];

				if (callback(layer, node) && onceFlag) { break; }
                if (layer.type === 'group') {
                    iterate(layer.content);
                }
            }
        };

        treeInfo && iterate(treeInfo);
    },
    _maps: {} //Promise for each map. Structure: maps[serverHost][mapID]: {promise:, layers:}
};

L.gmx = L.gmx || {};
L.gmx._maps = {};			// свойства слоев по картам
L.gmx._clientLayers = {};	// свойства слоев без карт (клиентские слои)

if (location.protocol === 'https:') {
	L.gmx._sw = '1';	// признак загрузки данных через Service Worker
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('./gmx-sw' + L.gmx._sw + '.js')
		  .then(function(registration) {
			if (registration.active) {
				L.gmx.serviceWorker = registration.active;
			}
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
		  })
		  .catch(function(err) {
			console.log('ServiceWorker registration failed: ', err);
		  });
	} else {
		console.error('Your browser does not support Service Workers.');
	}
}

L.gmx.gmxMapManager = gmxMapManager;
