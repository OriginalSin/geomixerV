import './lib/main.js'

const map = new L.Map(document.querySelector('#app'),
	{
		layers: [
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'})
		],
		drawOptions: {showPointsNum: true},
		squareUnit: 'km2',
		distanceUnit: 'km',
		center: new L.LatLng(50, 20),
		zoomControl: true,
		zoom: 3
	}
);
// map.gmxDrawing.options.skipEqual = true;
map.addControl(new L.Control.gmxDrawing({ id: 'drawing', drawOptions: {minPoints: 0, skipEqual: true} }));
		// map.gmxDrawing.once('drawstop', ev => {
		map.gmxDrawing.on('add drawstop edit', ev => {
let geo = ev.object.toGeoJSON(false);
let type = ev.type;
// console.log(type, geo.geometry.coordinates);
			if (type === 'add') {
			// if (ev.mode !== 'add') {
// console.log('add', ev, geo.geometry.coordinates);
			} else if (type === 'edit') {
// console.log('drawstop', ev, geo.geometry.coordinates);
			}
// console.log('drawstop', ev.object.mode, ev.object.toGeoJSON().geometry.coordinates[0]);
			// if (gmxDrawing._saveFeature) gmxDrawing._saveFeature(ev.object, true);
			// map._gmxEventsManager._drawstart = false;
		});

const mapId = 'FEZ2G';
L.gmx.loadMap(mapId, {
	// leafletMap: map,
	hostName: '/',
	setZIndex: true,
	disableCache: true,
	// gmxEndPoints: gmxEndPoints
}).then(gmxMap => {
	const mprops = gmxMap.properties || {};
	const mbounds = L.latLngBounds([mprops.MinViewY || 57, mprops.MinViewX || 22], [mprops.MaxViewY || 68, mprops.MaxViewX || 58]);
	// map.setMaxBounds(mbounds);
	// map.setMinZoom(mprops.MinZoom || 6);
	map.invalidateSize();
	map.options.distanceUnit = mprops.DistanceUnit;
	map.options.squareUnit = mprops.SquareUnit;
	// map.options._gmxEndPoints = gmxEndPoints;
	gmxMap.layers.forEach(obj => {
		const rprop = obj._gmx.rawProperties;
		const meta = rprop.MetaProperties;
		if (rprop.visible) {
			map.addLayer(obj);
			map.fitBounds(obj.getBounds());
console.log('rprop', rprop);
		}
	});
});
