L.Control.GmxLayers = L.Control.Layers.extend({
    options: {
        collapsed: false,
        autoZIndex: false,
        id: 'layers'
		// disabled options: sortLayers, sortFunction
    },

    initialize: function (gmxBaseLayersManager, options) {
        L.setOptions(this, options);

        this._layers = {};
        this._lastZIndex = 0;
        this._handlingClick = false;
		this._layerControlInputs = [];

        this._blm = gmxBaseLayersManager;

        L.extend(this, {
            _onBaseLayerActiveIDs: function(ev) {
                var i, len;
                for (i in this._layers) {
                    if (!this._layers[i].overlay) { delete this._layers[i]; }
                }
                for (i = 0, len = ev.activeIDs.length; i < len; i++) {
                    this._addBaseLayer(this._blm.get(ev.activeIDs[i]), true);
                }
                this._update();
                return true;
            },

            _onBaseLayerChange: function(ev) {
                if (ev.baseLayer) { this.setActiveBaseLayer(ev.baseLayer.id); }
            },

            _onBaseLayerOptionsChange: function(ev) {
                this._addBaseLayer(ev.baseLayer);
            }
        });
    },

    addBaseLayer: function () {
        console.log('Warning: Use `gmxBaseLayersManager.add` instead `addBaseLayer`!');
        return this;
    },

	_addLayer: function (layer, name, overlay) {
		var id = L.stamp(layer);

		this._layers[id] = {
			layer: layer,
			name: name,
			overlay: overlay
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

    _addBaseLayer: function (baseLayer, notUpdate) {
        if (baseLayer) {
			var lang = L.gmxLocale ? L.gmxLocale.getLanguage() : 'rus';
            this._addLayer(baseLayer, baseLayer.options[lang] || baseLayer.id);
            if (!notUpdate) { this._update(); }
        }
        return this;
    },

    _addItemObject: function (obj) {
        var label = this._addItem(obj);
        if (obj.layer && obj.layer._gmx && obj.layer._gmx.layerID) {
            label.className = '_' + obj.layer._gmx.layerID;
        }
    },

    _update: function () {
        if (!this._container) {
            return;
        }

		this._layerControlInputs = [];

        this._baseLayersList.innerHTML = '';
        this._overlaysList.innerHTML = '';

        var baseLayersPresent = false,
            overlaysPresent = false,
            activeIDs = this._blm.getActiveIDs(),
            activeIDsHash = {},
            i, len, obj;

        for (i in this._layers) {
            obj = this._layers[i];
            if (obj.overlay) {
                this._addItemObject(obj);
                overlaysPresent = true;
            } else {
                activeIDsHash[obj.layer.id] = obj;
                baseLayersPresent = true;
            }
        }
        for (i = 0, len = activeIDs.length; i < len; i++) {
            if (activeIDsHash[activeIDs[i]]) { this._addItemObject(activeIDsHash[activeIDs[i]]); }
        }

        if (this.options.hideBaseLayers) {
            baseLayersPresent = false;
            this._baseLayersList.style.display = 'none';
        }
        this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
        this._container.style.display = overlaysPresent || baseLayersPresent ? '' : 'none';
    },

    onAdd: function (map) {
        var cont = L.Control.Layers.prototype.onAdd.call(this, map);
        this._container = cont;
        cont.id = this.options.id;
        if (!('activeBaseLayerInput' in this)) {
            this.activeBaseLayerInput = this.getActiveBaseLayer(true);
        }
        L.DomEvent
            .on(cont, 'mousemove', L.DomEvent.stopPropagation);
        map.gmxLayersControl = this;
        map.fire('controladd', this);

        this._blm
            .on('baselayeroptionschange baselayeradd', this._onBaseLayerOptionsChange, this)
            .on('baselayeractiveids', this._onBaseLayerActiveIDs, this)
            .on('baselayerchange', this._onBaseLayerChange, this);

        var _this = this;
        this._blm.getActiveIDs().map(function(id) {
            _this._addBaseLayer(_this._blm.get(id));
        });
        var currentID = this._blm.getCurrentID();
        if (currentID) { this.setActiveBaseLayer(currentID); }

        if (map.gmxControlsManager) {
            map.gmxControlsManager.add(this);
        }
        return cont;
    },

    onRemove: function (map) {
        if (map.gmxControlsManager) {
            map.gmxControlsManager.remove(this);
        }
        L.Control.Layers.prototype.onRemove.call(this, map);
        this._blm
            .off('baselayeroptionschange baselayeradd', this._onBaseLayerOptionsChange, this)
            .off('baselayeractiveids', this._onBaseLayerActiveIDs, this)
            .off('baselayerchange', this._onBaseLayerChange, this);

        map.fire('controlremove', this);
    },

    unSetActiveBaseLayer: function (name) {
        this._toogleActiveBaseLayer(name, false);
    },

    setActiveBaseLayer: function (name) {
        this._toogleActiveBaseLayer(name, true);
    },

    _toogleActiveBaseLayer: function (name, flag) {
        var active = null,
            inputs = this._form.getElementsByTagName('input'),
            targetInput = null,
            blayer = this._getLayerByName(name),
            tid = blayer && blayer.layer._leaflet_id,
            targetIsOverlay = blayer && blayer.overlay;

        for (var i = 0, len = inputs.length; i < len; i++) {
            var input = inputs[i],
                id = input.layerId,
                obj = this._layers[id],
                layer = obj.layer,
                isHasLayer = this._map.hasLayer(layer),
                isOverlay = obj.overlay || false;

            if (isOverlay) {
                if (tid === id) {
                    if (flag) {
                        if (!isHasLayer) { this._map.addLayer(layer); }
                    } else if (isHasLayer) {
                        this._map.removeLayer(layer);
                    }
                    return this;
                }
            } else if (!targetIsOverlay) {
                if (tid === id) {
                    if (flag) {
                        active = input;
                    } else if (isHasLayer) {
                        input.checked = false;
                        active = null;
                        this._map.removeLayer(layer);
                    }
                    targetInput = input;
                }
            }
        }
        if (active && targetInput) {
            this._map.addLayer(this._layers[targetInput.layerId].layer);
            targetInput.checked = true;
        }
        this.activeBaseLayerInput = active;
        return this;
    },

    getActiveBaseLayer: function (inputFlag) {
        var inputs = this._form.getElementsByTagName('input');
        for (var i = 0, len = inputs.length; i < len; i++) {
            var input = inputs[i];
            if (input.checked) {
                if (inputFlag) { return input; }
                var id = input.layerId,
                    obj = this._layers[id];
                if (!obj.overlay) {
                    return obj.name;
                }
            }
        }
        return null;
    },

	_getLayer: function (id) {
		return this._layers[id];
	},

    _getLayerByName: function (name) {
        for (var id in this._layers) {
            var blayer = this._layers[id];
            if (name === blayer.name || name === blayer.layer.id) { return blayer; }
        }
        return null;
    },

	_checkDisabledLayers: function () {
		var inputs = this._form.getElementsByTagName('input'),
		    input,
		    layer,
		    zoom = this._map.getZoom();

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			layer = this._getLayer(input.layerId).layer;
			input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
			                 (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom);

		}
	},

    _onInputClick: function (ev) {
        if (ev) {
            var target = ev.target,
                name = this._layers[target.layerId].name,
                blayer = this._getLayerByName(name),
                flag = this.activeBaseLayerInput && target.layerId === this.activeBaseLayerInput.layerId ? false : target.checked;
            this._handlingClick = true;
            if (flag && blayer && !blayer.overlay) { this._blm.setCurrentID(blayer.layer.id); }
            else { this._toogleActiveBaseLayer(name, flag); }
            this._handlingClick = false;

            this._refocusOnMap();
        }
    }
});

L.Control.gmxLayers = L.Control.GmxLayers;
L.control.gmxLayers = function (gmxBaseLayersManager, options) {
  return new L.Control.GmxLayers(gmxBaseLayersManager, options);
};
