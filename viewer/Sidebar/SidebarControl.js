import './Sidebar.css';
// import Utils from '../../../gmxLayers/Utils.js';
// import Sidebar from './Sidebar.js';

let SidebarControl = L.Control.extend({
    includes: L.Evented,
    
    initialize: function(options) {
        L.setOptions(this, options);        
        this._items = [];
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

    setCurrent: function (id, flag = true) { 
        this._current = flag ? id : null;
		this._items.forEach(it => {
 			it.tab.classList[it.id === this._current ? 'add' : 'remove']('active');
 			it.pan.classList[it.id === this._current ? 'add' : 'remove']('active');
		});
 		document.body.classList[this._current ? 'add' : 'remove']('active');
    },

    addTab: function(id, options) {
		options = options || {};
		let iconId = options.iconId || id;
		let tab = L.DomUtil.create('li', iconId);
		let pan = L.DomUtil.create('div', id);
		this._items.push({
			id,
			options,
			tab,
			pan
		});
		tab.innerHTML = L.gmxUtil.setSVGIcon(iconId);
		if (options.panSvelte) {
			const panApp = new options.panSvelte({
					target: pan,
					props: {
					  // map,
					}
				});
		}

        return tab;
    },

    removeTab: function (id) {
		this._items = this._items.reduce((a, c) => {
			if (c.id !== id) a.push(c);
			else {
				c.tab.parentNode.remove(c.tab);
				c.pan.parentNode.remove(c.pan);
			}
			return a;
		}, []);
    },

    getTab: function (id) {
		let _items = this._items;
		let len = _items.length;
		for (let i = 0; i < len; i++) {
			if (_items[i].id === id) return _items[i];
		}
	    return null;
    },

    _findItemByTab: function (node) {
		let _items = this._items;
		let len = _items.length;
		for (let i = 0; i < len; i++) {
			if (_items[i].tab === node) return _items[i];
		}
	    return null;
    },

    getPane: function (id) {
	    return this._sidebar.panels[id];
    },

    onRemove: function(map) {
// console.log('onRemove', map)
		document.body.classList.remove('sidebar');
    },

    onClick: function(ev) {
		let item =  this._findItemByTab(ev.target);
		this.setCurrent(item.id, this._current !== item.id);
// console.log('onClick', item)
    },

    onAdd: function(map) {
		const container = L.DomUtil.create('div', 'sidebar');
		container.innerHTML = '';
		this.tabsCont = L.DomUtil.create('ul', 'tabs', container);
		this.pansCont = L.DomUtil.create('div', 'pans', container);
		L.DomEvent.disableClickPropagation(container);
		this._items.forEach(it => {
			this.tabsCont.append(it.tab);
			this.pansCont.append(it.pan);
		});

        const {position} = this.options;
		// this._sidebar = new Sidebar(this._container, {position: (position === 'topleft' || position === 'bottomleft') ? 'left' : 'right' });
        // this._sidebar.addEventListener('change:selected', e => {
            // this.fire ('change', e);
        // });
        this._container = container;
		L.DomEvent.on(this.tabsCont, 'click', ev => {
			this.onClick(ev);
			// console.log('hh', ev);
		}, this);
		return container;
    },

    addTo: function(map) {
// console.log('addTo', map)
        // if (this.options.position) {
			L.Control.prototype.addTo.call(this, map);
			let addBefore = this.options.addBefore;
			// if (typeof(addBefore) === 'string') {
				// addBefore = map.gmxControlsManager.get(addBefore);
				// if (addBefore) addBefore = addBefore.getContainer();
			// }
			if (addBefore) {
				let mapc = map.getContainer();
				mapc.parentNode.insertBefore(this._container, mapc);
				document.body.classList.add('sidebar');
			}
        // } else {
			// let toNode = map.getContainer();
			// toNode.parentNode.insertBefore(this._container, toNode);
		// }
        return this;
    },

    addBefore: function(node) {
        if (typeof(node) === 'string') {
			
			node = this._map._controlCorners[this.getPosition()];
			// pNode.parentNode.insertBefore(this._container, pNode);
        } else {
		}
		node.parentNode.insertBefore(this._container, node);
/*		
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
*/
        return this;
    },    
});
L.Control.gmxSidebar = SidebarControl;
L.control.gmxSidebar = function (options) {
  return new L.Control.gmxSidebar(options);
};

export default SidebarControl;