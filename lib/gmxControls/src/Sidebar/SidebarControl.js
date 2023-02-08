// import L from 'leaflet';
import Sidebar from './Sidebar.js';

let SidebarControl = L.Control.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    
    initialize: function(options) {
        L.setOptions(this, options);        
    },

    enable: function (id) {
        this._sidebar.enable (id);
    },

    enabled: function (id) {        
        return this._sidebar.enabled (id);
    },

    disable: function (id) {
        this._sidebar.disable (id);
    },

    getCurrent () {
        return this._sidebar.selected;
    },

    getVisible() {
        return this._sidebar.visible;
    },

    setVisible(visible) {
        this._sidebar.visible = visible;
    },

    setCurrent: function (current) { 
        this._sidebar.selected = current;
    },

    addTab: function(id) {
        return this._sidebar.addTab(id);
    },

    removeTab: function (id) {
        this._sidebar.removeTab (id);
    },

    getTab: function (id) {
	    return this._sidebar.tabs[id];
    },

    getPane: function (id) {
	    return this._sidebar.panels[id];
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div');
        const stop = L.DomEvent.stopPropagation;
        // const fakeStop = L.DomEvent._fakeStop || stop;
        L.DomEvent
         .on(this._container, 'contextmenu', stop)
         // .on(this._container, 'click', fakeStop)
         .on(this._container, 'mousedown', stop)
         .on(this._container, 'touchstart', stop)
         // .on(this._container, 'dblclick', fakeStop)
         .on(this._container, 'mousewheel', stop)
         .on(this._container, 'MozMousePixelScroll', stop);
        const {position} = this.options;
		this._sidebar = new Sidebar(this._container, {position: (position === 'topleft' || position === 'bottomleft') ? 'left' : 'right' });
        this._sidebar.addEventListener('change:selected', e => {
            this.fire ('change', e);
        });
        return this._container;
    },

    addTo: function(map) {
        L.Control.prototype.addTo.call(this, map);
        if (this.options.addBefore) {
            this.addBefore(this.options.addBefore);
        }
        return this;
    },

    addBefore: function(id) {
        let parentNode = this._parent && this._parent._container;
        if (!parentNode) {
            parentNode = this._map && this._map._controlCorners[this.getPosition()];
        }
        if (!parentNode) {
            this.options.addBefore = id;
        }
        else {
            for (let i = 0, len = parentNode.childNodes.length; i < len; i++) {
                let it = parentNode.childNodes[i];
                if (id === it._id) {
                    parentNode.insertBefore(this._container, it);
                    break;
                }
            }
        }
        return this;
    },    
});
L.Control.gmxSidebar = SidebarControl;
L.control.gmxSidebar = function (options) {
  return new L.Control.gmxSidebar(options);
};

export default SidebarControl;