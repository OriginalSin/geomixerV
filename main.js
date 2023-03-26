import './lib/main.js'
import './viewer/Sidebar/SidebarControl.js'
import './viewer/Sidebar/Sidebar.css'
import './viewer/viewer.css'
// import './viewer/index.js'
import LayersTree from './viewer/LayersTree/LayersTree.svelte';
import { _layerTree } from './viewer/stores.js';

const addControls = (map) => {
	map.gmxControlsManager.init({
		// gmxLoaderStatus: true,
		gmxHide: true,
		gmxZoom: true,
		gmxBottom: true,
		gmxCopyright: true,
		gmxLogo: true,
		gmxDrawing: { id: 'drawing', drawOptions: {showPointsNum: true, minPoints: 0, skipEqual: true} },
		gmxLocation: {gmxPopup: 'window'},
		gmxCenter: {color: 'red'}
	});
        // DEFAULT = ['gmxLoaderStatus', 'gmxHide', 'gmxZoom', 'gmxDrawing', 'gmxBottom', 'gmxLocation', 'gmxCopyright', 'gmxCenter', 'gmxLogo'];
	// map.gmxControlsManager.init(L.control.gmxZoom({}).addTo(map));

	map.addControl(L.control.gmxIcon({
			id: 'refresh-gif',
			regularImageUrl: '',
			title: 'Статус загрузки'
		})
		.on('statechange', function (ev) {
			console.log("active", ev);
		})
	);
        // let gmxLocation = L.control.gmxLocation({gmxPopup: 'window'});
        // map.addControl(gmxLocation);
	// map.addControl(L.control.gmxHide());
	map.addControl(L.control.gmxIcon({
			id: 'gmxprint',
			svgSprite: true,
			// togglable: true,
			title: 'Печать'
		})
		.on('click', function (ev) {
			// const target = ev.target;
			// const flag = target.options.isActive;
			const flag = true;
			const body = document.body;
			if (flag) body.classList.add('printMap');
			else body.classList.remove('printMap');

			console.log("active", flag);
		})
	);
/*
map.addControl(L.control.gmxDrawing({ id: 'drawing', drawOptions: {showPointsNum: true, minPoints: 0, skipEqual: true} }));
		// map.gmxDrawing.once('drawstop', ev => {
		map.gmxDrawing.on('change', ev => {
// let type = ev.type;
			// if (type === 'drawstop' && ev.op !== 'pointRemove') {
console.log(ev.type, ev);
		});
*/
	// map.addControl(L.control.gmxCenter({color: 'red'}));
	let sidebar = L.control.gmxSidebar({
		id: 'sidebar',
		position: 'topleft',
		addBefore: true
		// addBefore: map.getContainer()
	});
	sidebar.addTab('tree', {iconId: 's-tree', panSvelte: LayersTree});
	sidebar.addTab('forest', {iconId: 's-forest-plugin'});
	// sidebar.setCurrent('forest');

	map.gmxControlsManager.add(sidebar);
	map.addControl(sidebar);
	// sidebar.remove();
};

const map = new L.Map(document.querySelector('#app'),
	{
		layers: [
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'})
		],
		drawOptions: {showPointsNum: true},
		squareUnit: 'km2',
		distanceUnit: 'km',
		center: new L.LatLng(50, 20),
			attributionControl: false,
			zoomControl: false,
		zoom: 3
	}
);
L.gmx.map = map;
let geo_ = {
    "type": "Polygon",
    "coordinates":
	// null
	[
	[
            [10, 0]
            ,[10, 10]
            ,[0, 10]
            ,[0, 0]
            ,[10, 0]
	]
	,
	[
            [8, 5]
            ,[5, 8]
            ,[8, 8]
            ,[8, 5]
	]
	]
};
let geoml = {
    // "type": "LineString",
    "type": "MultiLineString",
    "coordinates":
	// null
	[
	[
            [10, 0]
            ,[10, 10]
            ,[0, 10]
            ,[0, 0]
            ,[10, 1]
	]
	,
	[
            [8, 5]
            ,[5, 8]
            ,[8, 8]
            ,[8, 6]
	]
	]
};
let geo = {
    "type": "LineString",
    "coordinates":
	// null
	[
            [10, 0]
            ,[10, 10]
            ,[0, 10]
            ,[0, 0]
            ,[10, 0]
	]
};

let area = L.gmxUtil.geoJSONGetArea(geo);
console.log('area', area);
let length1 = L.gmxUtil.geoJSONGetLength(geo_);
let length = L.gmxUtil.geoJSONGetLength(geoml);
console.log('length', length, length1);

let tt = L.geoJson(geoml);
L.gmx.gmxDrawing.addGeoJSON(tt, {showPointsNum: true});
// map.gmxDrawing.options.skipEqual = true;
// map.addControl(new L.Control.gmxDrawing({ id: 'drawing', drawOptions: {showPointsNum: true, minPoints: 0, skipEqual: true} }));
/*			
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
*/

const mapId = 'FEZ2G';
L.gmx.loadMap(mapId, {
	// leafletMap: map,
	hostName: '/',
	setZIndex: true,
	disableCache: true,
	// gmxEndPoints: gmxEndPoints
}).then(gmxMap => {
		// _layerTree.set(gmxMap);
	L.gmxMapProps = gmxMap;
addControls(map);
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

			const options = {
				contextmenuItems: [
					{ text: 'Включить для прилипания', callback: prilip },
					{ text: 'Отключить прилипание', callback: prilipOff },
				]
			};
			obj.bindContextMenu(options);

		}
	});
});
	const prilipOff = (ev) => {
		map.gmxDrawing.getFeatures().forEach(it => {
			if (it.options.prilipObj) it.remove();
		});
	}
	const prilip = (ev) => {
		let target = ev.relatedTarget._gmx.lastMouseover.target,
			it = target.item.properties,
			geo = it[it.length - 1],
			geoJson = L.geoJson(L.gmxUtil.geometryToGeoJSON(geo, true, true)).getLayers()[0];
		map.gmxDrawing.add(geoJson.feature , {
			editable: false,
			prilipObj: true,
			id: target.id
		});
	};
