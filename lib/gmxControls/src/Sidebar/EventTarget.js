class EventTarget {    
    constructor() {
        this.listeners = {};
    }
    addEventListener(type, callback) {
        if(!(type in this.listeners)) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
    }
    on(type, callback) {
        this.addEventListener(type, callback);
        return this;
    }
    removeEventListener (type, callback) {
        if(!(type in this.listeners)) {
            return;
        }
        let stack = this.listeners[type];
        for(let i = 0, l = stack.length; i < l; i++) {
            if(stack[i] === callback){
                stack.splice(i, 1);
                return this.removeEventListener(type, callback);
            }
        }
    }
    off(type, callback) {
        this.removeEventListener(type, callback);
        return this;
    }
    dispatchEvent(event) {
        if(!(event.type in this.listeners)) {
            return;
        }
        let stack = this.listeners[event.type];
	    Object.defineProperty(event, 'target', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: this
        });
        for(let i = 0, l = stack.length; i < l; i++) {
            stack[i].call(this, event);
        }
    }
    
}

export default EventTarget;