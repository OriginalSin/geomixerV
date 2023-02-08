import './Sidebar.css';
import EventTarget from './EventTarget.js';

class Sidebar extends EventTarget {
    constructor(container) {
        super();
        this._tabs = {};
        this._panels = {};
        this._container = container;
        this._render(this._container);
        this._visible = false;
    }
    _onTabClick(id, e) {
        e.stopPropagation();
        if (this.selected === id) {
            this.visible = !this.visible;
        }
        else {
            this.selected = id;            
        }
    }
    disable(id) {
        if (this.tabs[id]) {
            this.tabs[id].setAttribute('disabled', 'disabled');            
        }        
    }
    enable(id) {
        if (this.tabs[id]) {
            this.tabs[id].removeAttribute('disabled');
        }
    }
    enabled(id) {        
        return this.tabs[id] && !this.tabs[id].hasAttribute('disabled');
    }
    get tabs() {
        return this._tabs;
    }
    get panels() {
        return this._panels;
    }
    addTab(id) {
        let tab = document.createElement('div');
        tab.classList.add('tab');
        tab.classList.add('noselect');
        tab.classList.add('scanex-sidebar-icon');
        tab.classList.add(id);
        tab.addEventListener('click', this._onTabClick.bind(this, id));
        this._tabsContainer.appendChild(tab);
        this._tabs[id] = tab;

        let panel = document.createElement('div');
        panel.classList.add('panel');        
        panel.classList.add('hidden');
        panel.classList.add(id);
        this._panelsContainer.appendChild(panel);
        this._panels[id] = panel;
        
        if(!this.selected) {
            this.selected = id;
        }
        return panel;
    }
    removeTab(id) {
        this._tabsContainer.removeChild(this._tabs[id]);
        delete this._tabs[id];

        this._panelsContainer.removeChild(this._panels[id]);
        delete this._panels[id];

        if (this.selected === id) {
            this.visible = false;
            let tabs = Object.keys(this._tabs);
            if (tabs.length) {
                this.selected = tabs[0];                
            }
        }        
    }
    get visible() {
        return this._visible;
    }
    set visible(visible) {
        Object.keys(this._tabs).forEach(id => {
            if (visible && id === this.selected) {
                this._panels[id].classList.remove('hidden');                
            }
            else {
                this._panels[id].classList.add('hidden');
            }
        });            
        this._visible = visible;
        let event = document.createEvent('Event');
        event.initEvent('change:visible', false, false);
        this.dispatchEvent(event);        
    }
    get selected () {
        return this._selected;
    }
    set selected (selected) {
        if (this.selected === selected) {            
            this.visible = true;
            let event = document.createEvent('Event');
            event.initEvent('change:selected', false, false);
            this.dispatchEvent(event);
        }
        else if (this.enabled(selected)) {
            Object.keys(this._tabs).forEach(id => {
                if (id === selected) {
                    this._tabs[id].classList.add('selected');
                    this._selected = selected;
                }
                else {
                    this._tabs[id].classList.remove('selected');                    
                }
            });            
            this.visible = true;
            let event = document.createEvent('Event');
            event.initEvent('change:selected', false, false);
            this.dispatchEvent(event);
        }
    }
    _render(container) {

        container.classList.add('scanex-sidebar');
        this._tabsContainer = document.createElement('div');
        this._tabsContainer.classList.add('tabs');
        container.appendChild(this._tabsContainer);

        this._panelsContainer = document.createElement('div');
        this._panelsContainer.classList.add('panels');
        container.appendChild(this._panelsContainer);        
    }
}

export default Sidebar;