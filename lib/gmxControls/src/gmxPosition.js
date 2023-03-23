L.Map.addInitHook(function () {
    var corners = this._controlCorners,
        parent = this._controlContainer,
        tb = 'leaflet-top leaflet-bottom',
        lr = 'leaflet-left leaflet-right',
        classNames = {
            bottom: 'gmx leaflet-bottom ' + lr,
            gmxbottomleft: 'gmx leaflet-bottom leaflet-left',
            gmxbottomcenter: 'gmx leaflet-bottom ' + lr,
            gmxbottomright: 'gmx leaflet-bottom leaflet-right',
            center: tb + ' gmx ' + lr,
            right:  'gmx leaflet-right ' + tb,
            left:   'gmx leaflet-left ' + tb,
            top:    'gmx leaflet-top ' + lr
        };

    for (var key in classNames) {
        if (!corners[key]) {
            corners[key] = L.DomUtil.create('div', classNames[key], parent);
        }
    }
	corners.document = document.body;
});
