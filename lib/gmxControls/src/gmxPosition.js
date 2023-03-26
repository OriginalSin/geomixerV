L.Map.addInitHook(function () {
    var corners = this._controlCorners,
        parent = this._controlContainer,
        tb = 'leaflet-top leaflet-bottom',
        lr = 'leaflet-left leaflet-right',
        classNames = {
            bottom: 'bottom leaflet-bottom ' + lr,
            gmxbottomleft: 'gmxbottomleft leaflet-bottom gmx leaflet-left',
            gmxbottomcenter: 'gmxbottomcenter leaflet-bottom gmx ' + lr,
            gmxbottomright: 'gmxbottomright leaflet-bottom gmx leaflet-right',
            center: 'center ' + tb + ' ' + lr,
            right:  'right leaflet-right ' + tb,
            left:   'left leaflet-left ' + tb,
            top:    'top leaflet-top ' + lr
        };

    for (var key in classNames) {
        if (!corners[key]) {
            corners[key] = L.DomUtil.create('div', classNames[key], parent);
        }
    }
	corners.document = document.body;
});
