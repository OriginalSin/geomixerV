L.Control.GmxHide = L.Control.GmxIcon.extend({
    options: {
        id: 'hide',
        isActive: true,
        togglable: true,
        notHide: true,
        position: 'topleft'
    },

    setActive: function (active, flagAll) {
        if (this._map) {
            var corners = this._map._controlContainer,
                hiddenClass = 'leaflet-control-gmx-hidden',
                func = active ? L.DomUtil.removeClass : L.DomUtil.addClass;

            for (var i = 0, len = corners.children.length; i < len; i++) {
                for (var j = 0, arr = corners.children[i].children, len1 = arr.length; j < len1; j++) {
                    var node = arr[j];
                    if (!node._notHide || flagAll) {
                        func(node, hiddenClass);
                    }
                }
            }
            this.options.isActive = !this.options.isActive;
			var use = this._container.getElementsByTagName('use');
			if (use && use.length) {
				var zn = (use[0].getAttribute('xlink:href') || '').replace(/-off$/, '');
				if (!this.options.isActive) { zn += '-off'; }
				use[0].setAttribute('href', zn);
			}
            this.fire('statechange');
        }
    },

    onAdd: function (map) {
        var container = L.Control.GmxIcon.prototype.onAdd.call(this, map),
            txt = 'Hide/Show';

        if (L.gmxLocale) {
            txt = L.gmxLocale.addText({
                'eng': {hide: txt},
                'rus': {hide: 'Скрыть/Показать'}
            }).getText('hide');
        }
        container._id = this.options.id;
        container.title = txt;
        container._notHide = this.options.notHide;
        //L.DomUtil.addClass(container, 'leaflet-gmx-icon-sprite');
        return container;
    }
});
L.Control.gmxHide = L.Control.GmxHide;
L.control.gmxHide = function (options) {
  return new L.Control.GmxHide(options);
};
